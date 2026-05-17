import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#E57373", // red
  "#F06292", // pink
  "#BA68C8", // purple
  "#7986CB", // indigo
  "#4FC3F7", // light blue
  "#4DB6AC", // teal
  "#81C784", // green
  "#FFD54F", // amber
  "#FF8A65", // deep orange
  "#A1887F", // brown
];

export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

declare global {
  // eslint-disable-next-line no-var
  var _liveblocks: Liveblocks | undefined;
}

export function getLiveblocksClient(): Liveblocks {
  if (globalThis._liveblocks) return globalThis._liveblocks;
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  globalThis._liveblocks = new Liveblocks({ secret });
  return globalThis._liveblocks;
}
