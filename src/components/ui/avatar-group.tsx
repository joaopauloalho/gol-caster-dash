import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarUser {
  name: string;
  avatar?: string;
}

interface AvatarGroupProps {
  users: AvatarUser[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export const AvatarGroup = ({ users, max = 3, size = "md", className }: AvatarGroupProps) => {
  const visible = users.slice(0, max)
  const rest = users.length - max

  const sizeClass = size === "sm"
    ? "w-7 h-7 text-[10px]"
    : "w-9 h-9 text-xs"

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((u, i) => (
        <div
          key={i}
          title={u.name}
          className={cn(
            sizeClass,
            "rounded-full border-2 border-background bg-muted flex items-center justify-center font-bold text-foreground shrink-0",
            i > 0 && "-ml-2",
          )}
        >
          {u.avatar ? (
            <img
              src={u.avatar}
              alt={u.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{u.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}

      {rest > 0 && (
        <div
          className={cn(
            sizeClass,
            "rounded-full border-2 border-background bg-muted text-muted-foreground flex items-center justify-center font-bold -ml-2 shrink-0",
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  )
}
