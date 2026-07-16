import type { ForensicPackage } from "../types";

export function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function missionTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds - hours * 3600 - minutes * 60;
  const secondText = Number.isInteger(remaining)
    ? String(remaining).padStart(2, "0")
    : remaining.toFixed(1).padStart(4, "0");
  return `${String(hours).padStart(3, "0")}:${String(minutes).padStart(2, "0")}:${secondText}`;
}

export function findClaimText(data: ForensicPackage, claimId: string) {
  const claim = data.claims.find((candidate) => candidate.id === claimId);
  return data.claimRevisions.find((revision) => revision.id === claim?.currentRevisionId)?.text ?? "Claim text unavailable";
}

export function sourceForAnchor(data: ForensicPackage, sourceId: string) {
  return data.sources.find((source) => source.id === sourceId);
}

export function auditChainIsLinked(data: ForensicPackage) {
  const events = [...data.auditEvents].sort((left, right) => left.sequence - right.sequence);
  return events.every((event, index) => {
    if (event.sequence !== index + 1) return false;
    return index === 0 ? event.previousHash === null : event.previousHash === events[index - 1]?.eventHash;
  });
}
