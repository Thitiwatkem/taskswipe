import { useEffect, useRef } from "react";

const SHAKE_THRESHOLD = 18;
const SHAKE_COOLDOWN_MS = 1200;

export function useShakeUndo(enabled: boolean, onShake: () => void) {
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeAt = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    function handleMotion(event: DeviceMotionEvent) {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const delta =
        Math.abs(x - lastAccel.current.x) +
        Math.abs(y - lastAccel.current.y) +
        Math.abs(z - lastAccel.current.z);
      lastAccel.current = { x, y, z };

      const now = Date.now();
      if (delta > SHAKE_THRESHOLD && now - lastShakeAt.current > SHAKE_COOLDOWN_MS) {
        lastShakeAt.current = now;
        onShake();
      }
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [enabled, onShake]);
}
