"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string | null
  email?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
}

export function Avatar({
  src,
  alt,
  name,
  email,
  size = "md",
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const displayName = name || email || "User"
  const initial =
    name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "U"

  if (!src || imageError) {
    return (
      <div
        className={cn(
          "flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600",
          sizeClasses[size],
          className
        )}
      >
        {initial}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 overflow-hidden rounded-full bg-gray-200",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src={src}
        alt={alt || displayName}
        width={size === "sm" ? 32 : size === "md" ? 40 : 48}
        height={size === "sm" ? 32 : size === "md" ? 40 : 48}
        className="h-full w-full object-cover"
        unoptimized
        onError={() => setImageError(true)}
      />
    </div>
  )
}
