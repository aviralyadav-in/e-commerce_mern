import React from "react";

const Loader = ({ label = "Loading…", minHeight = 280 }) => (
  <div
    className="flex items-center justify-center w-full"
    style={{ minHeight }}
    role="status"
  >
    <div className="flex flex-col items-center gap-2.5">
      <div className="spinner w-8 h-8 border-[3px]" />
      {label && (
        <p className="text-[12.5px] text-(--ink-muted) font-medium">{label}</p>
      )}
    </div>
  </div>
);

export default Loader;
