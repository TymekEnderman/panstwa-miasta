import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/features/game/gameStore";
import { deriveRemainingSeconds } from "@/features/game/gameUtils";
import { gameAudio } from "@/lib/audio";

export function useRoundTimer() {
  const timer = useGameStore((state) => state.game.timer);
  const soundEnabled = useGameStore((state) => state.game.soundEnabled);
  const completeTimer = useGameStore((state) => state.completeTimer);
  const [displayRemainingSeconds, setDisplayRemainingSeconds] = useState(timer.remainingSeconds);
  const previousStatusRef = useRef(timer.status);
  const lastTickSecondRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayRemainingSeconds(
      timer.status === "running" || timer.status === "finishing"
        ? deriveRemainingSeconds(timer)
        : timer.remainingSeconds,
    );
  }, [timer]);

  useEffect(() => {
    if (timer.status !== "running" && timer.status !== "finishing") {
      return;
    }

    const update = () => {
      const remainingSeconds = deriveRemainingSeconds(timer);
      setDisplayRemainingSeconds(remainingSeconds);

      if (remainingSeconds <= 0) {
        completeTimer();
      }
    };

    update();
    const intervalId = window.setInterval(update, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [completeTimer, timer]);

  useEffect(() => {
    if (
      soundEnabled &&
      (timer.status === "running" || timer.status === "finishing") &&
      displayRemainingSeconds <= 15 &&
      displayRemainingSeconds > 0 &&
      lastTickSecondRef.current !== displayRemainingSeconds
    ) {
      gameAudio.playCountdownTick(displayRemainingSeconds);
      lastTickSecondRef.current = displayRemainingSeconds;
      return;
    }

    if (
      displayRemainingSeconds > 15 ||
      timer.status === "paused" ||
      timer.status === "idle" ||
      timer.status === "finished"
    ) {
      lastTickSecondRef.current = null;
    }
  }, [displayRemainingSeconds, soundEnabled, timer.status]);

  useEffect(() => {
    if (
      previousStatusRef.current !== "finished" &&
      timer.status === "finished" &&
      soundEnabled
    ) {
      gameAudio.playRoundEnd();
    }

    previousStatusRef.current = timer.status;
  }, [soundEnabled, timer.status]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(displayRemainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (displayRemainingSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  }, [displayRemainingSeconds]);

  return {
    displayRemainingSeconds,
    formattedTime,
    isEditable: timer.status === "idle" || timer.status === "finished",
  };
}
