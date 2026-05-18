import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID!,
  dirs: ["./trigger"],
  maxDuration: 300, // 5 minutes — sufficient for AI generation tasks
});
