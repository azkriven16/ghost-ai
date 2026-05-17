"use client"

import { useOthers } from "@liveblocks/react"
import { UserButton } from "@clerk/nextjs"
import { Panel } from "@xyflow/react"

const MAX_VISIBLE = 5

interface AvatarProps {
  name: string
  avatar: string
  color: string
  zIndex: number
}

function CollaboratorAvatar({ name, avatar, color, zIndex }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      title={name}
      style={{ borderColor: color, zIndex }}
      className="h-7 w-7 rounded-full border-2 overflow-hidden flex items-center justify-center bg-elevated text-xs font-semibold text-copy-primary ring-2 ring-base"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}

function OverflowChip({ count, zIndex }: { count: number; zIndex: number }) {
  return (
    <div
      style={{ zIndex }}
      className="h-7 w-7 rounded-full bg-elevated border-2 border-surface-border ring-2 ring-base flex items-center justify-center text-xs font-semibold text-copy-secondary"
    >
      +{count}
    </div>
  )
}

export function PresenceAvatars() {
  const others = useOthers()
  const visible = others.slice(0, MAX_VISIBLE)
  const overflow = others.length - MAX_VISIBLE

  return (
    <Panel position="top-right">
      <div className="flex items-center gap-2 mr-2 mt-2">
        {visible.length > 0 && (
          <div className="flex items-center">
            {visible.map((user, i) => (
              <div
                key={user.connectionId}
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                <CollaboratorAvatar
                  name={user.info?.name ?? "Anonymous"}
                  avatar={user.info?.avatar ?? ""}
                  color={user.info?.cursorColor ?? "#00c8d4"}
                  zIndex={MAX_VISIBLE - i}
                />
              </div>
            ))}
            {overflow > 0 && (
              <div style={{ marginLeft: -8 }}>
                <OverflowChip count={overflow} zIndex={0} />
              </div>
            )}
          </div>
        )}

        {others.length > 0 && (
          <div className="h-5 w-px bg-surface-border" />
        )}

        <UserButton />
      </div>
    </Panel>
  )
}
