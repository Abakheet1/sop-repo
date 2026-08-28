var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
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
var FIELDS = {
    // Process list columns
    ROLE_CHOICE: "Role_x0020__x0028_Choice_x0029_",
    DOCUMENT_LINK: "DocumentLink",
    DOCUMENT_TYPE: "DocumentType",
    // SOP Process Library columns
    LIB_PROCESS: "Process",
    LIB_STATUS: "Status",
    LIB_REVIEW_DATE: "ReviewDate",
    LIB_FILE_REF: "FileRef",
    LIB_ENCODED_ABS_URL: "EncodedAbsUrl",
    // Roles list columns
    ROLES_DEPARTMENT: "Department",
    ROLES_ACTIVE: "Active",
    ROLES_DESCRIPTION: "Description",
};
var SopService = /** @class */ (function () {
    function SopService(context, config) {
        this._config = config;
        // Point PnP JS at the SOP data site (may differ from the page's host site)
        this._sp = spfi(this._config.sopSiteUrl).using(SPFx(context));
    }
    /** Reconfigure if property pane values change */
    SopService.prototype.updateConfig = function (config) {
        this._config = config;
    };
    /** Returns all active roles from the Roles list */
    SopService.prototype.getRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var items;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._sp.web
                            .lists.getByTitle(this._config.rolesListName)
                            .items.select("ID", "Title", FIELDS.ROLES_DESCRIPTION, FIELDS.ROLES_DEPARTMENT, FIELDS.ROLES_ACTIVE)
                            .filter("".concat(FIELDS.ROLES_ACTIVE, " eq 1"))
                            .orderBy("Title", true)()];
                    case 1:
                        items = _a.sent();
                        return [2 /*return*/, items.map(function (item) { return ({
                                id: item.ID,
                                title: item.Title || "",
                                description: item[FIELDS.ROLES_DESCRIPTION] || "",
                                department: item[FIELDS.ROLES_DEPARTMENT] || "",
                                active: !!item[FIELDS.ROLES_ACTIVE],
                            }); })];
                }
            });
        });
    };
    /**
     * Returns all processes from the Process list that match the given role.
     * Matching uses case-insensitive comparison to guard against whitespace differences.
     * The "Has SOP" flag is intentionally excluded — gap detection is derived at runtime
     * by checking whether documentLink is non-empty.
     */
    SopService.prototype.getProcessesByRole = function (role) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedRole, items;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalizedRole = role.trim();
                        return [4 /*yield*/, this._sp.web
                                .lists.getByTitle(this._config.processListName)
                                .items.select("ID", "Title", FIELDS.ROLE_CHOICE, FIELDS.DOCUMENT_LINK, FIELDS.DOCUMENT_TYPE)
                                .filter("".concat(FIELDS.ROLE_CHOICE, " eq '").concat(normalizedRole.replace(/'/g, "''"), "'"))
                                .top(500)()];
                    case 1:
                        items = _a.sent();
                        return [2 /*return*/, items.map(function (item) {
                                var _a;
                                return ({
                                    id: item.ID,
                                    title: item.Title || "",
                                    roleChoice: item[FIELDS.ROLE_CHOICE] || "",
                                    documentLink: ((_a = item[FIELDS.DOCUMENT_LINK]) === null || _a === void 0 ? void 0 : _a.Url) || item[FIELDS.DOCUMENT_LINK] || "",
                                    documentType: item[FIELDS.DOCUMENT_TYPE] || "",
                                });
                            })];
                }
            });
        });
    };
    /**
     * Returns all documents from the SOP Process Library for the given role.
     * Includes both SOPs and Job Descriptions so the summary bar can tally each type.
     */
    SopService.prototype.getDocumentsByRole = function (role) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedRole, items;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalizedRole = role.trim();
                        return [4 /*yield*/, this._sp.web
                                .lists.getByTitle(this._config.libraryName)
                                .items.select("ID", "Title", FIELDS.ROLE_CHOICE, FIELDS.LIB_PROCESS, FIELDS.DOCUMENT_TYPE, FIELDS.LIB_STATUS, FIELDS.LIB_REVIEW_DATE, FIELDS.LIB_FILE_REF, FIELDS.LIB_ENCODED_ABS_URL)
                                .filter("".concat(FIELDS.ROLE_CHOICE, " eq '").concat(normalizedRole.replace(/'/g, "''"), "'"))
                                .top(500)()];
                    case 1:
                        items = _a.sent();
                        return [2 /*return*/, items.map(function (item) { return ({
                                id: item.ID,
                                title: item.Title || "",
                                roleChoice: item[FIELDS.ROLE_CHOICE] || "",
                                processTitle: item[FIELDS.LIB_PROCESS] || "",
                                documentType: item[FIELDS.DOCUMENT_TYPE] || "",
                                status: item[FIELDS.LIB_STATUS] || "",
                                reviewDate: item[FIELDS.LIB_REVIEW_DATE] || "",
                                fileUrl: item[FIELDS.LIB_ENCODED_ABS_URL] || item[FIELDS.LIB_FILE_REF] || "",
                            }); })];
                }
            });
        });
    };
    return SopService;
}());
export { SopService };
//# sourceMappingURL=SopService.js.map