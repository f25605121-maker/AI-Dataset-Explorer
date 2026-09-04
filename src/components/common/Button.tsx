"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold transition-all rounded-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  const variantClasses = {
    primary: "bg-accent hover:brightness-110 text-white shadow-accent-sm",
    secondary: "bg-card-subtle hover:bg-card-hover text-primary border border-subtle",
    outline: "bg-transparent border border-accent/40 text-accent hover:bg-accent/10",
    ghost: "bg-transparent text-muted hover:text-primary hover:bg-card-subtle",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-sm",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export default Button;
