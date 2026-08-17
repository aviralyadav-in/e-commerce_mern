import React from "react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-75">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning Circle */}
        <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        {/* Loading Text */}
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default Loader;
