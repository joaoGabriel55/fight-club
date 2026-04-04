import { useState, useEffect, useCallback } from "react";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof Notification === "undefined" || permission !== "granted")
        return;
      new Notification(title, {
        icon: "/icons/icon-192.svg",
        ...options,
      });
    },
    [permission],
  );

  return {
    permission,
    isSupported: typeof Notification !== "undefined",
    requestPermission,
    sendNotification,
  };
}
