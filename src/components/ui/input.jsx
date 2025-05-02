// components/ui/input.js
import React from "react";

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6e56cf] ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
