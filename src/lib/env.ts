/**
 * Detect if we're running in the Lovable preview / staging environment.
 * Preview URLs look like: id-preview--<id>.lovable.app
 * Production URL: comidas-perez-edelberg.lovable.app
 * Local dev: localhost / 127.0.0.1
 */
export function isStageEnv(): boolean {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("id-preview--")
  );
}

/**
 * Returns the DB week_key prefix for the current environment.
 * Stage keys: "stage_current" / "stage_next"
 * Prod keys:  "prod_current"  / "prod_next"
 */
export function envWeekKey(weekKey: string): string {
  return `${isStageEnv() ? "stage" : "prod"}_${weekKey}`;
}
