const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-5.3-chat";

/* =========================================================
CORS
========================================================= */

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "[https://veduisback.github.io](https://veduisback.github.io)"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* =========================================================
JSON BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "1mb",
  })
);

/* =========================================================
ROOT ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "AI Chat API",
  });
});

/* =========================================================
HEALTH CHECK
========================================================= */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    configured: Boolean(OPENROUTER_API_KEY),
  });
});

/* =========================================================
CHAT ENDPOINT
========================================================= */

app.post("/api/chat", async (req, res) => {
  /* ---------------------------------
  Check API key
  --------------------------------- */

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "OpenRouter API key is not configured.",
    });
  }

  /* ---------------------------------
  Validate messages
  --------------------------------- */

  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Messages must be a non-empty array.",
    });
  }

  /* ---------------------------------
  Sanitize conversation
  --------------------------------- */

  const safeMessages = messages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    )
    .slice(-30);

  if (safeMessages.length === 0) {
    return res.status(400).json({
      error: "No valid messages were provided.",
    });
  }

  /* ---------------------------------
  Abort controller
  Allows the OpenRouter request to
  stop when the client disconnects.
  --------------------------------- */

  const controller = new AbortController();

  res.on("close", () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });

  try {
    console.log("Sending request to OpenRouter...");
    console.log("Model:", MODEL);
    console.log("Messages:", safeMessages.length);

    /* ---------------------------------
    OpenRouter request
    --------------------------------- */

    const response = await fetch(
      "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.SITE_URL ||
            "[https://veduisback.github.io/chatbot/](https://veduisback.github.io/chatbot/)",
          "X-Title": process.env.SITE_NAME || "AI Chat",
        },

        body: JSON.stringify({
          model: MODEL,
          messages: safeMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        }),

        signal: controller.signal,
      }
    );

    console.log("OpenRouter status:", response.status);

    /* ---------------------------------
    Handle OpenRouter errors
    --------------------------------- */

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "OpenRouter error:",
        response.status,
        errorText
      );

      return res.status(response.status).json({
        error: "OpenRouter request failed: " + errorText,
      });
    }

    /* ---------------------------------
    Verify response stream
    --------------------------------- */

    if (!response.body) {
      return res.status(500).json({
        error: "OpenRouter did not return a stream.",
      });
    }

    /* =====================================================
    SERVER-SENT EVENTS
    ===================================================== */

    res.status(200);

    res
