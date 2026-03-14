"use client";

import { useMemo, useState } from "react";
import { getApiMessage } from "@/lib/ui/form-feedback";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

const WELCOME = "Hi, I am your Lab AI Assistant. Ask about patients, tests, orders, reports, or billing.";

export function LabAiAssistant() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: WELCOME }]);

  const history = useMemo(() => messages.slice(-10), [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });
      const payload = await response.json();
      const answer = response.ok && payload?.ok ? String(payload.data?.answer ?? "") : getApiMessage(payload, "Assistant unavailable.");
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Assistant request failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <section className="ai-panel">
          <header className="ai-head">
            <strong>Lab AI Assistant</strong>
            <button className="icon-btn" type="button" onClick={() => setOpen(false)} aria-label="Close assistant">
              x
            </button>
          </header>

          <div className="ai-body">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "ai-msg ai-msg-user" : "ai-msg ai-msg-assistant"}>
                {message.content}
              </div>
            ))}
            {loading ? <div className="ai-msg ai-msg-assistant">Thinking...</div> : null}
          </div>

          <footer className="ai-foot">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about report, patient, test, billing..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <button className="button" type="button" onClick={() => void send()} disabled={loading}>
              Send
            </button>
          </footer>
        </section>
      ) : null}

      <button className="ai-fab" type="button" onClick={() => setOpen(true)} aria-label="Open AI assistant">
        AI
      </button>
    </>
  );
}
