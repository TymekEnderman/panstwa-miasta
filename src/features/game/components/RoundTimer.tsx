import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { showToast } from "@/components/ui/toastStore";
import { useGameStore } from "@/features/game/gameStore";
import { useRoundTimer } from "@/hooks/useRoundTimer";
import { cx } from "@/lib/cx";

const presets = [30, 60, 90, 120, 180];
const finishOptions = [10, 15, 20, 30];

export function RoundTimer() {
  const timer = useGameStore((state) => state.game.timer);
  const soundEnabled = useGameStore((state) => state.game.soundEnabled);
  const startTimer = useGameStore((state) => state.startTimer);
  const pauseTimer = useGameStore((state) => state.pauseTimer);
  const resumeTimer = useGameStore((state) => state.resumeTimer);
  const resetTimer = useGameStore((state) => state.resetTimer);
  const triggerFinishCountdown = useGameStore((state) => state.triggerFinishCountdown);
  const setTimerDuration = useGameStore((state) => state.setTimerDuration);
  const setFinishCountdown = useGameStore((state) => state.setFinishCountdown);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const { formattedTime, isEditable } = useRoundTimer();

  const minutes = Math.floor(timer.configuredDurationSeconds / 60);
  const seconds = timer.configuredDurationSeconds % 60;
  const statusLabel =
    timer.status === "finishing"
      ? "Końcowe odliczanie"
      : timer.status === "finished"
        ? "Koniec rundy"
        : timer.status === "running"
          ? "Trwa runda"
          : timer.status === "paused"
            ? "Pauza"
            : "Gotowy";

  return (
    <Card
      title="Timer rundy"
      headerAction={
        <div
          className={cx(
            "rounded-full px-3 py-1 text-sm font-semibold",
            timer.status === "finishing"
              ? "bg-rose-100 text-rose-700"
              : timer.status === "finished"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-700",
          )}
        >
          {statusLabel}
        </div>
      }
    >
      <div
        className={cx(
          "rounded-3xl border px-6 py-7 text-center",
          timer.status === "finishing"
            ? "border-rose-200 bg-rose-50"
            : "border-line bg-slate-50",
        )}
      >
        <div className="text-[clamp(3rem,7vw,5rem)] font-semibold leading-none tracking-tight text-ink">
          {formattedTime}
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          min : sek
        </div>
        {timer.status === "finished" ? (
          <a
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
            href="#score-table"
          >
            Przejdź do punktacji
          </a>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
        <NumberStepper
          disabled={!isEditable}
          label="Minuty"
          max={9}
          value={minutes}
          onChange={(value) => setTimerDuration(value * 60 + seconds)}
        />
        <NumberStepper
          disabled={!isEditable}
          label="Sekundy"
          max={59}
          value={seconds}
          onChange={(value) => setTimerDuration(minutes * 60 + value)}
        />

        <label className="block">
          <div className="mb-2 text-sm font-medium text-slate-700">Po skończeniu</div>
          <select
            className="min-h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm"
            disabled={!isEditable}
            value={timer.configuredFinishSeconds}
            onChange={(event) => setFinishCountdown(Number(event.target.value))}
          >
            {finishOptions.map((option) => (
              <option key={option} value={option}>
                {option} s
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Szybkie presety</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              disabled={!isEditable}
              size="sm"
              variant={timer.configuredDurationSeconds === preset ? "soft" : "secondary"}
              onClick={() => setTimerDuration(preset)}
            >
              {preset < 60 ? `${preset} s` : `${Math.floor(preset / 60)}:${String(preset % 60).padStart(2, "0")}`}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {timer.status === "idle" || timer.status === "finished" ? (
          <Button
            fullWidth
            variant="primary"
            onClick={() => {
              const result = startTimer();

              if (!result.ok) {
                showToast({
                  title: "Nie udało się uruchomić timera",
                  description: result.message,
                  tone: "warning",
                });
              }
            }}
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
        ) : timer.status === "paused" ? (
          <Button fullWidth variant="primary" onClick={resumeTimer}>
            <Play className="h-4 w-4" />
            Wznów
          </Button>
        ) : (
          <Button fullWidth variant="secondary" onClick={pauseTimer}>
            <Pause className="h-4 w-4" />
            Pauza
          </Button>
        )}

        <Button fullWidth variant="secondary" onClick={resetTimer}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>

        <Button
          className="sm:col-span-2"
          disabled={timer.status !== "running"}
          fullWidth
          variant="danger"
          onClick={() => {
            const result = triggerFinishCountdown();

            if (!result.ok) {
              showToast({
                title: "Nie udało się uruchomić końcowego odliczania",
                description: result.message,
                tone: "warning",
              });
            }
          }}
        >
          Ktoś skończył
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-slate-50 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-slate-700">Dźwięki</div>
          <div className="text-xs text-muted">Steruje kołem, odliczaniem i efektami końca gry.</div>
        </div>
        <Button className="rounded-full" variant="ghost" onClick={toggleSound}>
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundEnabled ? "Włączony" : "Wyłączony"}
        </Button>
      </div>
    </Card>
  );
}
