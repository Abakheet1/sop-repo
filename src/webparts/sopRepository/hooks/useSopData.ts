import { useEffect, useState, useCallback } from "react";
import { IRole } from "../models/IRole";
import { IProcess } from "../models/IProcess";
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
export function useSopData(service: SopService | null, selectedRole: string | null): ISopDataResult {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [documentedProcesses, setDocumentedProcesses] = useState<IProcessViewModel[]>([]);
  const [gapProcesses, setGapProcesses] = useState<IProcessViewModel[]>([]);
  const [sopDocuments, setSopDocuments] = useState<ISopDocument[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<ISopDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // Load roles list on mount (doesn't depend on selected role)
  useEffect(() => {
    if (!service) return;
    let cancelled = false;

    async function loadRoles(): Promise<void> {
      try {
        const result = await service!.getRoles();
        if (!cancelled) setRoles(result);
      } catch (err) {
        if (!cancelled) {
          console.error("[SopRepository] Failed to load roles:", err);
        }
      }
    }

    void loadRoles();
    return () => { cancelled = true; };
  }, [service]);

  // Load process + document data when role or service changes
  useEffect(() => {
    if (!service || !selectedRole) {
      setDocumentedProcesses([]);
      setGapProcesses([]);
      setSopDocuments([]);
      setJobDescriptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadData(): Promise<void> {
      try {
        const [processes, documents] = await Promise.all([
          service!.getProcessesByRole(selectedRole!),
          service!.getDocumentsByRole(selectedRole!),
        ]);

        if (cancelled) return;

        // Partition documents
        const sops = documents.filter((d) => d.documentType === "SOP");
        const jds = documents.filter((d) => d.documentType === "Job Description");
        setSopDocuments(sops);
        setJobDescriptions(jds);

        // Build view models by joining processes with matching documents
        const viewModels: IProcessViewModel[] = processes.map((p: IProcess) => {
          const matched = documents.filter(
            (d) =>
              d.processTitle.trim().toLowerCase() === p.title.trim().toLowerCase()
          );
          const isDocumented = p.documentLink.trim().length > 0 || matched.length > 0;
          return {
            id: p.id,
            processTitle: p.title,
            roleChoice: p.roleChoice,
            isDocumented,
            documentLink: p.documentLink,
            matchedDocuments: matched,
          };
        });

        setDocumentedProcesses(viewModels.filter((v) => v.isDocumented));
        setGapProcesses(viewModels.filter((v) => !v.isDocumented));
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[SopRepository] Failed to load SOP data:", err);
          setError(`Failed to load data: ${msg}`);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadData();
    return () => { cancelled = true; };
  }, [service, selectedRole, tick]);

  return {
    roles,
    documentedProcesses,
    gapProcesses,
    sopDocuments,
    jobDescriptions,
    isLoading,
    error,
    reload,
  };
}
