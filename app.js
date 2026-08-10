const API_URL =
  "https://chatbot-eqq8.onrender.com";


/* =========================================================
   ELEMENTS
========================================================= */

const chatForm =
  document.getElementById("chatForm");

const messageInput =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");

const stopButton =
  document.getElementById("stopButton");

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


/* =========================================================
   STATE
========================================================= */

let conversation = [];

let controller = null;

let isGenerating = false;

let lifecycleTimer = null;

let lastSubmittedText = "";


/* =========================================================
   CHECK ANIME.JS
========================================================= */

if (typeof anime === "undefined") {

  console.error(
    "Anime.js failed to load."
  );

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

  if (role === "assistant") {

    bubble.setAttribute(
      "aria-live",
      "polite"
    );

  }

  wrapper.appendChild(
    bubble
  );

  messagesContainer.appendChild(
    wrapper
  );

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
   BUTTON CONTENT
========================================================= */

const buttonContents = {

  idle:
    sendButton.querySelector(
      ".send-content"
    ),

  loading:
    sendButton.querySelector(
      ".loading-content"
    ),

  success:
    sendButton.querySelector(
      ".success-content"
    ),

  error:
    sendButton.querySelector(
      ".error-content"
    )

};


/* =========================================================
   ANIME HELPER
========================================================= */

function animate(targets, properties) {

  if (
    typeof anime === "undefined"
  ) {
    return;
  }

  anime.remove(targets);

  return anime({
    targets,
    ...properties
  });
}


/* =========================================================
   BUTTON STATE
========================================================= */

function setButtonState(
  state
) {

  clearTimeout(
    lifecycleTimer
  );

  sendButton.classList.remove(
    "is-loading",
    "is-success",
    "is-error"
  );


  /* ---------------------------------------------
     Reset content
  --------------------------------------------- */

  Object.values(
    buttonContents
  ).forEach(
    (element) => {

      element.style.opacity =
        "0";

      element.style.transform =
        "translateY(10px) scale(0.92)";

      element.setAttribute(
        "aria-hidden",
        "true"
      );

    }
  );


  const active =
    buttonContents[state];


  if (!active) {
    return;
  }


  active.setAttribute(
    "aria-hidden",
    "false"
  );


  /* ---------------------------------------------
     State classes
  --------------------------------------------- */

  if (state === "loading") {

    sendButton.classList.add(
      "is-loading"
    );

    sendButton.disabled =
      true;

    sendButton.setAttribute(
      "aria-label",
      "Sending message"
    );

  }


  if (state === "success") {

    sendButton.classList.add(
      "is-success"
    );

    sendButton.disabled =
      true;

    sendButton.setAttribute(
      "aria-label",
      "Message sent"
    );

  }


  if (state === "error") {

    sendButton.classList.add(
      "is-error"
    );

    sendButton.disabled =
      false;

    sendButton.setAttribute(
      "aria-label",
      "Retry sending message"
    );

  }


  if (state === "idle") {

    sendButton.disabled =
      false;

    sendButton.setAttribute(
      "aria-label",
      "Send message"
    );

  }


  /* ---------------------------------------------
     Animate active state
  --------------------------------------------- */

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (reducedMotion) {

    active.style.opacity =
      "1";

    active.style.transform =
      "translateY(0) scale(1)";

    return;
  }


  animate(
    active,
    {
      opacity: [0, 1],

      translateY: [
        10,
        0
      ],

      scale: [
        0.92,
        1
      ],

      duration: 320,

      easing:
        "easeOutCubic"
    }
  );


  /* ---------------------------------------------
     Success icon animation
  --------------------------------------------- */

  if (
    state === "success"
  ) {

    const icon =
      active.querySelector(
        ".success-icon"
      );

    if (icon) {

      animate(
        icon,
        {
          scale: [
            0.4,
            1.2,
            1
          ],

          rotate: [
            -12,
            4,
            0
          ],

          opacity: [
            0,
            1
          ],

          duration: 500,

          easing:
            "easeOutElastic(1, .6)"
        }
      );

    }

  }


  /* ---------------------------------------------
     Error shake
  --------------------------------------------- */

  if (
    state === "error"
  ) {

    animate(
      sendButton,
      {
        translateX: [
          0,
          -6,
          6,
          -4,
          4,
          0
        ],

        duration: 380,

        easing:
          "easeInOutSine"
      }
    );

  }

}


/* =========================================================
   GENERATION STATE
========================================================= */

function setGenerating(
  value
) {

  isGenerating =
    value;

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


  lifecycleTimer =
    setTimeout(
      () => {

        setButtonState(
          "idle"
        );

        statusElement.textContent =
          "Ready";

        messageInput.focus();

      },
      1200
    );

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
   INPUT HEIGHT
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


/* =========================================================
   INPUT
========================================================= */

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


    /* Retry */

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


    lastSubmittedText =
      text;


    messageInput.value =
      "";

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


    setGenerating(
      true
    );


    let assistantText =
      "";


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

          /* Ignore */

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

      let buffer =
        "";


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

            } catch (
              parseError
            ) {

              /*
               * Ignore malformed
               * JSON chunks.
               */

              if (
                parseError.message &&
                !parseError.message.includes(
                  "Unexpected token"
                )
              ) {

                throw parseError;

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

    }


    catch (error) {

      /* -----------------------------------------
         User stopped generation
      ----------------------------------------- */

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


        setButtonState(
          "idle"
        );

        statusElement.textContent =
          "Stopped";

      }


      /* -----------------------------------------
         Normal error
      ----------------------------------------- */

      else {

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

    }


    finally {

      controller =
        null;

      isGenerating =
        false;

      messageInput.disabled =
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
   STOP BUTTON
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


    setGenerating(
      true
    );


    statusElement.textContent =
      "Demo: loading...";


    const delay =
      700 +
      Math.random() * 900;


    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          delay
        )
    );


    setGenerating(
      false
    );


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


    setGenerating(
      true
    );


    statusElement.textContent =
      "Demo: loading...";


    const delay =
      700 +
      Math.random() * 700;


    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          delay
        )
    );


    setGenerating(
      false
    );


    showError();

  }
);


/* =========================================================
   INITIAL STATE
========================================================= */

setButtonState(
  "idle"
);

setInputHeight();

messageInput.focus();
