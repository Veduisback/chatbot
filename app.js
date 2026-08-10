const API_URL = "https://chatbot-eqq8.onrender.com";

/* =========================================================
   ELEMENTS
========================================================= */
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const stopButton = document.getElementById("stopButton");
const messagesContainer = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const statusElement = document.getElementById("status");
const demoSuccess = document.getElementById("demoSuccess");
const demoError = document.getElementById("demoError");
const suggestionGrid = document.getElementById("suggestionGrid");

/* =========================================================
   STATE
========================================================= */
let conversation = [];
let controller = null;
let isGenerating = false;
let lifecycleTimer = null;
let lastSubmittedText = "";

/* =========================================================
   SUGGESTION CHIPS INTERACTION
========================================================= */
if (suggestionGrid) {
  suggestionGrid.addEventListener("click", (event) => {
    const chip = event.target.closest(".suggestion-chip");
    if (!chip) return;

    const promptText = chip.getAttribute("data-prompt") || chip.innerText.trim();
    if (promptText && messageInput && !isGenerating) {
      messageInput.value = promptText;
      setInputHeight();
      messageInput.focus();
      chatForm.requestSubmit();
    }
  });
}

/* =========================================================
   MESSAGE UI
========================================================= */
function addMessage(role, content = "") {
  if (welcome) {
    welcome.style.display = "none";
  }

  const wrapper = document.createElement("div");
  wrapper.className = `message ${role} ${role === "user" ? "reveal-right" : "reveal-left"}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "You" : "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);

  messagesContainer.appendChild(wrapper);

  // Trigger reveal animation instantly for messages
  requestAnimationFrame(() => {
    wrapper.classList.add("active");
  });

  scrollToBottom();

  return bubble;
}

/* =========================================================
   SCROLL
========================================================= */
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/* =========================================================
   BUTTON & LIFECYCLE STATES
========================================================= */
function clearLifecycleStates() {
  sendButton.classList.remove(
    "is-loading",
    "is-success",
    "is-error",
    "shake"
  );

  if (lifecycleTimer) {
    clearTimeout(lifecycleTimer);
    lifecycleTimer = null;
  }
}

function setButtonState(state) {
  clearLifecycleStates();

  if (state === "loading") {
    sendButton.classList.add("is-loading");
    sendButton.disabled = true;
    sendButton.setAttribute("aria-label", "Sending message");
    return;
  }

  if (state === "success") {
    sendButton.classList.add("is-success");
    sendButton.disabled = true;
    sendButton.setAttribute("aria-label", "Message sent");
    return;
  }

  if (state === "error") {
    sendButton.classList.add("is-error", "shake");
    sendButton.disabled = false;
    sendButton.setAttribute("aria-label", "Retry sending message");

    setTimeout(() => {
      sendButton.classList.remove("shake");
    }, 380);

    return;
  }

  sendButton.disabled = false;
  sendButton.setAttribute("aria-label", "Send");
}

/* =========================================================
   GENERATION STATE
========================================================= */
function setGenerating(value) {
  isGenerating = value;
  messageInput.disabled = value;
  stopButton.hidden = !value;

  if (value) {
    setButtonState("loading");
    if (statusElement) statusElement.textContent = "Generating...";
  } else {
    if (statusElement) statusElement.textContent = "Ready";
  }
}

/* =========================================================
   SUCCESS / ERROR HANDLERS
========================================================= */
function showSuccess() {
  setButtonState("success");
  if (statusElement) statusElement.textContent = "Sent";

  lifecycleTimer = setTimeout(() => {
    setButtonState("idle");
    if (statusElement) statusElement.textContent = "Ready";
    messageInput.focus();
  }, 1100);
}

function showError() {
  setButtonState("error");
  if (statusElement) statusElement.textContent = "Failed — retry";
}

/* =========================================================
   TEXTAREA AUTO-RESIZE
========================================================= */
function setInputHeight() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 180) + "px";
}

messageInput.addEventListener("input", setInputHeight);

/* =========================================================
   ENTER TO SEND
========================================================= */
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (!isGenerating) {
      chatForm.requestSubmit();
    }
  }
});

/* =========================================================
   SEND & STREAMING LOGIC
========================================================= */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isGenerating) {
    return;
  }

  let text = messageInput.value.trim();

  // Retry previous failed message if in error state
  if (sendButton.classList.contains("is-error")) {
    text = lastSubmittedText || text;
  }

  if (!text) {
    return;
  }

  clearLifecycleStates();
  lastSubmittedText = text;

  messageInput.value = "";
  setInputHeight();

  conversation.push({
    role: "user",
    content: text
  });

  addMessage("user", text);

  const assistantBubble = addMessage("assistant", "");
  assistantBubble.classList.add("streaming");

  controller = new AbortController();
  setGenerating(true);

  let assistantText = "";

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let errorMessage = "Something went wrong.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Streaming is not supported.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const lines = event.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "error") {
              throw new Error(parsed.error || "Generation failed.");
            }

            if (parsed.content) {
              assistantText += parsed.content;
              assistantBubble.textContent = assistantText;
              scrollToBottom();
            }
          } catch (error) {
            if (error.message && !error.message.includes("Unexpected token")) {
              throw error;
            }
          }
        }
      }
    }

    conversation.push({
      role: "assistant",
      content: assistantText
    });

    assistantBubble.classList.remove("streaming");
    showSuccess();

  } catch (error) {
    if (error.name === "AbortError") {
      conversation.push({
        role: "assistant",
        content: assistantText
      });

      if (!assistantText) {
        assistantBubble.textContent = "Generation stopped.";
      }

      assistantBubble.classList.remove("streaming");
      clearLifecycleStates();
      if (statusElement) statusElement.textContent = "Stopped";

    } else {
      assistantBubble.classList.add("error");
      assistantBubble.textContent = error.message || "Failed to generate a response.";
      assistantBubble.classList.remove("streaming");
      showError();
    }

  } finally {
    controller = null;
    isGenerating = false;
    messageInput.disabled = false;
    stopButton.hidden = true;

    if (
      !sendButton.classList.contains("is-success") &&
      !sendButton.classList.contains("is-error")
    ) {
      setButtonState("idle");
    }

    messageInput.focus();
  }
});

/* =========================================================
   STOP GENERATION
========================================================= */
stopButton.addEventListener("click", () => {
  if (controller) {
    controller.abort();
  }
});

/* =========================================================
   DEMO SUCCESS CONTROL
========================================================= */
if (demoSuccess) {
  demoSuccess.addEventListener("click", async () => {
    if (isGenerating) return;
    setGenerating(true);
    if (statusElement) statusElement.textContent = "Demo: loading...";

    const delay = 800 + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, delay));

    setGenerating(false);
    showSuccess();
  });
}

/* =========================================================
   DEMO ERROR CONTROL
========================================================= */
if (demoError) {
  demoError.addEventListener("click", async () => {
    if (isGenerating) return;
    setGenerating(true);
    if (statusElement) statusElement.textContent = "Demo: loading...";

    const delay = 600 + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, delay));

    setGenerating(false);
    showError();
  });
}

/* =========================================================
   CUSTOM SPACE THEME CURSOR & TRAILING STARDUST PARTICLES
========================================================= */
(() => {
  const cursorEl = document.getElementById("space-cursor");
  const particleCanvas = document.getElementById("cursor-particle-canvas");
  if (!cursorEl || !particleCanvas) return;

  const ctx = particleCanvas.getContext("2d");
  let width = (particleCanvas.width = window.innerWidth);
  let height = (particleCanvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = particleCanvas.width = window.innerWidth;
    height = particleCanvas.height = window.innerHeight;
  });

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const particles = [];

  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Spawn stardust particle on cursor movement
    if (Math.random() < 0.65) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6 - 0.4,
        size: Math.random() * 2.8 + 1,
        color: Math.random() > 0.45 ? "#38bdf8" : "#ec4899",
        alpha: 1,
        life: Math.random() * 25 + 20
      });
    }
  });

  // Hover detection for cursor scaling
  const bindHoverEvents = () => {
    const interactiveElements = document.querySelectorAll(
      "button, input, textarea, a, .suggestion-chip, .showcase-card"
    );
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", () => cursorEl.classList.add("is-hovering"));
      el.addEventListener("mouseleave", () => cursorEl.classList.remove("is-hovering"));
    });
  };

  bindHoverEvents();
  const observer = new MutationObserver(bindHoverEvents);
  observer.observe(document.body, { childList: true, subtree: true });

  // Render loop for space cursor physics & particle trails
  function renderCursor() {
    // Smooth lerp for outer ring physics
    cursorPos.x += (mouse.x - cursorPos.x) * 0.22;
    cursorPos.y += (mouse.y - cursorPos.y) * 0.22;

    cursorEl.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0) translate(-50%, -50%)`;

    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderCursor);
  }

  requestAnimationFrame(renderCursor);
})();

/* =========================================================
   SCROLL REVEAL OBSERVER (LEFT & RIGHT TO CENTER)
========================================================= */
(() => {
  const observerOptions = {
    root: document.getElementById("messages"),
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  }, observerOptions);

  const initRevealElements = () => {
    const revealElements = document.querySelectorAll(".reveal-left, .reveal-right");
    revealElements.forEach((el) => revealObserver.observe(el));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRevealElements);
  } else {
    initRevealElements();
  }
})();

/* =========================================================
   INITIALIZATION
========================================================= */
setGenerating(false);
setButtonState("idle");
setInputHeight();
messageInput.focus();
