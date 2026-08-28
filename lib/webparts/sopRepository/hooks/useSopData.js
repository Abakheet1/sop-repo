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
import { useEffect, useState, useCallback } from "react";
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
export function useSopData(service, selectedRole) {
    var _a = useState([]), roles = _a[0], setRoles = _a[1];
    var _b = useState([]), documentedProcesses = _b[0], setDocumentedProcesses = _b[1];
    var _c = useState([]), gapProcesses = _c[0], setGapProcesses = _c[1];
    var _d = useState([]), sopDocuments = _d[0], setSopDocuments = _d[1];
    var _e = useState([]), jobDescriptions = _e[0], setJobDescriptions = _e[1];
    var _f = useState(false), isLoading = _f[0], setIsLoading = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    var _h = useState(0), tick = _h[0], setTick = _h[1];
    var reload = useCallback(function () { return setTick(function (t) { return t + 1; }); }, []);
    // Load roles list on mount (doesn't depend on selected role)
    useEffect(function () {
        if (!service)
            return;
        var cancelled = false;
        function loadRoles() {
            return __awaiter(this, void 0, void 0, function () {
                var result, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, service.getRoles()];
                        case 1:
                            result = _a.sent();
                            if (!cancelled)
                                setRoles(result);
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            if (!cancelled) {
                                console.error("[SopRepository] Failed to load roles:", err_1);
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        void loadRoles();
        return function () { cancelled = true; };
    }, [service]);
    // Load process + document data when role or service changes
    useEffect(function () {
        if (!service || !selectedRole) {
            setDocumentedProcesses([]);
            setGapProcesses([]);
            setSopDocuments([]);
            setJobDescriptions([]);
            return;
        }
        var cancelled = false;
        setIsLoading(true);
        setError(null);
        function loadData() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, processes, documents_1, sops, jds, viewModels, err_2, msg;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, 3, 4]);
                            return [4 /*yield*/, Promise.all([
                                    service.getProcessesByRole(selectedRole),
                                    service.getDocumentsByRole(selectedRole),
                                ])];
                        case 1:
                            _a = _b.sent(), processes = _a[0], documents_1 = _a[1];
                            if (cancelled)
                                return [2 /*return*/];
                            sops = documents_1.filter(function (d) { return d.documentType === "SOP"; });
                            jds = documents_1.filter(function (d) { return d.documentType === "Job Description"; });
                            setSopDocuments(sops);
                            setJobDescriptions(jds);
                            viewModels = processes.map(function (p) {
                                var matched = documents_1.filter(function (d) {
                                    return d.processTitle.trim().toLowerCase() === p.title.trim().toLowerCase();
                                });
                                var isDocumented = p.documentLink.trim().length > 0 || matched.length > 0;
                                return {
                                    id: p.id,
                                    processTitle: p.title,
                                    roleChoice: p.roleChoice,
                                    isDocumented: isDocumented,
                                    documentLink: p.documentLink,
                                    matchedDocuments: matched,
                                };
                            });
                            setDocumentedProcesses(viewModels.filter(function (v) { return v.isDocumented; }));
                            setGapProcesses(viewModels.filter(function (v) { return !v.isDocumented; }));
                            return [3 /*break*/, 4];
                        case 2:
                            err_2 = _b.sent();
                            if (!cancelled) {
                                msg = err_2 instanceof Error ? err_2.message : String(err_2);
                                console.error("[SopRepository] Failed to load SOP data:", err_2);
                                setError("Failed to load data: ".concat(msg));
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            if (!cancelled)
                                setIsLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        void loadData();
        return function () { cancelled = true; };
    }, [service, selectedRole, tick]);
    return {
        roles: roles,
        documentedProcesses: documentedProcesses,
        gapProcesses: gapProcesses,
        sopDocuments: sopDocuments,
        jobDescriptions: jobDescriptions,
        isLoading: isLoading,
        error: error,
        reload: reload,
    };
}
//# sourceMappingURL=useSopData.js.map