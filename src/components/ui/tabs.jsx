// components/ui/tabs.js
import * as React from "react";

export function Tabs({ children, defaultValue, className }) {
  return <div className={className}>{children}</div>;
}

export function TabsList({ children, className }) {
  return <div className={`flex space-x-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ children, value, className }) {
  return (
    <button
      className={`text-sm font-medium hover:underline ${className}`}
      data-value={value}
    >
      {children}
    </button>
  );
}
