import { currentUser } from "@clerk/nextjs/server";
import { getLiveblocksClient, getCursorColor } from "@/lib/liveblocks";
import {
  getCurrentIdentity,
  canAccessProject,
} from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  const projectId =
    typeof parsed?.projectId === "string" ? parsed.projectId.trim() : "";

  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  const hasAccess = await canAccessProject(projectId, identity);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const cursorColor = getCursorColor(identity.userId);

  const liveblocks = getLiveblocksClient();

  await liveblocks.getOrCreateRoom(projectId, { defaultAccesses: [] });

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: { name, avatar, cursorColor },
  });
  session.allow(projectId, session.FULL_ACCESS);

  const { body: token, status } = await session.authorize();
  return new Response(token, { status });
}
