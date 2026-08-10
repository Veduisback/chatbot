javascript
const API_URL = "https://chatbot-eqq8.onrender.com";

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const stopButton = document.getElementById("stopButton");
const messagesContainer = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const statusElement = document.getElementById("status");
const demoSuccess = document.getElementById("demoSuccess");
const demoError = document.getElementById("demoError");

let conversation = [];
let controller = null;
let isGenerating = false;
let lifecycleTimer = null;
let lastSubmittedText = "";


/* =========================================================
   MESSAGE UI
   ========================================================= */

function addMessage(role, content = "") {
  if (welcome) {
    welcome.remove();
  }

  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  wrapper.appendChild(bubble);
  messagesContainer.appendChild(wrapper);

  scrollToBottom();

  return bubble;
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {
  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;
}


/* =========================================================
   BUTTON STATE
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

    sendButton.setAttribute(
      "aria-label",
      "Sending message"
    );

    return;
  }

  if (state === "success") {
    sendButton.classList.add("is-success");
    sendButton.disabled = true;

    sendButton.setAttribute(
      "aria-label",
      "Message sent"
    );

    return;
  }

  if (state === "error") {
    sendButton.classList.add(
      "is-error",
      "shake"
    );

    sendButton.disabled = false;

    sendButton.setAttribute(
      "aria-label",
      "Retry sending message"
    );

    setTimeout(() => {
      sendButton.classList.remove("shake");
    }, 380);

    return;
  }

  // Idle
  sendButton.disabled = false;

  sendButton.setAttribute(
    "aria-label",
    "Send message"
  );
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
    statusElement.textContent = "Generating...";
  } else {
    statusElement.textContent = "Ready";
  }
}


/* =========================================================
   SUCCESS
   ========================================================= */

function showSuccess() {
  setButtonState("success");

  statusElement.textContent = "Sent";

  lifecycleTimer = setTimeout(() => {
    setButtonState("idle");

    statusElement.textContent = "Ready";

    messageInput.focus();
  }, 1100);
}


/* =========================================================
   ERROR
   ========================================================= */

function showError() {
  setButtonState("error");

  statusElement.textContent = "Failed — retry";
}


/* =========================================================
   TEXTAREA
   ========================================================= */

function setInputHeight() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      180
    ) + "px";
}


messageInput.addEventListener(
  "input",
  setInputHeight
);


/* =========================================================
   ENTER TO SEND
   ========================================================= */

messageInput.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!isGenerating) {
        chatForm.requestSubmit();
      }
    }
  }
);


/* =========================================================
   SEND MESSAGE
   ========================================================= */

chatForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    let text = messageInput.value.trim();

    // Retry the previous message after an error.
    if (
      sendButton.classList.contains("is-error")
    ) {
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

    const assistantBubble =
      addMessage("assistant", "");

    assistantBubble.classList.add(
      "streaming"
    );

    controller = new AbortController();

    setGenerating(true);

    let assistantText = "";

    try {
      const response = await fetch(
        `${API_URL}/api/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            messages: conversation
          }),

          signal: controller.signal
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Something went wrong.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error ||
            errorMessage;
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this browser."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let buffer = "";

      while (true) {
        const {
          value,
          done
        } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(
          value,
          {
            stream: true
          }
        );

        buffer = buffer.replace(
          /\r\n/g,
          "\n"
        );

        const events =
          buffer.split("\n\n");

        buffer =
          events.pop() || "";

        for (const event of events) {
          const lines =
            event.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) {
              continue;
            }

            const data =
              line.slice(5).trim();

            if (
              !data ||
              data === "[DONE]"
            ) {
              continue;
            }

            let parsed;

            try {
              parsed = JSON.parse(data);
            } catch {
              // Ignore malformed chunks.
              continue;
            }

            if (parsed.type === "error") {
              throw new Error(
                parsed.error ||
                "Generation failed."
              );
            }

            if (parsed.content) {
              assistantText +=
                parsed.content;

              assistantBubble.textContent =
                assistantText;

              scrollToBottom();
            }
          }
        }
      }

      conversation.push({
        role: "assistant",
        content: assistantText
      });

      assistantBubble.classList.remove(
        "streaming"
      );

      showSuccess();

    } catch (error) {
      if (
        error.name === "AbortError"
      ) {
        conversation.push({
          role: "assistant",
          content: assistantText
        });

        if (!assistantText) {
          assistantBubble.textContent =
            "Generation stopped.";
        }

        assistantBubble.classList.remove(
          "streaming"
        );

        clearLifecycleStates();

        statusElement.textContent =
          "Stopped";

      } else {
        assistantBubble.classList.add(
          "error"
        );

        assistantBubble.textContent =
          error.message ||
          "Failed to generate a response.";

        assistantBubble.classList.remove(
          "streaming"
        );

        showError();
      }

    } finally {
      controller = null;

      isGenerating = false;

      messageInput.disabled = false;

      stopButton.hidden = true;

      if (
        !sendButton.classList.contains(
          "is-success"
        ) &&
        !sendButton.classList.contains(
          "is-error"
        )
      ) {
        setButtonState("idle");
      }

      messageInput.focus();
    }
  }
);


/* =========================================================
   STOP GENERATION
   ========================================================= */

stopButton.addEventListener(
  "click",
  () => {
    if (controller) {
      controller.abort();
    }
  }
);


/* =========================================================
   DEMO SUCCESS
   ========================================================= */

demoSuccess.addEventListener(
  "click",
  async () => {
    if (isGenerating) {
      return;
    }

    setGenerating(true);

    statusElement.textContent =
      "Demo: loading...";

    const delay =
      900 +
      Math.random() * 900;

    await new Promise(
      (resolve) => {
        setTimeout(resolve, delay);
      }
    );

    setGenerating(false);

    showSuccess();
  }
);


/* =========================================================
   DEMO ERROR
   ========================================================= */

demoError.addEventListener(
  "click",
  async () => {
    if (isGenerating) {
      return;
    }

    setGenerating(true);

    statusElement.textContent =
      "Demo: loading...";

    const delay =
      700 +
      Math.random() * 800;

    await new Promise(
      (resolve) => {
        setTimeout(resolve, delay);
      }
    );

    setGenerating(false);

    showError();
  }
);


/* =========================================================
   INITIAL STATE
   ========================================================= */

setGenerating(false);
setButtonState("idle");
setInputHeight();

