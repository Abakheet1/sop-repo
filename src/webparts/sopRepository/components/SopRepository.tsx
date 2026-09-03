import * as React from "react";
import { useState, useEffect } from "react";
import {
  Stack,
  Text,
  Spinner,
  SpinnerSize,
  SearchBox,
  MessageBar,
  MessageBarType,
  Separator,
  Icon,
  Dropdown,
  IDropdownOption,
  ActionButton,
} from "@fluentui/react";
import { ISopRepositoryProps } from "./ISopRepositoryProps";
import { RoleSelector } from "./RoleSelector/RoleSelector";
import { CurrentRoleCard } from "./CurrentRoleCard/CurrentRoleCard";
import { SummaryBar } from "./SummaryBar/SummaryBar";
import { SopCard } from "./SopCard/SopCard";
import { GapCard } from "./GapCard/GapCard";
import { DocumentPreviewPanel } from "./DocumentPreviewPanel/DocumentPreviewPanel";
import { UploadDocumentDialog } from "./UploadDocumentDialog/UploadDocumentDialog";
import { useCurrentUserRole } from "../hooks/useCurrentUserRole";
import { useSopData } from "../hooks/useSopData";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { IProcessViewModel } from "../models/IProcessViewModel";
import { ISopDocument } from "../models/ISopDocument";
import styles from "./SopRepository.module.scss";

const ALL_TYPES_KEY = "__all_types__";
const ALL_STATUSES_KEY = "__all_statuses__";

export const SopRepository: React.FC<ISopRepositoryProps> = (props) => {
  const { context, service, showGaps, defaultRole } = props;

  // Detect current user's role from Graph
  const { jobTitle, isLoading: roleLoading } = useCurrentUserRole(context);

  // Whether the signed-in user is listed in the Admin Access list — gates
  // the document upload feature visible on each process card.
  const { isAdmin } = useIsAdmin(context, service);

  // Selected role state — start with defaultRole override, then auto-detect, then null
  const [selectedRole, setSelectedRole] = useState<string | null>(
    defaultRole || null
  );
  const [roleAutoDetected, setRoleAutoDetected] = useState<boolean>(false);

  // Department filter — narrows the role dropdown; independent of the loaded data for a role
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Keyword search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Document Type / Status filters — narrow which SOP/Job Description documents are shown
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Document selected for in-page preview (opens DocumentPreviewPanel)
  const [selectedDocument, setSelectedDocument] = useState<ISopDocument | null>(null);

  // Process currently targeted by the admin upload dialog (null = dialog closed)
  const [uploadTarget, setUploadTarget] = useState<IProcessViewModel | null>(null);

  // Load SOP data for selected role
  const {
    roles,
    documentedProcesses,
    gapProcesses,
    sopDocuments,
    jobDescriptions,
    isLoading: dataLoading,
    error,
    reload,
  } = useSopData(service, selectedRole);

  // When Graph returns a job title and no manual override is set, auto-select it.
  // Waits for the Roles list to finish loading, then resolves the Graph job title
  // to the matching Role list entry's exact Title (case-insensitive, trimmed
  // comparison) so the dropdown highlights correctly and downstream queries use
  // a value that's guaranteed to match the data. If no matching role exists in
  // the list, falls back to the raw Graph string so a query is still attempted.
  useEffect(() => {
    if (defaultRole || roleAutoDetected || !jobTitle || roles.length === 0) return;
    const match = roles.find(
      (r) => r.title.trim().toLowerCase() === jobTitle.trim().toLowerCase()
    );
    setSelectedRole(match ? match.title : jobTitle);
    setRoleAutoDetected(true);
  }, [jobTitle, defaultRole, roleAutoDetected, roles]);

  // When defaultRole prop changes (property pane), override selection
  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    }
  }, [defaultRole]);

  const isLoading = roleLoading || dataLoading;

  // Filter processes by search query. Matches on the process title as well as the
  // title of any linked SOP/Job Description so documentation stays searchable as
  // the repository grows.
  const filterProcesses = (list: IProcessViewModel[]): IProcessViewModel[] => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.processTitle.toLowerCase().includes(q) ||
        p.matchedDocuments.some((d) => d.title.toLowerCase().includes(q))
    );
  };

  // Narrows documents to those matching the selected Document Type / Status filters
  const applyDocFilters = (docs: ISopDocument[]): ISopDocument[] =>
    docs.filter(
      (d) =>
        (!selectedDocumentType || d.documentType === selectedDocumentType) &&
        (!selectedStatus || d.status === selectedStatus)
    );

  // Applies the Document Type / Status filters to documented processes, hiding
  // processes whose documents don't match. A process linked only via the Process
  // list's bare "Document Link" (no matched library documents) has no type/status
  // to filter on, so it's hidden once a filter is active.
  const filterByDocument = (list: IProcessViewModel[]): IProcessViewModel[] => {
    if (!selectedDocumentType && !selectedStatus) return list;
    return list
      .map((p) => ({ ...p, matchedDocuments: applyDocFilters(p.matchedDocuments) }))
      .filter((p) => p.matchedDocuments.length > 0);
  };

  const filteredDocumented = filterByDocument(filterProcesses(documentedProcesses));
  const filteredGaps = filterProcesses(gapProcesses);
  const filteredSopDocuments = applyDocFilters(sopDocuments);
  const filteredJobDescriptions = applyDocFilters(jobDescriptions);

  // Whether any of the searchable/narrowing filters (as opposed to the
  // Department/Role selection, which picks *whose* documentation to view)
  // are currently active — drives whether the Clear Filters button is shown.
  const hasActiveFilters = Boolean(searchQuery || selectedDocumentType || selectedStatus);

  const clearFilters = (): void => {
    setSearchQuery("");
    setSelectedDocumentType(null);
    setSelectedStatus(null);
  };

  const documentTypeOptions: IDropdownOption[] = [
    { key: ALL_TYPES_KEY, text: "All Types" },
    { key: "SOP", text: "SOP" },
    { key: "Job Description", text: "Job Description" },
  ];

  const statusOptions: IDropdownOption[] = [
    { key: ALL_STATUSES_KEY, text: "All Statuses" },
    { key: "Approved", text: "Approved" },
    { key: "Draft", text: "Draft" },
  ];

  return (
    <div className={styles.container}>
      <Stack horizontal verticalAlign="center" className={styles.header}>
        <Icon iconName="KnowledgeArticle" className={styles.headerIcon} />
        <Text variant="xLarge">Role & Responsibility Documentation</Text>
      </Stack>
      <Separator className={styles.headerDivider} />

      <Stack horizontal className={styles.layout} tokens={{ childrenGap: 24 }}>
        {/* Filters sidebar */}
        <Stack className={styles.sidebar} tokens={{ childrenGap: 16 }}>
          <RoleSelector
            roles={roles}
            selectedRole={selectedRole}
            onRoleChange={(role) => {
              setSelectedRole(role);
              setSearchQuery("");
            }}
            detectedRole={jobTitle && !defaultRole ? jobTitle : null}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={(department) => {
              setSelectedDepartment(department);
              // If the currently selected role doesn't belong to the newly
              // chosen department, clear it instead of leaving the Role
              // dropdown showing a blank placeholder while stale data for
              // the old role stays on screen.
              if (department && selectedRole) {
                const roleStillValid = roles.some(
                  (r) => r.title === selectedRole && r.department === department
                );
                if (!roleStillValid) {
                  setSelectedRole(null);
                  setSearchQuery("");
                }
              }
            }}
          />

          {!isLoading && !error && selectedRole && (
            <>
              <Separator className={styles.filterDivider} />

              <SearchBox
                placeholder="Search by process, SOP, or job description..."
                value={searchQuery}
                onChange={(_, val) => setSearchQuery(val || "")}
                onClear={() => setSearchQuery("")}
                className={styles.search}
              />

              <Stack className={styles.filterGroup} tokens={{ childrenGap: 12 }}>
                <Dropdown
                  label="Document Type"
                  options={documentTypeOptions}
                  selectedKey={selectedDocumentType || ALL_TYPES_KEY}
                  onChange={(_, option) => {
                    if (!option) return;
                    setSelectedDocumentType(option.key === ALL_TYPES_KEY ? null : String(option.key));
                  }}
                  styles={{ root: { width: "100%" } }}
                />

                <Dropdown
                  label="Status"
                  options={statusOptions}
                  selectedKey={selectedStatus || ALL_STATUSES_KEY}
                  onChange={(_, option) => {
                    if (!option) return;
                    setSelectedStatus(option.key === ALL_STATUSES_KEY ? null : String(option.key));
                  }}
                  styles={{ root: { width: "100%" } }}
                />

                {hasActiveFilters && (
                  <ActionButton
                    iconProps={{ iconName: "ClearFilter" }}
                    onClick={clearFilters}
                    className={styles.clearFiltersBtn}
                  >
                    Clear Filters
                  </ActionButton>
                )}
              </Stack>
            </>
          )}
        </Stack>

        {/* Content column */}
        <Stack className={styles.content} tokens={{ childrenGap: 0 }}>
          {/* Loading state */}
          {isLoading && (
            <Stack horizontalAlign="center" tokens={{ padding: "24px 0" }}>
              <Spinner size={SpinnerSize.large} label="Loading documentation..." />
            </Stack>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <MessageBar messageBarType={MessageBarType.error} isMultiline>
              {error}
            </MessageBar>
          )}

          {/* No role selected */}
          {!isLoading && !error && !selectedRole && (
            <MessageBar messageBarType={MessageBarType.warning}>
              {roleLoading
                ? "Determining your role..."
                : "Please select a department and role to view your documentation."}
            </MessageBar>
          )}

          {/* Main content */}
          {!isLoading && !error && selectedRole && (
            <Stack tokens={{ childrenGap: 0 }}>
              {/* Current role context — orients the user to whose documentation they're viewing before the counts/documents below */}
              <CurrentRoleCard
                role={roles.find((r) => r.title === selectedRole)}
                roleTitle={selectedRole}
                isAutoDetected={roleAutoDetected && !defaultRole}
                jobDescriptions={jobDescriptions}
                onSelectDocument={setSelectedDocument}
              />

              {/* Summary bar */}
              <SummaryBar
                sopCount={filteredSopDocuments.length}
                jdCount={filteredJobDescriptions.length}
                gapCount={showGaps ? gapProcesses.length : 0}
              />

              {/* Documented section */}
              <Text variant="large" className={styles.sectionHeader}>
                Documented Processes
              </Text>
              {filteredDocumented.length === 0 ? (
                <Text variant="medium" className={styles.emptyState}>
                  {searchQuery || selectedDocumentType || selectedStatus
                    ? "No documented processes match your search or filters."
                    : "No documented processes were found for this role."}
                </Text>
              ) : (
                filteredDocumented.map((p) => (
                  <SopCard
                    key={p.id}
                    process={p}
                    onSelectDocument={setSelectedDocument}
                    isAdmin={isAdmin}
                    onUpload={setUploadTarget}
                  />
                ))
              )}

              {/* Undocumented section */}
              {showGaps && (
                <>
                  <Separator className={styles.separator} />
                  <Text variant="large" className={`${styles.sectionHeader} ${styles.gapHeader}`}>
                    <Icon iconName="Info" className={styles.gapHeaderIcon} /> Undocumented Processes
                  </Text>
                  {filteredGaps.length === 0 ? (
                    <Text variant="medium" className={styles.emptyState}>
                      {searchQuery
                        ? "No undocumented processes match your search."
                        : "All processes are documented for this role."}
                    </Text>
                  ) : (
                    filteredGaps.map((p) => (
                      <GapCard key={p.id} process={p} isAdmin={isAdmin} onUpload={setUploadTarget} />
                    ))
                  )}
                </>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>

      {/* In-page document preview */}
      <DocumentPreviewPanel document={selectedDocument} onDismiss={() => setSelectedDocument(null)} />

      {/* Admin-only document upload dialog */}
      <UploadDocumentDialog
        isOpen={!!uploadTarget}
        process={uploadTarget}
        service={service}
        onDismiss={() => setUploadTarget(null)}
        onUploaded={() => {
          setUploadTarget(null);
          reload();
        }}
      />
    </div>
  );
};
