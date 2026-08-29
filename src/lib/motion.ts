// iOS 13+ requires an explicit user-gesture-triggered permission prompt before
// devicemotion events carry real data. Everywhere else this resolves to true
// immediately since no such prompt exists.
export async function requestMotionPermission(): Promise<boolean> {
  const DeviceMotionEventTyped = window.DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };

  if (typeof DeviceMotionEventTyped?.requestPermission === "function") {
    try {
      const result = await DeviceMotionEventTyped.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }

  return true;
}
