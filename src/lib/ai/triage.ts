export interface TriageResult {
  id: string;
  urgency: number;
  reason: string;
}

export const URGENCY_LABEL: Record<number, string> = {
  5: "Crítico",
  4: "Alto",
  3: "Médio",
  2: "Baixo",
  1: "Mínimo",
};

/** Sorts tickets so the highest AI urgency comes first; unclassified tickets go last. */
export function sortByUrgency<T extends { id: string }>(items: T[], triage: Map<string, TriageResult>): T[] {
  return [...items].sort((a, b) => (triage.get(b.id)?.urgency ?? 0) - (triage.get(a.id)?.urgency ?? 0));
}
