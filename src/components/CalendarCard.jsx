import React from "react";
import { format, startOfWeek, addDays } from "date-fns";

const CalendarCard = ({ date }) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));

  return (
    <div className="bg-white rounded-xl p-6 border border-solid border-indigo-600">
      <h3 className="font-semibold mb-4">{format(date, "MMM, yyyy")}</h3>
      <div className="grid grid-cols-7 gap-2">
        {/* Hiển thị thứ */}
        {days.map((d) => (
          <div key={`day-${d}`} className="w-8 h-8 flex items-center justify-center rounded text-gray-1000">
            {format(d, "EEE")} {/* Hiển thị thứ viết tắt (Mon, Tue, ...) */}
          </div>
        ))}
        {/* Hiển thị ngày */}
        {days.map((d) => (
          <div
            key={d}
            className={`w-8 h-8 flex items-center justify-center rounded ${
              format(d, "d") === format(date, "d") ? "bg-purple-200" : ""
            }`}
          >
            {format(d, "d")}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarCard;