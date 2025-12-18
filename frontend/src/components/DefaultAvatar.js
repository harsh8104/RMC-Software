import React from "react";

const DefaultAvatar = ({ className = "h-32 w-32" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="100" fill="#E5E7EB" />

      {/* User Icon */}
      <g transform="translate(50, 40)">
        {/* Head */}
        <circle cx="50" cy="35" r="25" fill="#9CA3AF" />

        {/* Body */}
        <path
          d="M 20 90 Q 20 65 35 60 L 65 60 Q 80 65 80 90 L 75 120 L 25 120 Z"
          fill="#9CA3AF"
        />
      </g>
    </svg>
  );
};

export default DefaultAvatar;
