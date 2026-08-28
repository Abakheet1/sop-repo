import { WebPartContext } from "@microsoft/sp-webpart-base";
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
export declare function useCurrentUserRole(context: WebPartContext): ICurrentUserRoleResult;
//# sourceMappingURL=useCurrentUserRole.d.ts.map