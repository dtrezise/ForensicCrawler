export type IntakeStatus = "preparing_local_workspace" | "ready_for_human_review" | "rejected_by_policy";

export const PREPARATION_STAGES = [
  "Request registered",
  "Canonical title and duplicate gate",
  "Research scope record",
  "Rights and privacy review template",
  "Source-plan placeholder — no sources fetched",
  "Human review gate",
] as const;

export interface ResearchIntake {
  id: string;
  subject: string;
  researchQuestion: string;
  normalizedSubject: string;
  createdAt: string;
  status: IntakeStatus;
  preparationStage: number;
  progress: number;
  workspaceSlug?: string;
  provenance: "local_user_intake";
}

export interface SubjectCandidate {
  id: string;
  title: string;
  aliases: string[];
  kind: "existing_case" | "intake";
}

export interface DuplicateMatch extends SubjectCandidate {
  matchType: "canonical" | "alias";
}

export function normalizeSubject(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/\b(1st|2nd|3rd|\d+)th\b/g, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function findDuplicateSubject(subject: string, candidates: SubjectCandidate[]): DuplicateMatch | null {
  const normalized = normalizeSubject(subject);
  if (!normalized) return null;
  for (const candidate of candidates) {
    if (normalizeSubject(candidate.title) === normalized) return { ...candidate, matchType: "canonical" };
    if (candidate.aliases.some((alias) => normalizeSubject(alias) === normalized)) return { ...candidate, matchType: "alias" };
  }
  return null;
}

export function createResearchIntake(subject: string, researchQuestion: string): ResearchIntake {
  const createdAt = new Date().toISOString();
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `fc_intake_${createdAt.replace(/\D/g, "")}`,
    subject: subject.trim(),
    researchQuestion: researchQuestion.trim(),
    normalizedSubject: normalizeSubject(subject),
    createdAt,
    status: "preparing_local_workspace",
    preparationStage: 0,
    progress: 8,
    provenance: "local_user_intake",
  };
}

export function loadResearchIntakes(storageKey: string): ResearchIntake[] {
  try {
    const raw = localStorage.getItem(storageKey);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((item): item is ResearchIntake => typeof item?.id === "string" && typeof item?.subject === "string").map((item) => ({
      ...item,
      status: item.status === "ready_for_human_review" ? "ready_for_human_review" : "preparing_local_workspace",
      preparationStage: typeof item.preparationStage === "number" ? item.preparationStage : 0,
      progress: typeof item.progress === "number" ? item.progress : 8,
    })) : [];
  } catch {
    return [];
  }
}
