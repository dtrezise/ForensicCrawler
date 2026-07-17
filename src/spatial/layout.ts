export interface ProjectedLabelCandidate {
  id: string;
  anchorX: number;
  anchorY: number;
  priority: number;
  selected: boolean;
}

export interface ProjectedLabelPlacement extends ProjectedLabelCandidate {
  labelX: number;
  labelY: number;
  leaderX: number;
  leaderY: number;
}

export function layoutProjectedLabels(
  candidates: ProjectedLabelCandidate[],
  width: number,
  height: number,
  maximum = 12,
): ProjectedLabelPlacement[] {
  const margin = 22;
  const labelWidth = Math.min(190, Math.max(118, width * 0.25));
  const ordered = candidates
    .filter(({ anchorX, anchorY }) => anchorX >= 0 && anchorX <= width && anchorY >= 0 && anchorY <= height)
    .sort((a, b) => Number(b.selected) - Number(a.selected) || b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, maximum);
  const occupied = new Map<"left" | "right", number[]>();
  occupied.set("left", []);
  occupied.set("right", []);

  return ordered.map((candidate) => {
    const side = candidate.anchorX > width * 0.64 ? "left" : "right";
    const used = occupied.get(side)!;
    let labelY = Math.max(margin, Math.min(height - margin, candidate.anchorY));
    let attempts = 0;
    while (used.some((value) => Math.abs(value - labelY) < 27) && attempts < 18) {
      const direction = attempts % 2 === 0 ? 1 : -1;
      labelY = Math.max(margin, Math.min(height - margin, labelY + direction * (28 + attempts * 3)));
      attempts += 1;
    }
    used.push(labelY);
    const labelX = side === "left"
      ? Math.max(margin, candidate.anchorX - labelWidth - 28)
      : Math.min(width - labelWidth - margin, candidate.anchorX + 28);
    return {
      ...candidate,
      labelX,
      labelY,
      leaderX: side === "left" ? labelX + labelWidth : labelX,
      leaderY: labelY,
    };
  });
}
