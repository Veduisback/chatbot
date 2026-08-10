# SPEC.md

# Streaming AI Chat — Product Specification

## 1. Target User

The primary user is someone who wants to interact with an AI assistant through a simple web-based chat interface without installing software.

The project is also designed as a technical portfolio demonstration, showing how a frontend, backend, AI API, streaming responses, and accessible UI can work together in a real deployed application.

## 2. Core Flow

The main user flow is:

1. User opens the deployed chatbot.
2. User enters a message in the chat input.
3. User presses **Send** or presses **Enter**.
4. The frontend sends the conversation history to the Express backend through `POST /api/chat`.
5. The backend validates the messages and sends them to the configured OpenRouter model.
6. OpenRouter returns the AI response as a stream.
7. The backend forwards the streamed response to the frontend using Server-Sent Events.
8. The frontend progressively displays the response as it arrives.
9. The conversation is kept in frontend memory so later messages can use previous turns.
10. The user can press **Stop** while generation is active; an `AbortController` cancels the request and preserves any response already received.

## 3. Screens / UI

The application is intentionally a single-screen chatbot rather than a multi-page product.

### Main Chat Screen

Contains:

* Application title and generation status
* Welcome message
* Conversation/message area
* User and assistant message bubbles
* Message input
* Send button
* Stop-generation button
* Success/error states for the Send button
* Interactive animated background

The interface is responsive and adapts to mobile screens.

### Interaction States

The primary controls have visible states for:

* Ready
* Generating
* Sent
* Failed / Retry
* Stopped

The interface also includes keyboard interaction and accessibility-focused status messaging.

## 4. Data Sources

The chatbot does not use a database or external knowledge base.

The primary data source is:

**User-provided conversation messages**

These messages are stored temporarily in the frontend's `conversation` array and sent to the backend with each chat request.

The AI response comes from the configured **OpenRouter model**.

Environment variables provide configuration such as:

* `OPENROUTER_API_KEY`
* `OPENROUTER_MODEL`
* `SITE_URL`
* `SITE_NAME`

The OpenRouter API key remains on the backend and is not exposed to the browser.

## 5. Where the AI Feature Lives

The AI feature is implemented across the frontend and backend.

### Frontend

`app.js`:

* Collects user messages
* Maintains conversation history
* Sends requests to `/api/chat`
* Reads the streaming response
* Updates the assistant message progressively
* Allows generation to be stopped

### Backend

`server.js`:

* Exposes `POST /api/chat`
* Validates incoming messages
* Reads the OpenRouter API key and model from environment variables
* Sends the conversation to OpenRouter
* Receives the model's streaming response
* Converts the stream into frontend-consumable SSE events

### AI Service

OpenRouter provides the actual AI model inference.

The application therefore follows:

```text
User
  ↓
Frontend
  ↓
POST /api/chat
  ↓
Express Backend
  ↓
OpenRouter
  ↓
AI Model
  ↓
Streaming Response
  ↓
Express Backend
  ↓
Frontend
  ↓
User
```

## 6. Out of Scope

The following are intentionally outside the current project scope:

* User authentication and accounts
* Persistent conversation history
* Database storage
* File uploads
* Image generation
* Voice input/output
* Multiple chat rooms
* Team/shared conversations
* Custom AI model training
* Retrieval-augmented generation
* External knowledge-base search
* Payment or subscription functionality
* Admin dashboard
* Multi-user personalization
* Advanced model selection UI

These may be considered future improvements, but they are not required for the current core product.

## 7. Success Criteria

The project is successful when a user can:

**Open the chatbot → enter a message → receive a streamed AI response → continue the conversation → stop generation when needed.**

The feature must work on the deployed frontend and communicate successfully with the deployed backend.
