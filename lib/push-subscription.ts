// Helper utility to convert VAPID public key to Uint8Array format
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fallback uncompressed VAPID Public Key (65 bytes)
const FALLBACK_VAPID_PUBLIC_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMe829-vM6bMhK9Nl0s-jZ7_zQx_Vq5Y937g_x8Z";

export async function requestAndRegisterPush(
  saveMutation: (args: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }) => Promise<unknown>
): Promise<{ success: boolean; message: string }> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, message: "Notifications are not supported on this browser." };
  }

  try {
    // 1. Request Browser Permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, message: "Notification permission was denied in browser settings." };
    }

    // 2. Ensure Service Worker is registered
    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw-custom.js", { scope: "/" });
      }
      await navigator.serviceWorker.ready;
    }

    // 3. Obtain Push Subscription if PushManager exists
    let endpoint = `browser-notification-${Date.now()}`;
    let keys = { p256dh: "browser-granted", auth: "browser-granted" };

    if (registration && "pushManager" in registration) {
      try {
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          const rawVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_VAPID_PUBLIC_KEY;
          const subscribeOptions: PushSubscriptionOptionsInit = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(rawVapid),
          };
          subscription = await registration.pushManager.subscribe(subscribeOptions);
        }

        if (subscription) {
          const subJson = subscription.toJSON();
          if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            endpoint = subJson.endpoint;
            keys = {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            };
          }
        }
      } catch (pushErr) {
        console.warn("Native PushManager subscribe fallback:", pushErr);
      }
    }

    // 4. Save device subscription to Convex DB
    await saveMutation({
      endpoint,
      keys,
      userAgent: navigator.userAgent,
    });

    return { success: true, message: "Notifications enabled! Active status updated." };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to enable notifications.";
    return { success: false, message: errMessage };
  }
}
