import { get as blobGet } from "@vercel/blob";
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ projectId: string; specId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId, specId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await canAccessProject(projectId, identity);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true },
  });

  if (!spec) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (spec.projectId !== projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const blobData = await blobGet(spec.filePath, { access: "private" });

  if (!blobData) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(blobData.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
