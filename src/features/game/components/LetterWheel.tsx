import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Settings2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LetterHistory } from "@/features/game/components/LetterHistory";
import { drawRandomLetter } from "@/features/game/gameUtils";
import { gameAudio } from "@/lib/audio";

const wheelPalette = [
  "#A3E635",
  "#FACC15",
  "#F59E0B",
  "#FB7185",
  "#EC4899",
  "#A855F7",
  "#8B5CF6",
  "#3B82F6",
  "#2563EB",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#22C55E",
];

type LetterWheelProps = {
  availableLetters: string[];
  usedLetters: string[];
  currentLetter: string | null;
  onDrawResolved: (letter: string) => void;
  drawDisabled?: boolean;
  soundEnabled: boolean;
  spinRequest?: number;
  onCustomizeAlphabet?: () => void;
};

export function LetterWheel({
  availableLetters,
  usedLetters,
  currentLetter,
  onDrawResolved,
  drawDisabled,
  soundEnabled,
  spinRequest = 0,
  onCustomizeAlphabet,
}: LetterWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const segments = useMemo(() => {
    const segmentAngle = 360 / Math.max(availableLetters.length, 1);

    return availableLetters.map((letter, index) => ({
      letter,
      centerAngle: index * segmentAngle + segmentAngle / 2,
      color: wheelPalette[index % wheelPalette.length],
    }));
  }, [availableLetters]);

  const background = useMemo(() => {
    if (!segments.length) {
      return "conic-gradient(from 0deg, #E2E8F0 0deg 360deg)";
    }

    const segmentAngle = 360 / segments.length;
    return `conic-gradient(from 0deg, ${segments
      .map((segment, index) => {
        const start = index * segmentAngle;
        const end = start + segmentAngle;
        return `${segment.color} ${start}deg ${end}deg`;
      })
      .join(", ")})`;
  }, [segments]);

  const letterClassName =
    availableLetters.length >= 24
      ? "text-[15px]"
      : availableLetters.length >= 18
        ? "text-[18px]"
        : "text-[22px]";

  const spinWheel = useCallback(() => {
    if (isSpinning || drawDisabled) {
      return;
    }

    const selectedLetter = drawRandomLetter(availableLetters);

    if (!selectedLetter) {
      return;
    }

    const selectedIndex = availableLetters.findIndex((letter) => letter === selectedLetter);
    const segmentAngle = 360 / availableLetters.length;
    const animationDuration = prefersReducedMotion ? 500 : 2400;
    const fullTurns = prefersReducedMotion ? 1 : 5;
    const targetRotation =
      rotation +
      fullTurns * 360 -
      (selectedIndex * segmentAngle + segmentAngle / 2);

    setIsSpinning(true);
    setRotation(targetRotation);

    if (soundEnabled) {
      gameAudio.startWheelSpin(Math.max(availableLetters.length * fullTurns, 10), animationDuration);
    }

    window.setTimeout(() => {
      if (soundEnabled) {
        gameAudio.stopWheelSpin();
        gameAudio.confirmWheelResult();
      }
      onDrawResolved(selectedLetter);
      setIsSpinning(false);
    }, animationDuration);
  }, [
    availableLetters,
    drawDisabled,
    isSpinning,
    onDrawResolved,
    prefersReducedMotion,
    rotation,
    soundEnabled,
  ]);

  useEffect(() => {
    if (spinRequest > 0) {
      spinWheel();
    }
  }, [spinRequest, spinWheel]);

  useEffect(
    () => () => {
      gameAudio.stopWheelSpin();
    },
    [],
  );

  return (
    <Card
      headerAction={
        onCustomizeAlphabet ? (
          <Button size="sm" variant="secondary" onClick={onCustomizeAlphabet}>
            <Settings2 className="h-4 w-4" />
            Dostosuj alfabet
          </Button>
        ) : undefined
      }
      title="Losowanie litery"
    >
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[320px]">
          <div className="pointer-events-none absolute left-1/2 top-1 z-10 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-slate-700 drop-shadow" />
          <motion.div
            aria-label={`Aktualnie wylosowana litera: ${currentLetter ?? "brak"}`}
            className="relative mx-auto aspect-square w-full rounded-full border-[10px] border-white shadow-card"
            style={{ background }}
            animate={{ rotate: rotation }}
            transition={{
              duration: prefersReducedMotion ? 0.45 : 2.4,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {segments.map((segment) => (
              <div
                key={segment.letter}
                className={`pointer-events-none absolute left-1/2 top-1/2 w-9 -translate-x-1/2 text-center font-bold text-white drop-shadow ${letterClassName}`}
                style={{
                  transform: `translate(-50%, -50%) rotate(${segment.centerAngle}deg) translateY(-122px) rotate(${-segment.centerAngle}deg)`,
                }}
              >
                {segment.letter}
              </div>
            ))}

            <div className="absolute left-1/2 top-1/2 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[10px] border-white bg-white text-[72px] font-bold text-ink shadow-inner">
              {currentLetter ?? "?"}
            </div>
          </motion.div>
        </div>

        {!availableLetters.length ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Wszystkie litery zostały już wykorzystane. Kolejne będą dostępne dopiero po rozpoczęciu nowej gry.
          </div>
        ) : null}

        {currentLetter ? (
          <div className="mt-4 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Litera tej rundy: {currentLetter}
          </div>
        ) : null}

        <div aria-live="polite" className="sr-only">
          {currentLetter ? `Wylosowano literę ${currentLetter}` : "Brak wylosowanej litery"}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <LetterHistory label="Dostępne litery" letters={availableLetters} />
        <LetterHistory label="Wykorzystane litery" letters={usedLetters} variant="used" />
        <LetterHistory label="Historia losowań" letters={usedLetters} />
      </div>

      <div className="mt-6">
        <Button
          disabled={drawDisabled || isSpinning}
          fullWidth
          variant="primary"
          onClick={spinWheel}
        >
          <Shuffle className="h-4 w-4" />
          {isSpinning ? "Losowanie..." : "Losuj literę"}
        </Button>
      </div>
    </Card>
  );
}
