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
    "https://veduisback.github.io"
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
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.SITE_URL ||
            "https://veduisback.github.io/chatbot/",
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

    res.setHeader(
      "Content-Type",
      "text/event-stream; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );

    res.setHeader("Connection", "keep-alive");

    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    /* ---------------------------------
    Stream reader
    --------------------------------- */

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) {
              continue;
            }

            const data = line.slice(5).trim();

            if (!data || data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content =
                parsed.choices?.[0]?.delta?.content;

              if (content) {
                res.write(
                  `data: ${JSON.stringify({
                    content,
                  })}\n\n`
                );
              }
            } catch (error) {
              console.error(
                "Failed to parse stream chunk:",
                error
              );
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!res.writableEnded) {
      res.write("data: [DONE]\n\n");
      res.end();
    }

    console.log("OpenRouter stream completed.");
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("OpenRouter request aborted.");

      if (!res.writableEnded) {
        res.end();
      }

      return;
    }

    console.error("Server error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to connect to OpenRouter.",
      });
    }

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: "Failed to connect to OpenRouter.",
        })}\n\n`
      );

      res.end();
    }
  }
});

/* =========================================================
START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(`AI Chat server running on port ${PORT}`);
});
