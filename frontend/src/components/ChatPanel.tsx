import { useState, useRef, useEffect } from "react";
import { ArrowUp, ArrowUpRight, CircleAlert, CircleCheck, Coffee, ListTodo, Loader2, Sparkles, ThumbsUp, ThumbsDown, Copy, RotateCcw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useStreamParser } from "../hooks/use-stream-parser";
import { ChatEventRenderer } from './ChatEventRenderer';
import { ChatEvent, ChatEventType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
  events?: ChatEvent[]; // Structured events from the database
  editedFiles?: string[];
}

const STARTER_PROMPTS = [
  { icon: ListTodo, text: "Build a todo app with filters and local storage" },
  { icon: Wallet, text: "Create an expense tracker with a monthly chart" },
  { icon: Coffee, text: "Make a landing page for a coffee shop" },
];

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ChatPanel({ messages, onSendMessage, isStreaming, isLoading, readOnly }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    onSendMessage(input.trim());
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 pb-6 text-center">
            <div className="liquid-glass mb-5 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Sparkles className="h-5 w-5 text-foreground/80" />
            </div>
            <h3 className="gradient-text text-xl font-semibold tracking-tight">What should we build?</h3>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
              Describe an app or a change, and Taskly will write the code.
            </p>
            {!readOnly && (
              <div className="mt-8 w-full max-w-sm text-left">
                <p className="mb-2.5 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
                  Try one of these
                </p>
                <div className="flex flex-col gap-2">
                  {STARTER_PROMPTS.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => onSendMessage(text)}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.05]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-muted-foreground transition-colors group-hover:text-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-[13px] text-muted-foreground transition-colors group-hover:text-foreground">{text}</span>
                      <ArrowUpRight className="mr-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message}
                isStreaming={isStreaming && message.isStreaming} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {/* Same 16px gap from the card on left, right and bottom */}
      <div className="shrink-0 px-4 pb-4">
        {/* 6px frame + 10px text inset = 16px on every side; one line = 44px, button (36px) sits 4px from top and bottom */}
        <form
          onSubmit={handleSubmit}
          className="liquid-glass flex items-end gap-1.5 rounded-[22px] p-1.5 transition-shadow focus-within:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_0_0_1px_hsl(0_0%_100%/0.12),0_10px_40px_-10px_rgb(0_0_0/0.6)]"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={readOnly ? "You have view-only access to this project" : "Ask Taskly to build…"}
            className="min-h-[44px] max-h-[200px] flex-1 resize-none rounded-2xl border-0 bg-transparent px-2.5 py-2.5 text-sm leading-6 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isStreaming || readOnly}
            rows={1}
            title="Enter to send · Shift + Enter for a new line"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming || readOnly}
            className="m-1 h-9 w-9 shrink-0 rounded-full"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

const STEPS = ["Understanding your request", "Planning the changes", "Writing code", "Wrapping up"];

/**
 * Live status for a reply being generated. Driven by what has actually streamed in:
 * nothing yet → understanding; a message → planning; files → writing; a message after files → wrapping up.
 */
function GenerationProgress({ events, isStreaming, failed }: { events: ChatEvent[]; isStreaming: boolean; failed: boolean }) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  const files = events.filter((e) => e.type === ChatEventType.FILE_EDIT);
  const last = events[events.length - 1];
  let phase = 0;
  if (events.length) phase = 1;
  if (files.length) phase = 2;
  if (files.length && last?.type === ChatEventType.MESSAGE) phase = 3;

  const seconds = Math.max(0, Math.round((now - startedAt) / 1000));
  const elapsed = seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;

  // Finished: collapse to a one-line summary
  if (!isStreaming) {
    return (
      <div className={cn("flex items-center gap-2 text-xs", failed ? "text-red-300/90" : "text-muted-foreground")}>
        {failed ? <CircleAlert className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5 text-emerald-400" />}
        <span>
          {failed ? `Generation failed after ${elapsed}` : `Built in ${elapsed}`}
          {!failed && files.length > 0 && ` · ${files.length} file${files.length === 1 ? "" : "s"} changed`}
        </span>
      </div>
    );
  }

  const currentFile = phase === 2 ? last?.filePath ?? files[files.length - 1]?.filePath : undefined;

  return (
    <div className="liquid-glass rounded-2xl p-4 animate-fade-in" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/10 [animation-duration:2s]" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/15">
            <Sparkles className="h-4 w-4 text-foreground/90" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-shimmer truncate text-sm font-medium">{STEPS[phase]}…</p>
          <p className="text-xs text-muted-foreground">Taskly is working on your app</p>
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{elapsed}</span>
      </div>

      <ol className="mt-4 space-y-0">
        {STEPS.map((label, i) => {
          const done = i < phase;
          const active = i === phase;
          return (
            <li key={label} className="relative flex gap-3 pb-3 last:pb-0">
              {i < STEPS.length - 1 && (
                <span className={cn("absolute left-[9px] top-5 h-[calc(100%-12px)] w-px", done ? "bg-emerald-400/40" : "bg-white/10")} />
              )}
              <span className="relative z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center">
                {done ? (
                  <CircleCheck className="h-[19px] w-[19px] text-emerald-400" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </span>
              <div className="min-w-0 pt-px">
                <p className={cn("text-[13px]", active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/50")}>
                  {label}
                </p>
                {i === 2 && files.length > 0 && (
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {active && currentFile ? `${currentFile} · ` : ""}
                    {files.length} file{files.length === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Inner Component to handle logic per message
function MessageItem({ message, isStreaming }: { message: ChatMessage, isStreaming: boolean }) {
  // Use the stream parser to turn raw XML text into Event objects live
  // 1. Parse content live if we are streaming OR if we don't have DB events yet
  const liveEvents = useStreamParser(message.content || "");

  // 2. Logic: If we have DB events, use them. Otherwise, use the parsed content.
  const eventsToRender = (message.events && message.events.length > 0)
    ? message.events
    : liveEvents;

  // Show the progress card for replies generated in this session (not ones loaded from history)
  const [showProgress] = useState(isStreaming);
  // Untagged text (e.g. "Sorry, an error occurred.") never parses into events — show it as-is
  const failedText = !isStreaming && eventsToRender.length === 0 ? message.content?.trim() : "";

  return (
    <div className="px-6 py-5 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {message.role === "user" ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="bg-secondary text-sm py-2.5 px-4 rounded-2xl rounded-tr-md border border-border max-w-[85%]">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.createdAt && (
              <span className="text-[10px] text-muted-foreground px-1 uppercase tracking-tight">
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {showProgress && <GenerationProgress events={eventsToRender} isStreaming={isStreaming} failed={!!failedText} />}

            {failedText && <p className="text-sm text-red-300/90">{failedText}</p>}

            {/* Render granular events (Thought, Tool, Message, File) */}
            <div className="flex flex-col gap-3">
              {eventsToRender.map((event, idx) => {
                const isLast = idx === eventsToRender.length - 1;
                return (
                  <ChatEventRenderer
                    key={idx}
                    event={event}
                    // It is "loading" only if:
                    // 1. The message is currently streaming
                    // 2. AND this is the last event in the list
                    isLoading={isStreaming && isLast}
                  />
                );
              })}
            </div>

            {/* Action buttons for assistant message */}
            {!message.isStreaming && eventsToRender.length > 0 && (
              <div className="flex items-center gap-1 pt-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}