# Streaming AI Chat

A minimal AI chatbot built with vanilla HTML/CSS/JavaScript,
Node.js, Express, OpenRouter, and Render.

## Features

- Streaming AI responses
- Stop generation mid-response
- Multi-turn conversation
- Partial responses survive when generation is stopped
- API key stored server-side
- Mobile-friendly interface
- No database
- No Firebase
- No frontend framework

## Architecture

Browser
→ Express backend
→ OpenRouter API

The OpenRouter API key is never exposed to the browser.

## Local setup

### 1. Install dependencies

```bash
npm install
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
