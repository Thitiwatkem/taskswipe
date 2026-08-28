import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ucla-blue/50",
  {
    variants: {
      variant: {
        default: "bg-ucla-blue text-white shadow-sm hover:bg-ucla-blue-dark active:scale-95",
        gold: "bg-ucla-gold text-ucla-blue-dark shadow-sm hover:brightness-95 active:scale-95",
        outline:
          "border border-slate-200 bg-white text-ink hover:bg-slate-50 active:scale-95",
        ghost: "hover:bg-slate-100 active:scale-95",
        subtle: "bg-slate-100 text-ink hover:bg-slate-200 active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = "Button";
