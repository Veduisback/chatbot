
const API_URL = "https://chatbot-eqq8.onrender.com";

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

const sendButton = document.getElementById("sendButton");
const stopButton = document.getElementById("stopButton");

const messagesContainer =
  document.getElementById("messages");

const welcome =
  document.getElementById("welcome");

const statusElement =
  document.getElementById("status");

const demoSuccess =
  document.getElementById("demoSuccess");

const demoError =
  document.getElementById("demoError");

let conversation = [];
let controller = null;
let isGenerating = false;
let lifecycleTimer = null;
let lastSubmittedText = "";

/* =========================================================
   ANIME.JS INTRO ANIMATION
========================================================= */

function playIntroAnimation() {

  if (
    typeof anime === "undefined"
  ) {
    console.warn(
      "Anime.js was not loaded."
    );

    return;
  }

  anime({
    targets: ".logo-dot",

    translateY: [
      {
        value: -12,
        duration: 400
      },
      {
        value: 0,
        duration: 500
      }
    ],

    scale: [
      {
        value: 0.6,
        duration: 0
      },
      {
        value: 1.2,
        duration: 400
      },
      {
        value: 1,
        duration: 500
      }
    ],

    opacity: [
      {
        value: 0,
        duration: 0
      },
      {
        value: 1,
        duration: 400
      }
    ],

    delay: anime.stagger(120),

    easing: "easeOutElastic(1, .6)"
  });


  anime({
    targets: ".welcome h1",

    opacity: [
      {
        value: 0,
        duration: 0
      },
      {
        value: 1,
        duration: 700
      }
    ],

    translateY: [
      {
        value: 20,
        duration: 0
      },
      {
        value: 0,
        duration: 700
      }
    ],

    delay: 450,

    easing: "easeOutCubic"
  });


  anime({
    targets: ".welcome p",

    opacity: [
      {
        value: 0,
        duration: 0
      },
      {
        value: 1,
        duration: 600
      }
    ],

    translateY: [
      {
        value: 12,
        duration: 0
      },
      {
        value: 0,
        duration: 600
      }
    ],

    delay: 650,

    easing: "easeOutCubic"
  });


  anime({
    targets: ".demo-info",

    opacity: [
      {
        value: 0,
        duration: 0
      },
      {
        value: 1,
        duration: 600
      }
    ],

    translateY: [
      {
        value: 10,
        duration: 0
      },
      {
        value: 0,
        duration: 600
      }
    ],

    delay: 800,

    easing: "easeOutCubic"
  });
}


/* =========================================================
   MESSAGE UI
========================================================= */

function addMessage(
  role,
  content = ""
) {

  if (welcome) {
    welcome.remove();
  }

  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message ${role}`;

  const bubble =
    document.createElement("div");

  bubble.className =
    "bubble";

  bubble.textContent =
    content;

  wrapper.appendChild(bubble);

  messagesContainer.appendChild(
    wrapper
  );

  /*
   * Animate newly created messages
   * using Anime.js.
   */

  if (
    typeof anime !== "undefined"
  ) {

    anime({
      targets: wrapper,

      opacity: [
        0,
        1
      ],

      translateY: [
        12,
        0
      ],

      duration: 350,

      easing: "easeOutCubic"
    });

  }

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

    clearTimeout(
      lifecycleTimer
    );

    lifecycleTimer = null;
  }
}


function setButtonState(state) {

  clearLifecycleStates();

  if (state === "loading") {

    sendButton.classList.add(
      "is-loading"
    );

    sendButton.disabled = true;

    sendButton.setAttribute(
      "aria-label",
      "Sending message"
    );

    return;
  }


  if (state === "success") {

    sendButton.classList.add(
      "is-success"
    );

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

      sendButton.classList.remove(
        "shake"
      );

    }, 380);

    return;
  }


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

  messageInput.disabled =
    value;

  stopButton.hidden =
    !value;

  if (value) {

    setButtonState(
      "loading"
    );

    statusElement.textContent =
      "Generating...";

  } else {

    statusElement.textContent =
      "Ready";
  }
}


/* =========================================================
   SUCCESS
========================================================= */

function showSuccess() {

  setButtonState(
    "success"
  );

  statusElement.textContent =
    "Sent";


  /*
   * Anime.js success animation.
   */

  if (
    typeof anime !== "undefined"
  ) {

    anime({
      targets:
        ".success-icon",

      scale: [
        0.5,
        1.2,
        1
      ],

      opacity: [
        0,
        1
      ],

      duration: 450,

      easing:
        "easeOutBack"
    });
  }


  lifecycleTimer =
    setTimeout(() => {

      setButtonState(
        "idle"
      );

      statusElement.textContent =
        "Ready";

      messageInput.focus();

    }, 1100);
}


/* =========================================================
   ERROR
========================================================= */

function showError() {

  setButtonState(
    "error"
  );

  statusElement.textContent =
    "Failed — retry";
}


/* =========================================================
   TEXTAREA
========================================================= */

function setInputHeight() {

  messageInput.style.height =
    "auto";

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


    let text =
      messageInput.value.trim();


    if (
      sendButton.classList.contains(
        "is-error"
      )
    ) {

      text =
        lastSubmittedText ||
        text;
    }


    if (!text) {
      return;
    }


    clearLifecycleStates();

    lastSubmittedText =
      text;

    messageInput.value = "";

    setInputHeight();


    conversation.push({
      role: "user",
      content: text
    });


    addMessage(
      "user",
      text
    );


    const assistantBubble =
      addMessage(
        "assistant",
        ""
      );


    assistantBubble.classList.add(
      "streaming"
    );


    controller =
      new AbortController();


    setGenerating(true);


    let assistantText = "";


    try {

      const response =
        await fetch(
          `${API_URL}/api/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                messages:
                  conversation
              }),

            signal:
              controller.signal
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
          // Ignore
        }

        throw new Error(
          errorMessage
        );
      }


      if (!response.body) {

        throw new Error(
          "Streaming is not supported."
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
        } =
          await reader.read();


        if (done) {
          break;
        }


        buffer +=
          decoder.decode(
            value,
            {
              stream: true
            }
          );


        buffer =
          buffer.replace(
            /\r\n/g,
            "\n"
          );


        const events =
          buffer.split(
            "\n\n"
          );


        buffer =
          events.pop() ||
          "";


        for (
          const event of events
        ) {

          const lines =
            event.split("\n");


          for (
            const line of lines
          ) {

            if (
              !line.startsWith(
                "data:"
              )
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
                parsed.type ===
                "error"
              ) {

                throw new Error(
                  parsed.error ||
                  "Generation failed."
                );
              }


              if (
                parsed.content
              ) {

                assistantText +=
                  parsed.content;

                assistantBubble.textContent =
                  assistantText;

                scrollToBottom();
              }

            } catch (error) {

              if (
                error.message !==
                "Unexpected token"
              ) {

                throw error;
              }
            }
          }
        }
      }


      conversation.push({
        role: "assistant",
        content:
          assistantText
      });


      assistantBubble.classList.remove(
        "streaming"
      );


      showSuccess();

    } catch (error) {

      if (
        error.name ===
        "AbortError"
      ) {

        conversation.push({
          role: "assistant",
          content:
            assistantText
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

      messageInput.disabled =
        isGenerating =
          false;

      stopButton.hidden =
        true;


      if (
        !sendButton.classList.contains(
          "is-success"
        ) &&
        !sendButton.classList.contains(
          "is-error"
        )
      ) {

        setButtonState(
          "idle"
        );
      }

      messageInput.focus();
    }
  }
);


/* =========================================================
   STOP
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


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1000
        )
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


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          900
        )
    );


    setGenerating(false);

    showError();
  }
);


/* =========================================================
   INITIALIZE
========================================================= */

setGenerating(false);

setButtonState(
  "idle"
);

setInputHeight();


/*
 * Start Anime.js animation
 * after the page is ready.
 */

window.addEventListener(
  "load",
  () => {

    playIntroAnimation();

    messageInput.focus();

  }
);
