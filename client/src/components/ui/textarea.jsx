import React from "react";

const Textarea = React.forwardRef(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={`rounded-lg p-3 bg-[#2c2e3b] border-none text-white ${className}`}
    {...props}
  />
));
Textarea.displayName = "Textarea";
export default Textarea; 