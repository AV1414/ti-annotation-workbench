import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline:
          "border-border bg-transparent text-foreground",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted",

        /* Semantic status variants — uses CSS custom property pattern */
        success:
          "border-[hsl(var(--success))]/20 bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]",
        warning:
          "border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
        info:
          "border-[hsl(var(--info))]/20 bg-[hsl(var(--info-bg))] text-[hsl(var(--info))]",
        purple:
          "border-[hsl(var(--purple))]/20 bg-[hsl(var(--purple-bg))] text-[hsl(var(--purple))]",
        danger:
          "border-[hsl(var(--rose))]/20 bg-[hsl(var(--rose-bg))] text-[hsl(var(--rose))]",

        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
