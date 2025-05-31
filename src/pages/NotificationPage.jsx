import React, { useState, useEffect } from "react";
import axios from "axios";
import NotificationElement from "../components/NotificationElement";
import { useNavigate } from "react-router-dom"; // ← import this

const tabs = [
  { key: "chat", label: "Chat" },
  { key: "done", label: "Done" },
  { key: "deadline", label: "Deadline" },
];

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState("done");
  const [visibleCount, setVisibleCount] = useState(5);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ← hook for navigation

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get("http://localhost:2000/notification/notifications");
        setNotifications(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab]);

  const handleNotificationClick = (notification) => {
      console.log("Notification clicked:", notification);

      const projectId = notification.projectId;
    
    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      console.warn("No projectId found in notification");
    }
  };

  return (
    <div className="min-h-screen bg-white-50 flex">
      <div className="flex-1 flex flex-col px-0 py-10">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-extrabold mb-10 text-gray-800 pl-10 pt-2">Notifications</h1>
          <div className="flex space-x-4 border-b-2 border-gray-200 mb-8 pl-10">
            {tabs.map((tab) => {
              let activeColor = "";
              if (tab.key === "chat") activeColor = "border-blue-500 text-blue-600";
              if (tab.key === "done") activeColor = "border-green-500 text-green-600";
              if (tab.key === "deadline") activeColor = "border-red-500 text-red-600";
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-lg px-8 py-4 font-semibold rounded-t-lg transition-all duration-200 ${
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
            {loading ? (
              <div className="text-gray-500 text-center py-24 text-xl font-medium bg-white rounded-xl shadow">
                Loading notifications...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-400 text-center py-24 text-xl font-medium bg-white rounded-xl shadow">
                No notifications.
              </div>
            ) : (
              <>
                <ul className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {filtered.slice(0, visibleCount).map((n) => (
                    <NotificationElement
                      key={n.id}
                      notification={n}
                      onClick={() => handleNotificationClick(n)}
                    />
                  ))}
                </ul>
                {filtered.length > visibleCount && (
                  <div className="flex justify-center mt-6">
                    <button
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                      onClick={() => setVisibleCount((c) => c + 5)}
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
