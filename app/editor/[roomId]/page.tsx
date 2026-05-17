import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access"
import { getProjectsForUser } from "@/lib/projects"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { roomId } = await params

  const identity = await getCurrentIdentity()
  if (!identity) redirect("/sign-in")

  const [project, hasAccess, { owned, shared }] = await Promise.all([
    prisma.project.findUnique({
      where: { id: roomId },
      select: { id: true, name: true },
    }),
    canAccessProject(roomId, identity),
    getProjectsForUser(),
  ])

  if (!project || !hasAccess) {
    return (
      <div className="h-dvh">
        <AccessDenied />
      </div>
    )
  }

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      ownedProjects={owned}
      sharedProjects={shared}
    />
  )
}
