import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        // D-CE2: 危険・失敗は warning と対称の段 2。三角 icon は部品が描く（site は書かない）。
        // prettier-ignore
        destructive: "bg-destructive-soft border-destructive text-destructive-strong [&>svg]:text-destructive *:data-[slot=alert-description]:text-destructive-strong/90",
        // catalog の文字列契約と手書き class の全数検査を区別する語順を維持する。
        // prettier-ignore
        warning: "bg-warning-soft border-warning text-warning-strong [&>svg]:text-warning *:data-[slot=alert-description]:text-warning-strong/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {variant === "destructive" && <TriangleAlert aria-hidden="true" />}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
