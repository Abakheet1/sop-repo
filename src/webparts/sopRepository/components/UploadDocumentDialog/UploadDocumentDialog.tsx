import * as React from "react";
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
  TextField,
  IconButton,
  Persona,
  PersonaSize,
  Dropdown,
  IDropdownOption,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { IProcessViewModel } from "../../models/IProcessViewModel";
import { SopService, IPersonOption } from "../../services/SopService";
import styles from "./UploadDocumentDialog.module.scss";

export interface IUploadDocumentDialogProps {
  isOpen: boolean;
  process: IProcessViewModel | null;
  service: SopService | null;
  onDismiss: () => void;
  /** Called after a successful upload so the caller can reload data and close the dialog */
  onUploaded: () => void;
}

const documentTypeOptions: IDropdownOption[] = [
  { key: "SOP", text: "SOP" },
  { key: "Job Description", text: "Job Description" },
];

const statusOptions: IDropdownOption[] = [
  { key: "Draft", text: "Draft" },
  { key: "Approved", text: "Approved" },
];

/**
 * Admin-only dialog for attaching a document directly to a process from the
 * app. Role and Process are auto-populated from the selected process record
 * (not editable) so the uploaded document's metadata always matches exactly
 * — the admin only chooses the file, Document Type, and Status.
 */
export const UploadDocumentDialog: React.FC<IUploadDocumentDialogProps> = ({
  isOpen,
  process,
  service,
  onDismiss,
  onUploaded,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [documentType, setDocumentType] = React.useState<string>("SOP");
  const [status, setStatus] = React.useState<string>("Draft");
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Owner (Person) picker state — a lightweight typeahead against existing
  // site users, with a fallback to add someone by email if they've never
  // visited the site yet.
  const [ownerQuery, setOwnerQuery] = React.useState<string>("");
  const [ownerSuggestions, setOwnerSuggestions] = React.useState<IPersonOption[]>([]);
  const [selectedOwner, setSelectedOwner] = React.useState<IPersonOption | null>(null);
  const [isSearchingOwner, setIsSearchingOwner] = React.useState<boolean>(false);
  const [isResolvingOwner, setIsResolvingOwner] = React.useState<boolean>(false);
  const ownerSearchTimer = React.useRef<number | undefined>(undefined);

  // Debounced owner search — waits for the admin to pause typing before
  // querying the site's user list, avoiding a request on every keystroke.
  React.useEffect(() => {
    if (ownerSearchTimer.current) {
      window.clearTimeout(ownerSearchTimer.current);
    }
    const query = ownerQuery.trim();
    if (!query || !service) {
      setOwnerSuggestions([]);
      return;
    }
    setIsSearchingOwner(true);
    ownerSearchTimer.current = window.setTimeout(() => {
      service
        .searchPeople(query)
        .then((results) => setOwnerSuggestions(results))
        .catch(() => setOwnerSuggestions([]))
        .finally(() => setIsSearchingOwner(false));
    }, 300);
    return () => {
      if (ownerSearchTimer.current) {
        window.clearTimeout(ownerSearchTimer.current);
      }
    };
  }, [ownerQuery, service]);

  const handleAddOwnerByEmail = async (): Promise<void> => {
    const email = ownerQuery.trim();
    if (!email || !service) return;
    setIsResolvingOwner(true);
    try {
      const person = await service.ensurePersonByEmail(email);
      if (person) {
        setSelectedOwner(person);
        setOwnerQuery("");
        setOwnerSuggestions([]);
      } else {
        setError(`Could not find or add a user matching "${email}".`);
      }
    } finally {
      setIsResolvingOwner(false);
    }
  };

  // Reset the form each time a new process is targeted, and default the
  // Document Type to whichever type this process is still missing (a
  // documented process with only an SOP most likely needs a Job Description
  // next, and vice versa).
  React.useEffect(() => {
    if (!process) return;
    setFile(null);
    setError(null);
    setIsUploading(false);
    setOwnerQuery("");
    setOwnerSuggestions([]);
    setSelectedOwner(null);
    const hasSop = process.matchedDocuments.some((d) => d.documentType === "SOP");
    const hasJd = process.matchedDocuments.some((d) => d.documentType === "Job Description");
    setDocumentType(!hasSop ? "SOP" : !hasJd ? "Job Description" : "SOP");
    setStatus("Draft");
  }, [process?.id]);

  if (!process) return null;

  const handleUpload = async (): Promise<void> => {
    if (!file || !service) {
      setError("Please choose a file to upload.");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      await service.uploadDocument({
        file,
        fileName: file.name,
        role: process.roleChoice,
        processId: process.id,
        documentType,
        status,
        ownerId: selectedOwner?.id,
      });
      onUploaded();
    } catch (err) {
      console.error("[SopRepository] Document upload failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`We were unable to upload this document: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={isUploading ? undefined : onDismiss}
      dialogContentProps={{
        type: DialogType.normal,
        title: "Upload Document",
        subText: "Attach a SOP or job description document to this process.",
      }}
      modalProps={{
        isBlocking: isUploading,
        styles: { main: { minWidth: "480px", maxWidth: "560px", width: "90vw" } },
      }}
      minWidth={480}
      maxWidth={560}
    >
      <Stack tokens={{ childrenGap: 14 }} styles={{ root: { width: "100%", minWidth: 0 } }}>
        <Stack className={styles.contextBox} tokens={{ childrenGap: 4 }}>
          <Stack horizontal tokens={{ childrenGap: 6 }} styles={{ root: { minWidth: 0 } }}>
            <Text variant="small" className={styles.contextLabel}>Process:</Text>
            <Text variant="small" className={styles.contextValue}>{process.processTitle}</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 6 }} styles={{ root: { minWidth: 0 } }}>
            <Text variant="small" className={styles.contextLabel}>Role:</Text>
            <Text variant="small" className={styles.contextValue}>{process.roleChoice || "—"}</Text>
          </Stack>
        </Stack>

        <Dropdown
          label="Document Type"
          options={documentTypeOptions}
          selectedKey={documentType}
          onChange={(_, option) => option && setDocumentType(String(option.key))}
          disabled={isUploading}
        />

        <Dropdown
          label="Status"
          options={statusOptions}
          selectedKey={status}
          onChange={(_, option) => option && setStatus(String(option.key))}
          disabled={isUploading}
        />

        <Stack tokens={{ childrenGap: 4 }}>
          <Text variant="small" className={styles.fileLabel}>Owner</Text>
          {selectedOwner ? (
            <Stack horizontal verticalAlign="center" horizontalAlign="space-between" className={styles.contextBox}>
              <Persona
                text={selectedOwner.displayName}
                secondaryText={selectedOwner.email}
                size={PersonaSize.size32}
              />
              <IconButton
                iconProps={{ iconName: "Cancel" }}
                title="Clear owner"
                ariaLabel="Clear owner"
                onClick={() => setSelectedOwner(null)}
                disabled={isUploading}
              />
            </Stack>
          ) : (
            <>
              <TextField
                placeholder="Search by name or email..."
                value={ownerQuery}
                onChange={(_, value) => setOwnerQuery(value || "")}
                disabled={isUploading}
              />
              {isSearchingOwner && (
                <Spinner size={SpinnerSize.xSmall} label="Searching..." labelPosition="right" />
              )}
              {!isSearchingOwner && ownerSuggestions.length > 0 && (
                <Stack className={styles.contextBox} tokens={{ childrenGap: 2 }}>
                  {ownerSuggestions.map((p) => (
                    <DefaultButton
                      key={p.id}
                      text={`${p.displayName}${p.email ? ` (${p.email})` : ""}`}
                      title={`${p.displayName}${p.email ? ` (${p.email})` : ""}`}
                      onClick={() => {
                        setSelectedOwner(p);
                        setOwnerQuery("");
                        setOwnerSuggestions([]);
                      }}
                      styles={{
                        root: { justifyContent: "flex-start", border: "none", width: "100%", minWidth: 0 },
                        flexContainer: { minWidth: 0 },
                        textContainer: { minWidth: 0, overflow: "hidden" },
                        label: {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                          display: "block",
                        },
                      }}
                    />
                  ))}
                </Stack>
              )}
              {!isSearchingOwner &&
                ownerQuery.trim().length > 0 &&
                ownerSuggestions.length === 0 &&
                ownerQuery.indexOf("@") !== -1 && (
                  <DefaultButton
                    text={isResolvingOwner ? "Adding..." : `Add "${ownerQuery.trim()}" as owner`}
                    iconProps={{ iconName: "AddFriend" }}
                    onClick={() => void handleAddOwnerByEmail()}
                    disabled={isResolvingOwner || isUploading}
                  />
                )}
            </>
          )}
        </Stack>

        <Stack tokens={{ childrenGap: 6 }} styles={{ root: { minWidth: 0 } }}>
          <Text variant="small" className={styles.fileLabel}>File</Text>
          <DefaultButton
            iconProps={{ iconName: "Upload" }}
            text={file ? file.name : "Choose File..."}
            title={file ? file.name : undefined}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            styles={{
              root: { justifyContent: "flex-start", width: "100%", maxWidth: "100%", minWidth: 0 },
              flexContainer: { minWidth: 0 },
              textContainer: { minWidth: 0, overflow: "hidden" },
              label: {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                display: "block",
              },
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            className={styles.hiddenInput}
            onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          />
        </Stack>

        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        {isUploading && (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <Spinner size={SpinnerSize.small} />
            <Text variant="small">Uploading and linking document...</Text>
          </Stack>
        )}
      </Stack>

      <DialogFooter>
        <PrimaryButton
          text="Upload"
          iconProps={{ iconName: "CloudUpload" }}
          onClick={() => void handleUpload()}
          disabled={isUploading || !file}
        />
        <DefaultButton text="Cancel" onClick={onDismiss} disabled={isUploading} />
      </DialogFooter>
    </Dialog>
  );
};
