import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/site-users";
import { IRole } from "../models/IRole";
import { IProcess } from "../models/IProcess";
import { ISopDocument } from "../models/ISopDocument";

/**
 * Best-guess internal REST API field names, used only as a fallback when the
 * live schema lookup (see resolveFieldName below) fails for some reason (e.g.
 * a transient permissions/network error). The actual internal name used at
 * runtime is always resolved dynamically from each list's field schema by
 * display name, because SharePoint's automatic encoding of display names
 * (spaces → _x0020_, parentheses → _x0028_/_x0029_, etc.) has proven
 * unreliable to predict by hand across tenants/columns — hardcoding a single
 * guess here previously caused "field does not exist" runtime errors.
 */
const FIELDS = {
  // Process list columns
  ROLE_CHOICE: "Role_x0020__x0028_Choice_x0029_",   // Display: "Role (Choice)"
  DOCUMENT_LINK: "DocumentLink",                      // Display: "Document Link"
  DOCUMENT_TYPE: "DocumentType",                      // Display: "Document Type"

  // SOP & Process Library columns
  LIB_PROCESS: "Process",                            // Display: "Process"
  LIB_STATUS: "Status",
  LIB_REVIEW_DATE: "ReviewDate",                     // Display: "Review Date"
  LIB_OWNER: "Owner",
  LIB_ROLE_LOOKUP: "Role_x0020__x0028_Lookup_x0029_", // Display: "Role (Lookup)"
  LIB_FILE_REF: "FileRef",                           // Built-in: relative server path
  LIB_ENCODED_ABS_URL: "EncodedAbsUrl",              // Built-in: absolute URL
  LIB_FILE_LEAF_REF: "FileLeafRef",                  // Built-in: file name with extension

  // Roles list columns
  ROLES_DEPARTMENT: "Department",
  ROLES_ACTIVE: "Active",
  ROLES_DESCRIPTION: "Description",
} as const;

/** Display names used to resolve the real internal name from each list's schema. */
const DISPLAY_NAMES = {
  ROLE_CHOICE: "Role (Choice)",
  DOCUMENT_LINK: "Document Link",
  DOCUMENT_TYPE: "Document Type",
  LIB_STATUS: "Status",
  LIB_REVIEW_DATE: "Review Date",
  LIB_OWNER: "Owner",
  LIB_ROLE_LOOKUP: "Role (Lookup)",
  ROLES_DEPARTMENT: "Department",
  ROLES_ACTIVE: "Active",
  ROLES_DESCRIPTION: "Description",
} as const;

export interface ISopServiceConfig {
  sopSiteUrl: string;
  libraryName: string;
  processListName: string;
  rolesListName: string;
  /** List that gates the document-upload feature to specific signed-in users */
  adminListName: string;
}

/** Parameters accepted by SopService.uploadDocument */
export interface IUploadDocumentParams {
  file: File | Blob;
  fileName: string;
  /** "Role (Choice)" value to stamp on the uploaded document — normally the
   * role already recorded on the target Process record, so it always matches
   * exactly (avoids introducing a new case/whitespace mismatch). */
  role: string;
  /** Process list item ID the document should be linked to */
  processId: number;
  documentType: string;
  status: string;
  /** SharePoint site user Id (from searchPeople/ensurePersonByEmail) to stamp
   * on the library's "Owner" Person column. Optional — left unset if the
   * admin doesn't pick an owner. */
  ownerId?: number;
}

/** A selectable person, resolved from the site's user list for the Owner picker. */
export interface IPersonOption {
  id: number;
  loginName: string;
  displayName: string;
  email: string;
}

export class SopService {
  private _config: ISopServiceConfig;
  private _sp: ReturnType<typeof spfi>;
  private _fieldNameCache = new Map<string, string>();

  constructor(context: WebPartContext, config: ISopServiceConfig) {
    this._config = config;
    // Point PnP JS at the SOP data site (may differ from the page's host site)
    this._sp = spfi(this._config.sopSiteUrl).using(SPFx(context));
  }

  /** Reconfigure if property pane values change */
  public updateConfig(config: ISopServiceConfig): void {
    this._config = config;
    this._fieldNameCache.clear();
  }

  /**
   * Compares a raw REST field value against a target role, case-insensitively
   * and trimmed. Handles every shape a SharePoint Choice column can return:
   * a plain string (single-value Choice), or a multi-value Choice's
   * `{ results: string[] }` wrapper. Server-side OData `eq` filters on Choice
   * columns require an exact byte-for-byte match (including case), which is
   * too brittle for values sourced from Microsoft Graph job titles — this
   * client-side comparison is the actual guard against case/whitespace
   * differences (the behavior this method previously only claimed to have).
   */
  private static _roleMatches(fieldValue: unknown, targetRole: string): boolean {
    const target = targetRole.trim().toLowerCase();
    if (!fieldValue) return false;

    if (typeof fieldValue === "string") {
      return fieldValue.trim().toLowerCase() === target;
    }

    const multi = fieldValue as { results?: unknown[] };
    if (Array.isArray(multi.results)) {
      return multi.results.some(
        (v) => typeof v === "string" && v.trim().toLowerCase() === target
      );
    }

    return false;
  }

  /**
   * Resolves a column's true REST internal name by looking up its display
   * name in the list's field schema, instead of guessing SharePoint's
   * automatic encoding (spaces → _x0020_, parentheses → _x0028_/_x0029_,
   * etc.), which has proven unreliable across tenants/columns. Falls back
   * to the hardcoded best-guess name (and, failing that, the display name
   * itself) if the schema lookup fails for any reason.
   */
  private async _resolveFieldName(
    listTitle: string,
    displayName: string,
    fallback: string
  ): Promise<string> {
    const cacheKey = `${listTitle}::${displayName}`;
    const cached = this._fieldNameCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const field: { InternalName?: string } = await this._sp.web
        .lists.getByTitle(listTitle)
        .fields.getByTitle(displayName)
        .select("InternalName")();
      const internalName = field.InternalName || fallback;
      this._fieldNameCache.set(cacheKey, internalName);
      return internalName;
    } catch {
      // Schema lookup failed (e.g. display name mismatch, permissions) —
      // fall back to the best-guess name so the caller can still try.
      this._fieldNameCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  /** Returns all active roles from the Roles list */
  public async getRoles(): Promise<IRole[]> {
    const listTitle = this._config.rolesListName;
    const [descriptionField, departmentField, activeField] = await Promise.all([
      this._resolveFieldName(listTitle, DISPLAY_NAMES.ROLES_DESCRIPTION, FIELDS.ROLES_DESCRIPTION),
      this._resolveFieldName(listTitle, DISPLAY_NAMES.ROLES_DEPARTMENT, FIELDS.ROLES_DEPARTMENT),
      this._resolveFieldName(listTitle, DISPLAY_NAMES.ROLES_ACTIVE, FIELDS.ROLES_ACTIVE),
    ]);

    const items = await this._sp.web
      .lists.getByTitle(listTitle)
      .items.select("ID", "Title", descriptionField, departmentField, activeField)
      .filter(`${activeField} eq 1`)
      .orderBy("Title", true)();

    return items.map((item: any) => ({
      id: item.ID,
      title: item.Title || "",
      description: item[descriptionField] || "",
      department: item[departmentField] || "",
      active: !!item[activeField],
    }));
  }

  /**
   * Returns all processes from the Process list that match the given role.
   * Matching uses case-insensitive comparison to guard against whitespace differences.
   * The "Has SOP" flag is intentionally excluded — gap detection is derived at runtime
   * by checking whether documentLink is non-empty.
   */
  public async getProcessesByRole(role: string): Promise<IProcess[]> {
    const listTitle = this._config.processListName;
    const [roleField, documentLinkField, documentTypeField] = await Promise.all([
      this._resolveFieldName(listTitle, DISPLAY_NAMES.ROLE_CHOICE, FIELDS.ROLE_CHOICE),
      this._resolveFieldName(listTitle, DISPLAY_NAMES.DOCUMENT_LINK, FIELDS.DOCUMENT_LINK),
      this._resolveFieldName(listTitle, DISPLAY_NAMES.DOCUMENT_TYPE, FIELDS.DOCUMENT_TYPE),
    ]);

    // Role matching is done client-side (see _roleMatches) rather than via an
    // OData $filter, because Choice-column equality filters require an exact
    // case-sensitive match — too brittle for a role string sourced from a
    // Microsoft Graph job title that may differ in case/whitespace from the
    // value stored in this list.
    const items = await this._sp.web
      .lists.getByTitle(listTitle)
      .items.select("ID", "Title", roleField, documentLinkField, documentTypeField)
      .top(2000)();

    return items
      .filter((item: any) => SopService._roleMatches(item[roleField], role))
      .map((item: any) => ({
        id: item.ID,
        title: item.Title || "",
        roleChoice: item[roleField] || "",
        documentLink: item[documentLinkField]?.Url || item[documentLinkField] || "",
        documentType: item[documentTypeField] || "",
      }));
  }

  /**
   * Returns all documents from the SOP & Process Library for the given role.
   * Includes both SOPs and Job Descriptions so the summary bar can tally each type.
   */
  public async getDocumentsByRole(role: string): Promise<ISopDocument[]> {
    const listTitle = this._config.libraryName;
    const [roleField, processField, documentTypeField, statusField, reviewDateField] =
      await Promise.all([
        this._resolveFieldName(listTitle, DISPLAY_NAMES.ROLE_CHOICE, FIELDS.ROLE_CHOICE),
        this._resolveFieldName(listTitle, "Process", FIELDS.LIB_PROCESS),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.DOCUMENT_TYPE, FIELDS.DOCUMENT_TYPE),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.LIB_STATUS, FIELDS.LIB_STATUS),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.LIB_REVIEW_DATE, FIELDS.LIB_REVIEW_DATE),
      ]);

    // "Process" is a Lookup column (references the Process list's Title), so the
    // REST API requires it to be selected as "Process/Title" with a matching
    // $expand=Process — selecting the bare field name errors with:
    // "The $select query string must specify the target fields and the
    // $expand query string must contains Process."
    //
    // Role matching is done client-side (see _roleMatches) rather than via an
    // OData $filter — see getProcessesByRole for why.
    //
    // "Modified" is a built-in SharePoint column (always present, no schema
    // lookup needed) that's automatically updated whenever the file changes —
    // unlike the manually-entered Review Date column, it's never blank, so
    // it's used as the fallback display date when Review Date hasn't been set.
    const items = await this._sp.web
      .lists.getByTitle(listTitle)
      .items.select(
        "ID",
        "Title",
        roleField,
        `${processField}/Title`,
        documentTypeField,
        statusField,
        reviewDateField,
        FIELDS.LIB_FILE_REF,
        FIELDS.LIB_ENCODED_ABS_URL,
        FIELDS.LIB_FILE_LEAF_REF,
        "Modified"
      )
      .expand(processField)
      .top(2000)();

    return items
      .filter((item: any) => SopService._roleMatches(item[roleField], role))
      .map((item: any) => ({
        id: item.ID,
        // Document libraries commonly leave the optional "Title" metadata column
        // blank even though a real file was uploaded — fall back to the actual
        // file name so the document always has visible, clickable link text
        // instead of rendering an empty link.
        title: item.Title || item[FIELDS.LIB_FILE_LEAF_REF] || "Untitled Document",
        roleChoice: item[roleField] || "",
        processTitle: item[processField]?.Title || "",
        documentType: item[documentTypeField] || "",
        status: item[statusField] || "",
        reviewDate: item[reviewDateField] || "",
        modified: item.Modified || "",
        fileUrl: item[FIELDS.LIB_ENCODED_ABS_URL] || item[FIELDS.LIB_FILE_REF] || "",
      }));
  }

  /**
   * Checks whether the given user (matched by UPN/email, case-insensitively)
   * is listed in the Admin Access list with an Access Level of "Admin". Gates
   * the document upload feature. Fails closed — any lookup error, missing
   * configuration, or no match results in false, never true, so a transient
   * error can never accidentally grant upload access.
   */
  public async isAdmin(userPrincipalName: string): Promise<boolean> {
    const listTitle = this._config.adminListName;
    if (!userPrincipalName || !listTitle) return false;

    try {
      const [upnField, accessField] = await Promise.all([
        this._resolveFieldName(listTitle, "UserPrincipalName", "UserPrincipalName"),
        this._resolveFieldName(listTitle, "AccessLevel", "AccessLevel"),
      ]);

      // UserPrincipalName is a Person/Group (People Picker) column, so its REST
      // value is an object, not plain text — request the person's Email/Login
      // Name/Title via $expand instead of selecting the field directly.
      const items = await this._sp.web
        .lists.getByTitle(listTitle)
        .items.select(
          "ID",
          `${upnField}/EMail`,
          `${upnField}/Name`,
          `${upnField}/Title`,
          accessField
        )
        .expand(upnField)
        .top(2000)();

      const target = userPrincipalName.trim().toLowerCase();
      return items.some((item: any) => {
        const person = SopService._extractPerson(item[upnField]);
        if (!person) return false;

        const email = String(person.EMail || "").trim().toLowerCase();
        const loginName = String(person.Name || "").trim().toLowerCase();
        // Login names are claims-encoded (e.g. "i:0#.f|membership|user@domain.com") —
        // also compare the substring after the last "|" so a claims-format login
        // still matches a plain email/UPN.
        const loginEmail = loginName.includes("|") ? loginName.split("|").pop() || "" : loginName;
        const matchesUser = email === target || loginName === target || loginEmail === target;
        if (!matchesUser) return false;

        const rawAccess = item[accessField];
        const access =
          typeof rawAccess === "string"
            ? rawAccess
            : (rawAccess as { results?: string[] })?.results?.[0] || "";
        return access.trim().toLowerCase() === "admin";
      });
    } catch (err) {
      console.error("[SopService] Failed to verify admin access:", err);
      return false;
    }
  }

  /**
   * Normalizes a People Picker field's REST shape to a single person object.
   * Single-value Person columns return the object directly; multi-value
   * (allow-multiple) Person columns return { results: [...] } — this handles
   * either shape and always returns the first/only person, or undefined.
   */
  private static _extractPerson(
    raw: unknown
  ): { EMail?: string; Name?: string; Title?: string } | undefined {
    if (!raw) return undefined;
    const withResults = raw as { results?: { EMail?: string; Name?: string; Title?: string }[] };
    if (Array.isArray(withResults.results)) {
      return withResults.results[0];
    }
    return raw as { EMail?: string; Name?: string; Title?: string };
  }

  /**
   * Uploads a document to the SOP & Process Library and automatically
   * populates its metadata (Role (Choice), Process lookup, Document Type,
   * Status) so an admin never has to manually fill in the library columns
   * after uploading. If the target Process record's "Document Link" column
   * is currently blank (i.e. it's an undocumented process), also stamps that
   * column with a link to the newly uploaded file so the process is
   * immediately recognized as documented — existing curated links on
   * already-documented processes are left untouched.
   */
  public async uploadDocument(params: IUploadDocumentParams): Promise<void> {
    const listTitle = this._config.libraryName;
    const [roleField, processField, documentTypeField, statusField, ownerField, roleLookupField] =
      await Promise.all([
        this._resolveFieldName(listTitle, DISPLAY_NAMES.ROLE_CHOICE, FIELDS.ROLE_CHOICE),
        this._resolveFieldName(listTitle, "Process", FIELDS.LIB_PROCESS),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.DOCUMENT_TYPE, FIELDS.DOCUMENT_TYPE),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.LIB_STATUS, FIELDS.LIB_STATUS),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.LIB_OWNER, FIELDS.LIB_OWNER),
        this._resolveFieldName(listTitle, DISPLAY_NAMES.LIB_ROLE_LOOKUP, FIELDS.LIB_ROLE_LOOKUP),
      ]);

    // The library's "Role (Lookup)" column points at the matching item in the
    // Roles list (separate from "Role (Choice)", which is just free text) —
    // resolve it here so uploads stay consistent with manually-entered rows,
    // which otherwise leave Role (Lookup) blank and out of sync.
    let matchedRoleId: number | undefined;
    try {
      const roles = await this.getRoles();
      const target = params.role.trim().toLowerCase();
      matchedRoleId = roles.find((r) => r.title.trim().toLowerCase() === target)?.id;
    } catch (err) {
      console.error("[SopService] Failed to resolve Role (Lookup) for upload:", err);
    }

    const library = this._sp.web.lists.getByTitle(listTitle);
    const rootFolder = await library.rootFolder();

    // Upload the file into the library's root folder. addUsingPath handles
    // both small and large files without requiring a separate chunked-upload
    // code path for this use case (admin-uploaded SOP/JD documents).
    const uploaded = await this._sp.web
      .getFolderByServerRelativePath(rootFolder.ServerRelativeUrl)
      .files.addUsingPath(params.fileName, params.file, { Overwrite: false });

    // Re-fetch the file as a queryable object so we can get its associated
    // list item and set metadata on it.
    const item = await this._sp.web
      .getFileByServerRelativePath(uploaded.ServerRelativeUrl)
      .getItem();

    const updateProps: Record<string, unknown> = {
      [roleField]: params.role,
      [`${processField}Id`]: params.processId,
      [documentTypeField]: params.documentType,
      [statusField]: params.status,
    };
    // Owner is a Person column — only stamp it if the admin actually picked
    // someone, using the "<InternalName>Id" convention Person/Lookup columns
    // require for writes.
    if (params.ownerId) {
      updateProps[`${ownerField}Id`] = params.ownerId;
    }
    // Best-effort — if the Roles list has no item whose Title exactly matches
    // (e.g. the role was renamed/deactivated), Role (Choice) is still correct
    // and the app keeps working; only this secondary lookup column is skipped.
    if (matchedRoleId) {
      updateProps[`${roleLookupField}Id`] = matchedRoleId;
    }
    await item.update(updateProps);

    // Derive the file's absolute URL from the configured site URL's origin
    // plus the upload's server-relative path (ServerRelativeUrl is always
    // rooted at the site collection, so this is reliable regardless of which
    // web the library lives in).
    const origin = new URL(this._config.sopSiteUrl).origin;
    const fileUrl = `${origin}${uploaded.ServerRelativeUrl}`;

    const processListTitle = this._config.processListName;
    const documentLinkField = await this._resolveFieldName(
      processListTitle,
      DISPLAY_NAMES.DOCUMENT_LINK,
      FIELDS.DOCUMENT_LINK
    );
    const processItem = this._sp.web.lists.getByTitle(processListTitle).items.getById(params.processId);

    const current: any = await processItem.select(documentLinkField)();
    const hasExistingLink = !!(current[documentLinkField]?.Url || current[documentLinkField]);
    if (!hasExistingLink) {
      await processItem.update({
        [documentLinkField]: { Url: fileUrl, Description: params.fileName },
      });
    }
  }

  /**
   * Searches the site's existing users for the Owner people-picker, matching
   * a typed query against display name or email (case-insensitive, substring).
   * Only matches people already known to this site — SharePoint's own People
   * Picker control behaves the same way for a lightweight typeahead. If the
   * person hasn't visited the site yet, use ensurePersonByEmail instead.
   */
  public async searchPeople(query: string): Promise<IPersonOption[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    try {
      const users = await this._sp.web.siteUsers
        .select("Id", "Title", "Email", "LoginName", "PrincipalType", "IsHiddenInUI")
        .top(5000)();

      return users
        .filter((u: any) => u.PrincipalType === 1 && !u.IsHiddenInUI)
        .filter(
          (u: any) =>
            (u.Title || "").toLowerCase().indexOf(q) !== -1 ||
            (u.Email || "").toLowerCase().indexOf(q) !== -1
        )
        .slice(0, 8)
        .map((u: any) => ({
          id: u.Id,
          loginName: u.LoginName,
          displayName: u.Title,
          email: u.Email || "",
        }));
    } catch (err) {
      console.error("[SopService] Failed to search site users:", err);
      return [];
    }
  }

  /**
   * Resolves (and, if needed, provisions) a site user by email/UPN. Used as
   * a fallback when the desired Owner doesn't appear in searchPeople because
   * they've never visited this site — SharePoint's ensureUser adds them as a
   * site user (still subject to normal permissions) and returns their Id.
   */
  public async ensurePersonByEmail(email: string): Promise<IPersonOption | null> {
    const trimmed = email.trim();
    if (!trimmed) return null;

    try {
      const result = await this._sp.web.ensureUser(trimmed);
      return {
        id: result.Id,
        loginName: result.LoginName,
        displayName: result.Title || trimmed,
        email: result.Email || trimmed,
      };
    } catch (err) {
      console.error("[SopService] Failed to resolve user by email:", err);
      return null;
    }
  }
}
