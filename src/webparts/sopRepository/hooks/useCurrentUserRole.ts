import { useEffect, useState } from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { graphfi, SPFx as GraphSPFx } from "@pnp/graph";
import "@pnp/graph/users";

export interface ICurrentUserRoleResult {
  jobTitle: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches the current user's job title via Microsoft Graph and returns it
 * as a normalized role string (trimmed, original casing preserved for matching).
 *
 * The Graph call requires the User.Read delegated permission, which is granted
 * by default to all SPFx web parts in SharePoint Online.
 */
export function useCurrentUserRole(context: WebPartContext): ICurrentUserRoleResult {
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJobTitle(): Promise<void> {
      try {
        const graph = graphfi().using(GraphSPFx(context));
        const me = await graph.me.select("jobTitle")();
        if (!cancelled) {
          setJobTitle(me.jobTitle ? me.jobTitle.trim() : null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[SopRepository] Failed to fetch current user job title:", err);
          setError("Could not retrieve job title from Microsoft Graph.");
          setJobTitle(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchJobTitle();

    return () => {
      cancelled = true;
    };
  }, [context]);

  return { jobTitle, isLoading, error };
}
