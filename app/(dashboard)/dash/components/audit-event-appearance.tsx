export type AuditEventAppearance = {
  dotClassName: string;
  pillClassName: string;
};

const DEFAULT_APPEARANCE: AuditEventAppearance = {
  dotClassName: "bg-stone-400",
  pillClassName: "border-stone-200 bg-stone-50 text-stone-700",
};

export function getAuditEventAppearance(
  eventLabel: string,
): AuditEventAppearance {
  const normalizedLabel = eventLabel.trim().toLowerCase();

  switch (normalizedLabel) {
    case "invite sent":
      return {
        dotClassName: "bg-emerald-500",
        pillClassName: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
      };
    case "invite page viewed":
      return {
        dotClassName: "bg-sky-500",
        pillClassName: "border-sky-200 bg-sky-50/80 text-sky-700",
      };
    case "guest details updated":
      return {
        dotClassName: "bg-amber-500",
        pillClassName: "border-amber-200 bg-amber-50/80 text-amber-700",
      };
    case "guest deleted":
      return {
        dotClassName: "bg-rose-500",
        pillClassName: "border-rose-200 bg-rose-50/80 text-rose-700",
      };
    case "rsvp submitted":
      return {
        dotClassName: "bg-cyan-500",
        pillClassName: "border-cyan-200 bg-cyan-50/80 text-cyan-700",
      };
    default:
      return DEFAULT_APPEARANCE;
  }
}
