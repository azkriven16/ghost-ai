import { z } from "zod"

export const AiStatusMessageSchema = z.object({
  text: z.string().optional(),
  status: z.enum(["thinking", "generating", "complete", "error"]).optional(),
  timestamp: z.number().optional(),
})

export type AiStatusMessage = z.infer<typeof AiStatusMessageSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>
