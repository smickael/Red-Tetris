import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  isLoading?: boolean;
  icon?: React.ReactNode;
  showPing?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isLoading = false,
  icon,
  showPing = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none relative";

  const variants = {
    primary:
      "bg-vampireBlack text-lotion hover:bg-opacity-90 disabled:bg-lightDavysGrey",
    secondary:
      "bg-davysGrey text-lotion hover:bg-opacity-90 disabled:bg-lightDavysGrey",
    outline:
      "border border-davysGrey text-vampireBlack hover:bg-lightDavysGrey disabled:text-lightDavysGrey disabled:border-lightDavysGrey",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant as keyof typeof variants],
        disabled || isLoading ? "cursor-not-allowed opacity-100 text-vampireBlack" : "",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {showPing && (
        <span className="">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vampireBlack opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-vampireBlack"></span>
          </span>
        </span>
      )}
      {icon}
      {children}
    </button>
  );
};

export default Button;
