import * as React from "react";
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
  Dropdown,
  IDropdownOption,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { IProcessViewModel } from "../../models/IProcessViewModel";
import { SopService } from "../../services/SopService";
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

  // Reset the form each time a new process is targeted, and default the
  // Document Type to whichever type this process is still missing (a
  // documented process with only an SOP most likely needs a Job Description
  // next, and vice versa).
  React.useEffect(() => {
    if (!process) return;
    setFile(null);
    setError(null);
    setIsUploading(false);
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
      modalProps={{ isBlocking: isUploading }}
      minWidth={480}
    >
      <Stack tokens={{ childrenGap: 14 }}>
        <Stack className={styles.contextBox} tokens={{ childrenGap: 4 }}>
          <Stack horizontal tokens={{ childrenGap: 6 }}>
            <Text variant="small" className={styles.contextLabel}>Process:</Text>
            <Text variant="small" className={styles.contextValue}>{process.processTitle}</Text>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 6 }}>
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

        <Stack tokens={{ childrenGap: 6 }}>
          <Text variant="small" className={styles.fileLabel}>File</Text>
          <DefaultButton
            iconProps={{ iconName: "Upload" }}
            text={file ? file.name : "Choose File..."}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            styles={{
              root: { justifyContent: "flex-start" },
              label: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
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
