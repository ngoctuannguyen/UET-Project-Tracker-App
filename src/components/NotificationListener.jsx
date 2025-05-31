// src/components/NotificationListener.jsx
import { useEffect } from 'react';
import { messaging, onMessage } from '@/firebase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
const NotificationListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📩 Foreground message received:', payload);

      const { title, body} = payload.notification;
      if (body === undefined) {
       let body = "No body";
      }
      const Id = payload.data.projectId;
      console.log('Project ID:', Id);
      toast(`${title}: ${body}\n📅 `, {
        action: {
          label: 'View',
          onClick: () => {
              // Navigate to the specific project and task
              navigate(`notification`);
          },
        },
      });
    });

    return () => unsubscribe(); // Clean up the listener
  }, [navigate]);

  return null;
};

export default NotificationListener;
