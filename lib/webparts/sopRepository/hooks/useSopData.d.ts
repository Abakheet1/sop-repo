import { IRole } from "../models/IRole";
import { ISopDocument } from "../models/ISopDocument";
import { IProcessViewModel } from "../models/IProcessViewModel";
import { SopService } from "../services/SopService";
export interface ISopDataResult {
    roles: IRole[];
    documentedProcesses: IProcessViewModel[];
    gapProcesses: IProcessViewModel[];
    sopDocuments: ISopDocument[];
    jobDescriptions: ISopDocument[];
    isLoading: boolean;
    error: string | null;
    reload: () => void;
}
/**
 * Loads and joins Process list + SOP library data for the selected role.
 *
 * Gap detection logic:
 *   - A process is DOCUMENTED if its documentLink is non-empty.
 *   - A process is a GAP if its documentLink is empty.
 *   - "Has SOP" boolean column in the Process list is intentionally ignored (stale data).
 *
 * Join logic:
 *   - Documents are matched to processes by case-insensitive comparison of
 *     ISopDocument.processTitle vs IProcess.title.
 */
export declare function useSopData(service: SopService | null, selectedRole: string | null): ISopDataResult;
//# sourceMappingURL=useSopData.d.ts.map