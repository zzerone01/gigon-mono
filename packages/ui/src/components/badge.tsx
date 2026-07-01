import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@repo/ui/lib/utils"

// GigOn Badge — shadcn/ui base with the brand variant set: soft `default` tint,
// `amber`, `solid` royal, `outline`, and `success`. Pill-shaped, two sizes.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-tint text-royal-dark",
        amber: "border-transparent bg-amber/15 text-amber-dark",
        solid: "border-transparent bg-royal text-white",
        success: "border-transparent bg-success/12 text-success",
        outline: "border-line bg-background text-slate",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
      },
      size: {
        default: "px-3 py-1 text-xs",
        lg: "px-3.5 py-1.5 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
