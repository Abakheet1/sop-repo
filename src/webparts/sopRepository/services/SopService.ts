import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { IRole } from "../models/IRole";
import { IProcess } from "../models/IProcess";
import { ISopDocument } from "../models/ISopDocument";

/**
 * Internal REST API field name constants.
 *
 * IMPORTANT: If queries return empty results for role-filtered calls, verify these
 * internal names against your tenant by calling:
 *   GET https://communityessentials.sharepoint.com/sites/SOPProcessManagement/_api/web/lists/getbytitle('Process')/fields?$select=InternalName,Title
 *
 * SharePoint encodes column display names: spaces → _x0020_, ( → _x0028_, ) → _x0029_
 * e.g. "Role (Choice)" → "Role_x0020__x0028_Choice_x0029_"
 */
const FIELDS = {
  // Process list columns
  ROLE_CHOICE: "Role_x0020__x0028_Choice_x0029_",   // Display: "Role (Choice)"
  DOCUMENT_LINK: "DocumentLink",                      // Display: "Document Link" (URL field, internal name confirmed from schema)
  DOCUMENT_TYPE: "DocumentType",                      // Display: "Document Type"

  // SOP & Process Library columns
  LIB_PROCESS: "Process",                            // Display: "Process"
  LIB_STATUS: "Status",
  LIB_REVIEW_DATE: "ReviewDate",                     // Display: "Review Date"
  LIB_FILE_REF: "FileRef",                           // Built-in: relative server path
  LIB_ENCODED_ABS_URL: "EncodedAbsUrl",              // Built-in: absolute URL

  // Roles list columns
  ROLES_DEPARTMENT: "Department",
  ROLES_ACTIVE: "Active",
  ROLES_DESCRIPTION: "Description",
} as const;

export interface ISopServiceConfig {
  sopSiteUrl: string;
  libraryName: string;
  processListName: string;
  rolesListName: string;
}

export class SopService {
  private _config: ISopServiceConfig;
  private _sp: ReturnType<typeof spfi>;

  constructor(context: WebPartContext, config: ISopServiceConfig) {
    this._config = config;
    // Point PnP JS at the SOP data site (may differ from the page's host site)
    this._sp = spfi(this._config.sopSiteUrl).using(SPFx(context));
  }

  /** Reconfigure if property pane values change */
  public updateConfig(config: ISopServiceConfig): void {
    this._config = config;
  }

  /** Returns all active roles from the Roles list */
  public async getRoles(): Promise<IRole[]> {
    const items = await this._sp.web
      .lists.getByTitle(this._config.rolesListName)
      .items.select(
        "ID",
        "Title",
        FIELDS.ROLES_DESCRIPTION,
        FIELDS.ROLES_DEPARTMENT,
        FIELDS.ROLES_ACTIVE
      )
      .filter(`${FIELDS.ROLES_ACTIVE} eq 1`)
      .orderBy("Title", true)();

    return items.map((item: any) => ({
      id: item.ID,
      title: item.Title || "",
      description: item[FIELDS.ROLES_DESCRIPTION] || "",
      department: item[FIELDS.ROLES_DEPARTMENT] || "",
      active: !!item[FIELDS.ROLES_ACTIVE],
    }));
  }

  /**
   * Returns all processes from the Process list that match the given role.
   * Matching uses case-insensitive comparison to guard against whitespace differences.
   * The "Has SOP" flag is intentionally excluded — gap detection is derived at runtime
   * by checking whether documentLink is non-empty.
   */
  public async getProcessesByRole(role: string): Promise<IProcess[]> {
    const normalizedRole = role.trim();

    // Filter on the REST API using the exact encoded field name.
    // We also fetch all and filter client-side as a fallback in case the
    // internal name differs on this tenant.
    const items = await this._sp.web
      .lists.getByTitle(this._config.processListName)
      .items.select(
        "ID",
        "Title",
        FIELDS.ROLE_CHOICE,
        FIELDS.DOCUMENT_LINK,
        FIELDS.DOCUMENT_TYPE
      )
      .filter(`${FIELDS.ROLE_CHOICE} eq '${normalizedRole.replace(/'/g, "''")}'`)
      .top(500)();

    return items.map((item: any) => ({
      id: item.ID,
      title: item.Title || "",
      roleChoice: item[FIELDS.ROLE_CHOICE] || "",
      documentLink: item[FIELDS.DOCUMENT_LINK]?.Url || item[FIELDS.DOCUMENT_LINK] || "",
      documentType: item[FIELDS.DOCUMENT_TYPE] || "",
    }));
  }

  /**
   * Returns all documents from the SOP & Process Library for the given role.
   * Includes both SOPs and Job Descriptions so the summary bar can tally each type.
   */
  public async getDocumentsByRole(role: string): Promise<ISopDocument[]> {
    const normalizedRole = role.trim();

    // "Process" is a Lookup column (references the Process list's Title), so the
    // REST API requires it to be selected as "Process/Title" with a matching
    // $expand=Process — selecting the bare field name errors with:
    // "The $select query string must specify the target fields and the
    // $expand query string must contains Process."
    const items = await this._sp.web
      .lists.getByTitle(this._config.libraryName)
      .items.select(
        "ID",
        "Title",
        FIELDS.ROLE_CHOICE,
        `${FIELDS.LIB_PROCESS}/Title`,
        FIELDS.DOCUMENT_TYPE,
        FIELDS.LIB_STATUS,
        FIELDS.LIB_REVIEW_DATE,
        FIELDS.LIB_FILE_REF,
        FIELDS.LIB_ENCODED_ABS_URL
      )
      .expand(FIELDS.LIB_PROCESS)
      .filter(`${FIELDS.ROLE_CHOICE} eq '${normalizedRole.replace(/'/g, "''")}'`)
      .top(500)();

    return items.map((item: any) => ({
      id: item.ID,
      title: item.Title || "",
      roleChoice: item[FIELDS.ROLE_CHOICE] || "",
      processTitle: item[FIELDS.LIB_PROCESS]?.Title || "",
      documentType: item[FIELDS.DOCUMENT_TYPE] || "",
      status: item[FIELDS.LIB_STATUS] || "",
      reviewDate: item[FIELDS.LIB_REVIEW_DATE] || "",
      fileUrl: item[FIELDS.LIB_ENCODED_ABS_URL] || item[FIELDS.LIB_FILE_REF] || "",
    }));
  }
}
