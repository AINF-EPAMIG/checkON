import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

export type AvatarProps = React.HTMLAttributes<HTMLDivElement>

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    )
  }
)
Avatar.displayName = "Avatar"

export type AvatarImageProps = Omit<React.ComponentProps<typeof Image>, 'src'> & {
  src?: string | null
}

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof Image>,
  AvatarImageProps
>(({ className, alt = "", width = 40, height = 40, src, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false)
  
  // Não renderiza se não há src válido ou se houve erro
  if (!src || hasError) {
    return null
  }
  
  return (
    <Image
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      alt={alt}
      width={width}
      height={height}
      src={src}
      onError={() => setHasError(true)}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

export type AvatarFallbackProps = React.HTMLAttributes<HTMLSpanElement>

export const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"
