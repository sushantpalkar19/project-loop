"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] shrink-0";

    const variants = {
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500 shadow-sm border border-indigo-600 hover:shadow-indigo-600/20",
      secondary:
        "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm border border-slate-900",
      outline:
        "bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-300 focus:ring-indigo-500 shadow-2xs",
      ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-indigo-500",
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500 shadow-sm border border-rose-600 hover:shadow-rose-600/20",
      subtle:
        "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-indigo-100",
    };

    const sizes = {
      sm: "text-xs h-8 px-3 gap-1.5",
      md: "text-xs sm:text-sm h-9 px-4 gap-2",
      lg: "text-sm sm:text-base h-11 px-5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
