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
} from "@fluentui/react";
import { ISopRepositoryProps } from "./ISopRepositoryProps";
import { RoleSelector } from "./RoleSelector/RoleSelector";
import { SummaryBar } from "./SummaryBar/SummaryBar";
import { SopCard } from "./SopCard/SopCard";
import { GapCard } from "./GapCard/GapCard";
import { useCurrentUserRole } from "../hooks/useCurrentUserRole";
import { useSopData } from "../hooks/useSopData";
import { IProcessViewModel } from "../models/IProcessViewModel";
import styles from "./SopRepository.module.scss";

export const SopRepository: React.FC<ISopRepositoryProps> = (props) => {
  const { context, service, showGaps, defaultRole } = props;

  // Detect current user's role from Graph
  const { jobTitle, isLoading: roleLoading } = useCurrentUserRole(context);

  // Selected role state — start with defaultRole override, then auto-detect, then null
  const [selectedRole, setSelectedRole] = useState<string | null>(
    defaultRole || null
  );
  const [roleAutoDetected, setRoleAutoDetected] = useState<boolean>(false);

  // Keyword search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // When Graph returns a job title and no manual override is set, auto-select it
  useEffect(() => {
    if (!defaultRole && jobTitle && !roleAutoDetected) {
      setSelectedRole(jobTitle);
      setRoleAutoDetected(true);
    }
  }, [jobTitle, defaultRole, roleAutoDetected]);

  // When defaultRole prop changes (property pane), override selection
  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    }
  }, [defaultRole]);

  // Load SOP data for selected role
  const {
    roles,
    documentedProcesses,
    gapProcesses,
    sopDocuments,
    jobDescriptions,
    isLoading: dataLoading,
    error,
  } = useSopData(service, selectedRole);

  const isLoading = roleLoading || dataLoading;

  // Filter processes by search query (searches process title, case-insensitive)
  const filterProcesses = (list: IProcessViewModel[]): IProcessViewModel[] => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((p) => p.processTitle.toLowerCase().includes(q));
  };

  const filteredDocumented = filterProcesses(documentedProcesses);
  const filteredGaps = filterProcesses(gapProcesses);

  return (
    <div className={styles.container}>
      <Text variant="xLarge" className={styles.header}>
        IT SOP & Policy Repository
      </Text>

      {/* Role Selector */}
      <RoleSelector
        roles={roles}
        selectedRole={selectedRole}
        onRoleChange={(role) => {
          setSelectedRole(role);
          setSearchQuery("");
        }}
        detectedRole={jobTitle && !defaultRole ? jobTitle : null}
      />

      {/* Loading state */}
      {isLoading && (
        <Stack horizontalAlign="center" tokens={{ padding: "24px 0" }}>
          <Spinner size={SpinnerSize.large} label="Loading SOP data..." />
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
            ? "Detecting your role..."
            : "Select a role above to view SOPs and processes."}
        </MessageBar>
      )}

      {/* Main content */}
      {!isLoading && !error && selectedRole && (
        <Stack tokens={{ childrenGap: 0 }}>
          {/* Summary bar */}
          <SummaryBar
            sopCount={sopDocuments.length}
            jdCount={jobDescriptions.length}
            gapCount={showGaps ? gapProcesses.length : 0}
          />

          {/* Search box */}
          <SearchBox
            placeholder="Search processes..."
            value={searchQuery}
            onChange={(_, val) => setSearchQuery(val || "")}
            onClear={() => setSearchQuery("")}
            className={styles.search}
          />

          {/* DOCUMENTED section */}
          <Text variant="large" className={styles.sectionHeader}>
            DOCUMENTED
          </Text>
          {filteredDocumented.length === 0 ? (
            <Text variant="medium" className={styles.emptyState}>
              {searchQuery ? "No documented processes match your search." : "No documented processes found for this role."}
            </Text>
          ) : (
            filteredDocumented.map((p) => <SopCard key={p.id} process={p} />)
          )}

          {/* GAPS section */}
          {showGaps && (
            <>
              <Separator className={styles.separator} />
              <Text variant="large" className={`${styles.sectionHeader} ${styles.gapHeader}`}>
                ⚠ GAPS — No SOP Yet
              </Text>
              {filteredGaps.length === 0 ? (
                <Text variant="medium" className={styles.emptyState}>
                  {searchQuery
                    ? "No gap processes match your search."
                    : "All processes are documented for this role."}
                </Text>
              ) : (
                filteredGaps.map((p) => <GapCard key={p.id} process={p} />)
              )}
            </>
          )}
        </Stack>
      )}
    </div>
  );
};
