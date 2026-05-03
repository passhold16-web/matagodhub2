import { getTrainerRank, getNextRank } from "@/lib/trainerRank";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  buildCount: number;
  size?: "sm" | "md";
  showProgress?: boolean;
  className?: string;
}

export const TrainerBadge = ({ buildCount, size = "sm", showProgress = false, className = "" }: Props) => {
  const rank = getTrainerRank(buildCount);
  const next = getNextRank(buildCount);
  const Icon = rank.icon;

  const sizeClasses =
    size === "md"
      ? "px-2.5 py-1 text-[11px] gap-1.5"
      : "px-1.5 py-px text-[9px] gap-0.5";
  const iconSize = size === "md" ? 12 : 9;

  const tooltipText = next
    ? `${rank.description} Próximo rango: ${next.label} con ${next.min} build${next.min === 1 ? "" : "s"}.`
    : `${rank.description} Rango máximo alcanzado.`;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-sm border font-display tracking-widest cursor-help ${rank.tone} ${sizeClasses} ${className}`}
          >
            <Icon size={iconSize} />
            {rank.label}
            {showProgress && next && (
              <span className="ml-1 opacity-70 normal-case tracking-normal">
                · {buildCount}/{next.min}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
