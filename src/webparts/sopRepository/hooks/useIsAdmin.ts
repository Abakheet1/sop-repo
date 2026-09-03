import { useEffect, useState } from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SopService } from "../services/SopService";

export interface IIsAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Determines whether the current signed-in user is listed in the Admin
 * Access list with Access Level "Admin", gating the document upload
 * feature. Fails closed: any error, missing service, or unresolved user
 * principal name results in isAdmin = false rather than granting access.
 */
export function useIsAdmin(context: WebPartContext, service: SopService | null): IIsAdminResult {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function check(): Promise<void> {
      if (!service) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        // pageContext.user.email holds the signed-in user's UPN in SharePoint
        // Online; loginName is a fallback for tenants where email is blank.
        const upn = context.pageContext.user.email || context.pageContext.user.loginName || "";
        const result = await service.isAdmin(upn);
        if (!cancelled) setIsAdmin(result);
      } catch (err) {
        console.error("[SopRepository] Admin access check failed:", err);
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [context, service]);

  return { isAdmin, isLoading };
}
