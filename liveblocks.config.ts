// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import { LiveList } from "@liveblocks/client"

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      aiStatusFeed: {
        text?: string;
        status?: "thinking" | "generating" | "complete" | "error";
        timestamp?: number;
      } | null;
      aiChat: LiveList<{
        id: string;
        sender: string;
        role: "user" | "assistant";
        content: string;
        timestamp: number;
      }>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        cursorColor: string;
      };
    };

    RoomEvent:
      | { type: "AI_STATUS"; status: "thinking" | "generating" | "complete" | "error"; message: string }
      | {
          type: "AI_NODES_GENERATED";
          nodes: {
            id: string;
            type: "canvasNode";
            position: { x: number; y: number };
            data: { label: string; shape?: string; bgColor?: string; textColor?: string };
            style?: { width?: number; height?: number };
          }[];
          edges: {
            id: string;
            type: "canvasEdge";
            source: string;
            target: string;
            sourceHandle?: string | null;
            targetHandle?: string | null;
            data?: { label?: string };
          }[];
        };

    ThreadMetadata: Record<string, never>;

    RoomInfo: Record<string, never>;
  }
}

export {};
