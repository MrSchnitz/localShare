import { onMounted, onUnmounted } from "vue";

export const useAutoRefresh = (
  refresh: () => void,
  interval: number = 10000
) => {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  };

  const handleFocus = () => {
    refresh();
  };

  const start = () => {
    intervalId = setInterval(refresh, interval);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleFocus);
  };

  onMounted(start);
  onUnmounted(stop);

  return { start, stop };
};
