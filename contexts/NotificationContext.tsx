import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

interface NotificationContextType {
  lastNotification: Notifications.Notification | null;
}

const NotificationContext = createContext<NotificationContextType>({ lastNotification: null });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [lastNotification, setLastNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>(undefined);
  const responseListener = useRef<Notifications.EventSubscription>(undefined);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      setLastNotification(n);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data.type === 'new_item' && data.list_id) {
          router.push(`/lists/${data.list_id}` as any);
        } else if (data.type === 'new_comment' && data.list_id && data.item_id) {
          router.push(`/lists/${data.list_id}/item/${data.item_id}` as any);
        } else if (data.type === 'new_member' && data.list_id) {
          router.push(`/lists/${data.list_id}` as any);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  return (
    <NotificationContext.Provider value={{ lastNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
