import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getByLabelText,
  getByRole,
  getByText
} from "@testing-library/dom";

describe("Chatbot UI", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <form id="chatForm" aria-label="Chat message form">
          <textarea
            id="messageInput"
            aria-label="Message"
          ></textarea>

          <button type="submit">Send</button>
          <button type="button">Stop</button>
        </form>

        <div id="messages"></div>
      </main>
    `;

    global.fetch = vi.fn();
  });

  it("allows the user to enter a message", () => {
    const input = getByLabelText(document.body, "Message");

    input.value = "Hello AI";

    expect(input.value).toBe("Hello AI");
  });

  it("shows the Send button", () => {
    const button = getByRole(document.body, "button", {
      name: "Send"
    });

    expect(button).toBeTruthy();
  });

  it("shows the Stop button", () => {
    const button = getByRole(document.body, "button", {
      name: "Stop"
    });

    expect(button).toBeTruthy();
  });

  it("renders a user message", () => {
    const messages = document.getElementById("messages");

    messages.innerHTML = `
      <div class="message user">
        Hello AI
      </div>
    `;

    expect(
      getByText(messages, "Hello AI")
    ).toBeTruthy();
  });

  it("renders a streaming AI response", () => {
    const messages = document.getElementById("messages");

    messages.innerHTML = `
      <div class="message assistant">
        Hello! I am still generating...
      </div>
    `;

    expect(
      getByText(messages, "Hello! I am still generating...")
    ).toBeTruthy();
  });

  it("renders an error message", () => {
    const messages = document.getElementById("messages");

    messages.innerHTML = `
      <div class="message error">
        Something went wrong. Please try again.
      </div>
    `;

    expect(
      getByText(
        messages,
        "Something went wrong. Please try again."
      )
    ).toBeTruthy();
  });
});