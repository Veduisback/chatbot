# 🤖 Streaming AI Chat

A lightweight, responsive AI chatbot built from scratch using **HTML, CSS, JavaScript, Node.js, Express, and OpenRouter**.

The project demonstrates how a frontend can communicate with a backend AI service and display the model's response **token-by-token using streaming** instead of waiting for the entire response.

## 🚀 Live Demo

**Chatbot:**
https://veduisback.github.io/chatbot/

**Backend:**
https://chatbot-eqq8.onrender.com/

---

## ✨ Features

* ⚡ Real-time streaming AI responses
* 🛑 Stop generation while the AI is responding
* 💬 Multi-turn conversations
* 🔄 Preserves partial responses when generation is stopped
* 🔐 API key kept on the server
* 📱 Responsive mobile-friendly interface
* ⌨️ Keyboard-friendly chat interaction
* ♿ Accessible focus states and status messaging
* 🎨 Glass-style transparent chat interface
* 🧊 Interactive animated background
* ✅ Send button lifecycle:

  * Idle
  * Loading
  * Success
  * Error / Retry
* 🧪 Built-in demo controls for testing success/error states
* 🌐 Deployed frontend and backend

---

## 🧠 How It Works

The application uses a simple three-part architecture:

```text
User
  │
  ▼
Frontend
HTML + CSS + JavaScript
  │
  │ POST /api/chat
  ▼
Express Backend
  │
  │ OpenRouter API
  ▼
AI Model
  │
  │ Streaming response
  ▼
Express Backend
  │
  │ Server-Sent Events
  ▼
Frontend
  │
  ▼
User sees response in real time
```

The OpenRouter API key is stored as an environment variable on the backend and is **never sent to the browser**.

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Anime.js
* Responsive CSS
* Web APIs:

  * Fetch API
  * ReadableStream
  * AbortController
  * Server-Sent Events

### Backend

* Node.js
* Express.js
* Fetch API
* Server-Sent Events

### AI

* OpenRouter API
* Configurable OpenRouter model

The backend reads the model from:

```env
OPENROUTER_MODEL
```

and falls back to the configured default model when the variable is not provided.

### Deployment

* GitHub Pages — frontend
* Render — backend

---

## 📂 Project Structure

```text
chatbot/
│
├── index.html
├── style.css
├── app.js
│
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

### `index.html`

Contains the chatbot interface, message area, input box, send button, stop button, and demo controls.

### `style.css`

Handles:

* Layout
* Responsive design
* Glassmorphism UI
* Chat bubbles
* Button animations
* Loading/success/error states
* Interactive background
* Mobile styling
* Reduced-motion support

### `app.js`

Handles the frontend application logic:

* Sending messages
* Maintaining conversation history
* Reading the streaming response
* Updating the assistant message incrementally
* Stopping generation
* Error handling
* Button states
* UI interactions

### `server.js`

Provides the backend API.

Main endpoints:

```text
GET  /
GET  /health
POST /api/chat
```

The `/api/chat` endpoint validates the conversation, sends it to OpenRouter, and streams the response back to the frontend.

---

## 🔄 Streaming Response

Instead of waiting for the complete AI response:

```text
"Hello! How can I help you today?"
```

the backend forwards the response progressively:

```text
Hello
Hello!
Hello! How
Hello! How can
Hello! How can I
Hello! How can I help
...
```

The frontend reads the response using a `ReadableStream` and updates the assistant message as new content arrives.

This creates a more responsive chatbot experience.

---

## 🛑 Stop Generation

The chatbot uses `AbortController` to allow the user to stop an active generation.

When the user presses **Stop**:

```text
User
 │
 ▼
Stop button
 │
 ▼
AbortController
 │
 ▼
Frontend request cancelled
 │
 ▼
Backend detects disconnected response
 │
 ▼
OpenRouter request aborted
```

If some text has already arrived, the partial response is retained in the conversation.

---

## 🔐 Environment Variables

Create a `.env` file locally or configure the variables in your Render backend.

Example:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=your_model_here
SITE_URL=https://veduisback.github.io/chatbot/
SITE_NAME=AI Chat
```

### Important

**Never commit your real API key to GitHub.**

The `.env` file should remain ignored by Git.

If an API key has accidentally been committed, revoke/rotate it immediately and remove the secret from the repository history.

---

## 💻 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Veduisback/chatbot.git
cd chatbot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env
```

Add:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=your_model_here
```

### 4. Start the server

```bash
npm start
```

The backend will run on:

```text
http://localhost:3000
```

### Development mode

```bash
npm run dev
```

---

## 🧪 Testing

The project includes testing dependencies for unit and browser-level testing.

Run the test suite with:

```bash
npm test
```

Run tests once:

```bash
npm run test:run
```

Run end-to-end tests:

```bash
npm run test:e2e
```

---

## ♿ Accessibility

Accessibility was considered as part of the interface design.

The application includes:

* Keyboard-accessible controls
* Visible focus states
* Accessible labels
* `aria-label` attributes
* Polite status messaging
* Keyboard submission using Enter
* Shift + Enter for multiline messages
* Keyboard-reachable Stop control
* Reduced-motion support

The status area communicates states such as:

```text
Ready
Generating...
Sent
Failed — retry
Stopped
```

---

## 📱 Responsive Design

The interface adapts to smaller screens using responsive CSS.

Mobile-specific adjustments include:

* Smaller header
* Reduced message padding
* Wider chat bubbles
* Smaller controls
* Responsive cube/background
* Mobile-friendly composer
* Reduced demo controls on very small screens

---

## 🎨 UI

The interface uses a minimal dark/glass visual style.

The background includes an interactive 3D-style element that responds to pointer movement while remaining behind the chat interface.

The chat composer remains visually transparent enough for the animated background to remain visible.

---

## 📌 What I Learned

This project helped me understand more than simply calling an AI API.

Key concepts explored:

* Frontend ↔ backend communication
* REST API endpoints
* Environment variables
* API key security
* OpenRouter integration
* Streaming responses
* Server-Sent Events
* `ReadableStream`
* `AbortController`
* Multi-turn conversation state
* Error handling
* Responsive UI
* Accessibility
* Deployment with GitHub Pages and Render

---

## 🔮 Possible Future Improvements

Possible future improvements include:

* Markdown rendering
* Code syntax highlighting
* Conversation persistence
* Authentication
* Database-backed chat history
* Multiple model selection
* Token/cost tracking
* Better mobile interaction
* Automated accessibility testing
* Improved test coverage

---

## 👨‍💻 Author

**Vedang Jaiswal**

B.E. Computer Science & Engineering student at Bangalore Institute of Technology.

GitHub:
https://github.com/Veduisback

Portfolio:
https://veduisback.github.io/vedang-s_personal_portfolio/

---

## 📄 License

This project is intended primarily as a personal learning and portfolio project.
