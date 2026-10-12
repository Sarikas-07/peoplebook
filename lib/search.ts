/** Makes free text safe to place inside a PostgREST filter string (removes its control characters). */
export function cleanSearchTerm(q: string | undefined): string {
  return (q ?? "").replace(/[,()%*\\"'`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}
