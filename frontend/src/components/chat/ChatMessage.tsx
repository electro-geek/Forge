"use client";
import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

function CursorMiniMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35"/>
    </svg>
  );
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const prefersReducedMotion = useReducedMotion();

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span
          className="text-[10px] font-mono px-2.5 py-1 rounded-full border"
          style={{ color: "#4A5275", backgroundColor: "#141828", borderColor: "#1A2038" }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", duration: 0.28, bounce: 0 }}
      className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: "#FF6B35", color: "#fff" }}
          >
            U
          </div>
        ) : (
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,107,53,0.08)",
              border: "1px solid rgba(255,107,53,0.15)",
            }}
          >
            <CursorMiniMark />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col min-w-0", isUser ? "items-end" : "items-start")} style={{ maxWidth: "88%" }}>
        {isUser ? (
          /* User bubble — compact pill */
          <div
            className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{
              backgroundColor: "rgba(255,107,53,0.08)",
              border: "1px solid rgba(255,107,53,0.18)",
              color: "#E8ECF4",
            }}
          >
            <p className="whitespace-pre-wrap text-[13px]">{message.content}</p>
          </div>
        ) : (
          /* Assistant — flat card with left accent stripe */
          <div
            className="pl-3.5 pr-3.5 py-2.5 rounded-r-xl text-sm leading-relaxed"
            style={{
              backgroundColor: "#141828",
              borderLeft: "2px solid #FF6B35",
              borderTop: "1px solid #1A2038",
              borderRight: "1px solid #1A2038",
              borderBottom: "1px solid #1A2038",
              borderRadius: "0 10px 10px 0",
              color: "#E8ECF4",
            }}
          >
            <div
              className="prose prose-sm max-w-none text-[12.5px]"
              style={
                {
                  "--tw-prose-body": "#E8ECF4",
                  "--tw-prose-headings": "#E8ECF4",
                  "--tw-prose-code": "#FF6B35",
                  "--tw-prose-bold": "#E8ECF4",
                  "--tw-prose-bullets": "#4A5275",
                  "--tw-prose-links": "#4D9CFF",
                } as React.CSSProperties
              }
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span
          className="text-[9.5px] font-mono mt-1 px-1"
          style={{ color: "#232A42" }}
        >
          {formatDate(message.created_at)}
        </span>
      </div>
    </motion.div>
  );
}

export default memo(ChatMessage);
