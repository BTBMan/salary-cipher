import * as React from "react"

import { cn } from "@/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-sm border border-outline-variant/10 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface shadow-[inset_0_1px_2px_rgba(6,14,32,0.18)] transition-[color,box-shadow,background-color,border-color] outline-none placeholder:text-outline/60 focus-visible:border-primary/25 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
