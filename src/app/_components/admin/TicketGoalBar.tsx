import { useTranslations } from "next-intl";

interface Props {
  sold: number;
  goal: number;
  /** Event is over — the bar goes gray and stops "breathing". */
  isCompleted: boolean;
  className?: string;
}

/**
 * Ticket-goal progress for admin event views. Live events glow softly
 * (blue while chasing the goal, green once reached); past events render
 * flat gray so the list reads at a glance which ones are still selling.
 */
export function TicketGoalBar({ sold, goal, isCompleted, className }: Props) {
  const t = useTranslations("admin.events");
  const reached = sold >= goal;
  const percent = Math.min(100, (sold / goal) * 100);

  const fillClass = isCompleted
    ? "bg-gray-400"
    : reached
      ? "bg-green-500 animate-goal-glow-green"
      : "bg-blue-500 animate-goal-glow-blue";
  const labelClass = isCompleted
    ? "text-gray-500"
    : reached
      ? "text-green-600"
      : "text-gray-900";

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{t("goal.label")}</span>
        <span className={`font-semibold ${labelClass}`}>
          {sold} / {goal} ({Math.round((sold / goal) * 100)}%)
          {sold > goal && ` · ${t("goal.exceeded", { count: sold - goal })}`}
        </span>
      </div>
      {/* No overflow clipping on the track: the glow must escape the fill */}
      <div className="h-2 bg-gray-100 rounded-full">
        <div
          className={`h-full rounded-full transition-all ${fillClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
