import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "primary" | "outline";
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "primary",
      label,
      error,
      icon,
      className,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "px-4 py-2 rounded-lg font-medium transition-all focus:outline-none w-full";

    const variants = {
      primary:
        "bg-lotion text-vampireBlack border border-lightDavysGrey focus:border-davysGrey",
      outline:
        "bg-transparent text-vampireBlack border border-davysGrey focus:border-vampireBlack",
    };

    const inputClasses = clsx(
      baseStyles,
      variants[variant as keyof typeof variants],
      error ? "border-red-500 focus:border-red-500" : "",
      icon ? "pl-10" : "",
      className
    );

    return (
      <div
        className={clsx("flex flex-col items-start gap-1", fullWidth ? "w-full" : "w-fit")}
      >
        {label && (
          <label className="text-sm font-medium text-vampireBlack">
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-davysGrey">
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
