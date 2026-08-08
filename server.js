const express = require("express");
const path = require("path");
const { fileURLToPath } = require("url");
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

const app = express();

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-5.3-chat";

if (!OPENROUTER_API_KEY) {
  console.warn(
    "WARNING: OPENROUTER_API_KEY is not configured."
  );
}

app.use(express.json({ limit: "1mb" }));

app.use(express.static(__dirname));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    configured: Boolean(OPENROUTER_API_KEY),
  });
});

app.post("/api/chat", async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "OpenRouter API key is not configured.",
    });
  }

  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Messages must be a non-empty array.",
    });
  }

  const safeMessages = messages
    .filter(
      (message) =>
        message &&
        (message.role === "user" ||
          message.role === "assistant") &&
        typeof message.content === "string"
    )
    .slice(-30);

  if (safeMessages.length === 0) {
    return res.status(400).json({
      error: "No valid messages were provided.",
    });
  }

  const abortController = new AbortController();

  // If the browser stops the request, also stop the
  // upstream OpenRouter request.
  req.on("close", () => {
    abortController.abort();
  });

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.SITE_URL || "http://localhost:3000",
          "X-Title":
            process.env.SITE_NAME || "AI Chat",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: safeMessages,
          stream: true,
          temperature: 0.7,
        }),
        signal: abortController.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "OpenRouter error:",
        response.status,
        errorText
      );

      return res.status(response.status).json({
        error: "OpenRouter request failed.",
      });
    }

    if (!response.body) {
      return res.status(500).json({
        error: "OpenRouter did not return a stream.",
      });
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, {
          stream: true,
        });

        const lines = chunk.split("\n");

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
          } catch {
            // Ignore malformed/incomplete SSE chunks.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (error.name === "AbortError") {
      // Client stopped generation.
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

    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`AI Chat running on port ${PORT}`);
});
