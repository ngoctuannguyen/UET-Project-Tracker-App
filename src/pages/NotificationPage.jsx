import React, { useState } from "react";
import NotificationElement from "../components/NotificationElement";

const tabs = [
  { key: "all", label: "All" },
  { key: "chat", label: "Chat" },
  { key: "done", label: "Done" },
  { key: "deadline", label: "Deadline" },
];

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [visibleCount, setVisibleCount] = useState(5);

  // Dummy data, bạn có thể thay bằng dữ liệu thực tế
  const notifications = [
    { id: 1, type: "chat", content: "You have a new message from John." },
    { id: 2, type: "done", content: "Task 'Design UI' marked as done." },
    { id: 3, type: "deadline", content: "Project deadline is tomorrow!" },
    { id: 4, type: "chat", content: "Anna mentioned you in a chat." },
    { id: 5, type: "done", content: "You completed 'Write documentation'." },
    { id: 6, type: "chat", content: "New chat notification." },
    { id: 7, type: "deadline", content: "Another deadline is coming up!" },
  ];

  const filtered = activeTab === "all"
    ? notifications
    : notifications.filter(n => n.type === activeTab);

  // Reset visibleCount when tab changes
  React.useEffect(() => {
    setVisibleCount(5);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-white-50 flex">
      <div className="flex-1 flex flex-col px-0 md:px-0 lg:px-0 py-10">
        <div className="max-w-4xl w-full mx-0 md:mx-0 lg:mx-0">
          <h1 className="text-4xl font-extrabold mb-10 text-gray-800 pl-10 pt-2">Notifications</h1>
          <div className="flex space-x-4 border-b-2 border-gray-200 mb-8 pl-10">
            {tabs.map(tab => {
              let activeColor = "";
              if (tab.key === "chat") activeColor = "border-blue-500 text-blue-600";
              if (tab.key === "done") activeColor = "border-green-500 text-green-600";
              if (tab.key === "deadline") activeColor = "border-red-500 text-red-600";
              if (tab.key === "all") activeColor = "border-gray-500 text-gray-700";
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-lg px-8 py-4 font-semibold rounded-t-lg transition-all duration-200
                    ${
                      activeTab === tab.key
                        ? `bg-white border-b-4 shadow ${activeColor}`
                        : "bg-transparent text-gray-500 hover:text-blue-600"
                    }`}
                  style={{ minWidth: 120 }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="pl-10 pr-6">
            {filtered.length === 0 ? (
              <div className="text-gray-400 text-center py-24 text-xl font-medium bg-white rounded-xl shadow">
                No notifications.
              </div>
            ) : (
              <>
                <ul className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {filtered.slice(0, visibleCount).map(n => (
                    <NotificationElement key={n.id} notification={n} />
                  ))}
                </ul>
                {filtered.length > visibleCount && (
                  <div className="flex justify-center mt-6">
                    <button
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                      onClick={() => setVisibleCount(c => c + 5)}
                    >
                      See more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;