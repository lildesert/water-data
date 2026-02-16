import * as React from "react";

import { cn } from "~/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border-2 border-black bg-white px-3 text-base shadow-[0_3px_0_0_#111] outline-none focus:ring-2 focus:ring-cyan-400",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
