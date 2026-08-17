import React from "react";

const StatCard = ({ title, count, icon, bgColor, textColor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 flex items-center gap-5">
      {/* Icon Box */}
      <div
        className={`${bgColor} w-14 h-14 rounded-xl flex items-center justify-center shrink-0`}
      >
        <span className={`${textColor} text-2xl`}>{icon}</span>
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <span className="text-3xl font-bold text-gray-800 mt-1">
          {count ?? 0}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
