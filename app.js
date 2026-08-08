const API_URL = "https://chatbot-eqq8.onrender.com";

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const stopButton = document.getElementById("stopButton");
const messagesContainer = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const statusElement = document.getElementById("status");

let conversation = [];
let controller = null;
let isGenerating = false;


/* -----------------------------
   Add message to UI
----------------------------- */

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


/* -----------------------------
   Scroll chat to bottom
----------------------------- */

function scrollToBottom() {

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;
}


/* -----------------------------
   Generation state
----------------------------- */

function setGenerating(value) {

  isGenerating = value;

  sendButton.style.display =
    value ? "none" : "block";

  stopButton.style.display =
    value ? "block" : "none";

  messageInput.disabled = value;

  statusElement.textContent =
    value ? "Generating..." : "Ready";
}


/* -----------------------------
   Textarea auto resize
----------------------------- */

function setInputHeight() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      180
    ) + "px";
}


/* -----------------------------
   Input events
----------------------------- */

messageInput.addEventListener(
  "input",
  setInputHeight
);


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


/* -----------------------------
   Submit message
----------------------------- */

chatForm.addEventListener(
  "submit",
  async (event) => {

    // VERY IMPORTANT:
    // Prevent browser page refresh.
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    const text =
      messageInput.value.trim();

    if (!text) {
      return;
    }


    /* -----------------------------
       Add user message
    ----------------------------- */

    messageInput.value = "";

    setInputHeight();

    conversation.push({
      role: "user",
      content: text,
    });

    addMessage(
      "user",
      text
    );


    /* -----------------------------
       Create assistant message
    ----------------------------- */

    const assistantBubble =
      addMessage(
        "assistant",
        ""
      );

    assistantBubble.classList.add(
      "streaming"
    );


    /* -----------------------------
       Create abort controller
    ----------------------------- */

    controller =
      new AbortController();

    setGenerating(true);

    let assistantText = "";


    try {

      /* -----------------------------
         Send request to Render
      ----------------------------- */

      const response =
        await fetch(
          `${API_URL}/api/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              messages: conversation,
            }),

            signal:
              controller.signal,
          }
        );


      /* -----------------------------
         Handle HTTP errors
      ----------------------------- */

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
          // Ignore JSON parsing errors.
        }

        throw new Error(
          errorMessage
        );
      }


      /* -----------------------------
         Check streaming support
      ----------------------------- */

      if (!response.body) {

        throw new Error(
          "Streaming is not supported by this browser."
        );
      }


      /* -----------------------------
         Read stream
      ----------------------------- */

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let buffer = "";


      while (true) {

        const {
          value,
          done,
        } = await reader.read();


        if (done) {
          break;
        }


        buffer +=
          decoder.decode(
            value,
            {
              stream: true,
            }
          );


        /*
         * Server sends SSE events
         * separated by blank lines.
         */

        const events =
          buffer.split("\n\n");

        buffer =
          events.pop() || "";


        for (const event of events) {

          const lines =
            event.split("\n");


          for (const line of lines) {

            if (
              !line.startsWith("data:")
            ) {
              continue;
            }


            const data =
              line
                .slice(5)
                .trim();


            if (
              !data ||
              data === "[DONE]"
            ) {
              continue;
            }


            try {

              const parsed =
                JSON.parse(data);


              if (
                parsed.type === "error"
              ) {

                throw new Error(
                  parsed.error
                );
              }


              if (parsed.content) {

                assistantText +=
                  parsed.content;

                assistantBubble.textContent =
                  assistantText;

                scrollToBottom();
              }

            } catch (error) {

              /*
               * Ignore malformed JSON
               * chunks.
               */

              if (
                error instanceof Error &&
                error.message !==
                  "Unexpected token"
              ) {

                throw error;
              }
            }
          }
        }
      }


      /* -----------------------------
         Save assistant response
      ----------------------------- */

      conversation.push({
        role: "assistant",
        content: assistantText,
      });


    } catch (error) {


      /* -----------------------------
         User stopped generation
      ----------------------------- */

      if (
        error.name ===
        "AbortError"
      ) {

        conversation.push({
          role: "assistant",
          content: assistantText,
        });


        if (!assistantText) {

          assistantBubble.textContent =
            "Generation stopped.";

        }

      } else {

        /* -----------------------------
           Normal error
        ----------------------------- */

        assistantBubble.classList.add(
          "error"
        );

        assistantBubble.textContent =
          error.message ||
          "Failed to generate a response.";
      }

    } finally {

      assistantBubble.classList.remove(
        "streaming"
      );

      controller = null;

      setGenerating(false);

      messageInput.focus();
    }
  }
);


/* -----------------------------
   Stop button
----------------------------- */

stopButton.addEventListener(
  "click",
  () => {

    if (controller) {

      controller.abort();

    }
  }
);


/* -----------------------------
   Initial state
----------------------------- */

setGenerating(false);

messageInput.focus();
