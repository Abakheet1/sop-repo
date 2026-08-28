import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { IRole } from "../models/IRole";
import { IProcess } from "../models/IProcess";
import { ISopDocument } from "../models/ISopDocument";
export interface ISopServiceConfig {
    sopSiteUrl: string;
    libraryName: string;
    processListName: string;
    rolesListName: string;
}
export declare class SopService {
    private _config;
    private _sp;
    constructor(context: WebPartContext, config: ISopServiceConfig);
    /** Reconfigure if property pane values change */
    updateConfig(config: ISopServiceConfig): void;
    /** Returns all active roles from the Roles list */
    getRoles(): Promise<IRole[]>;
    /**
     * Returns all processes from the Process list that match the given role.
     * Matching uses case-insensitive comparison to guard against whitespace differences.
     * The "Has SOP" flag is intentionally excluded — gap detection is derived at runtime
     * by checking whether documentLink is non-empty.
     */
    getProcessesByRole(role: string): Promise<IProcess[]>;
    /**
     * Returns all documents from the SOP Process Library for the given role.
     * Includes both SOPs and Job Descriptions so the summary bar can tally each type.
     */
    getDocumentsByRole(role: string): Promise<ISopDocument[]>;
}
//# sourceMappingURL=SopService.d.ts.map