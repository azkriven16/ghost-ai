import { EditorShell } from "@/components/editor/editor-shell"
import { EditorHome } from "@/components/editor/editor-home"
import { getProjectsForUser } from "@/lib/projects"

export default async function EditorPage() {
  const { owned, shared } = await getProjectsForUser()

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      <EditorHome />
    </EditorShell>
  )
}
