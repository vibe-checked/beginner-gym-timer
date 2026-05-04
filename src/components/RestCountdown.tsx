import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { formatDuration, secondsUntil } from "@/src/utils/time";

type RestCountdownProps = {
  restEndsAt: string;
  onComplete: () => void;
};

export function RestCountdown({ restEndsAt, onComplete }: RestCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsUntil(restEndsAt));

  useEffect(() => {
    function updateRemainingTime() {
      const nextRemainingSeconds = secondsUntil(restEndsAt);
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds <= 0) {
        onComplete();
      }
    }

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [onComplete, restEndsAt]);

  return <Text style={styles.countdown}>{formatDuration(remainingSeconds)}</Text>;
}

const styles = StyleSheet.create({
  countdown: {
    color: "#F8FAFC",
    fontSize: 82,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 92,
  },
});
