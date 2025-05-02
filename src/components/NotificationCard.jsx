import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const CalendarIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={props.className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M3 18.75V9.75a.75.75 0 01.75-.75h16.5a.75.75 0 01.75.75v9"
    />
  </svg>
);

const NotificationCard = () => {
  return (
    <Card className="bg-white">
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="bg-[#6e56cf] text-white p-2 rounded">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold">Progress Update</p>
          <p className="text-sm text-gray-500">2 Days ago</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;