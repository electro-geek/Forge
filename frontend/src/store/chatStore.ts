import { create } from "zustand";
import { Message, ChatSession } from "@/types";

interface ChatState {
  session: ChatSession | null;
  messages: Message[];
  isGenerating: boolean;
  streamingStatus: string;

  setSession: (session: ChatSession | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setGenerating: (v: boolean) => void;
  setStreamingStatus: (status: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  session: null,
  messages: [],
  isGenerating: false,
  streamingStatus: "",

  setSession: (session) => set({ session }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setGenerating: (v) => set({ isGenerating: v }),
  setStreamingStatus: (status) => set({ streamingStatus: status }),
}));
