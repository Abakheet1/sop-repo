import * as React from "react";
import {
  Panel,
  PanelType,
  Stack,
  Text,
  Icon,
  Link,
  Separator,
  Spinner,
  SpinnerSize,
  IconButton,
} from "@fluentui/react";
import styles from "./DocumentPreviewPanel.module.scss";
import { ISopDocument } from "../../models/ISopDocument";

export interface IDocumentPreviewPanelProps {
  document: ISopDocument | null;
  onDismiss: () => void;
}

function getViewerUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  // SharePoint Online native viewer — appending ?web=1 renders Office files
  // via Office Online (Word, Excel, PowerPoint) and PDFs natively in the browser.
  const sep = fileUrl.includes("?") ? "&" : "?";
  return `${fileUrl}${sep}web=1`;
}

function getFileExtension(url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  } catch {
    return "";
  }
}

function getDocIcon(ext: string): string {
  switch (ext) {
    case "docx":
    case "doc":  return "WordDocument";
    case "xlsx":
    case "xls":  return "ExcelDocument";
    case "pptx":
    case "ppt":  return "PowerPointDocument";
    case "pdf":  return "PDF";
    default:     return "TextDocument";
  }
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export const DocumentPreviewPanel: React.FC<IDocumentPreviewPanelProps> = ({ document: doc, onDismiss }) => {
  const [iframeLoading, setIframeLoading] = React.useState(true);
  const [iframeError, setIframeError] = React.useState(false);

  // Reset loading state whenever a new document is previewed
  React.useEffect(() => {
    if (doc) {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [doc?.id]);

  if (!doc) return null;

  const ext = getFileExtension(doc.fileUrl);
  const viewerUrl = getViewerUrl(doc.fileUrl);
  const isOverdue = doc.reviewDate ? new Date(doc.reviewDate) < new Date() : false;

  const typeCls =
    doc.documentType === "SOP"
      ? styles.badgeSop
      : doc.documentType === "Job Description"
      ? styles.badgeJd
      : styles.badgeOther;

  const statusCls =
    doc.status === "Approved"
      ? styles.statusApproved
      : doc.status === "Draft"
      ? styles.statusDraft
      : styles.statusReview;

  return (
    <Panel
      isOpen={!!doc}
      onDismiss={onDismiss}
      type={PanelType.custom}
      customWidth="100vw"
      isLightDismiss={false}
      hasCloseButton={false}
      styles={{
        root: { position: "fixed", inset: 0, zIndex: 9999 },
        overlay: { position: "fixed", inset: 0 },
        main: { padding: 0, width: "100vw !important", height: "100vh", top: 0, bottom: 0, position: "fixed", left: 0, right: 0 },
        scrollableContent: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" },
        content: { flex: 1, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 },
        commands: { display: "none" },
      }}
      onRenderHeader={() => (
        <div className={styles.panelHeader}>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} style={{ flex: 1, minWidth: 0 }}>
            <Icon iconName={getDocIcon(ext)} className={styles.docTypeIcon} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text variant="large" className={styles.docTitle}>{doc.title || "(Untitled)"}</Text>
              <Text variant="small" className={styles.docProcess}>{doc.processTitle}</Text>
            </div>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Link href={doc.fileUrl} target="_blank" className={styles.openFullLink}>
              <Icon iconName="OpenInNewWindow" />
              &nbsp;Open full screen
            </Link>
            <IconButton
              iconProps={{ iconName: "ChromeClose" }}
              onClick={onDismiss}
              title="Close"
              ariaLabel="Close preview"
              styles={{ root: { color: "#fff" }, rootHovered: { color: "#fff", background: "rgba(255,255,255,0.15)" } }}
            />
          </Stack>
        </div>
      )}
    >
      <div className={styles.panelBody}>
        {/* Metadata strip */}
        <div className={styles.metaStrip}>
          <div className={styles.metaItem}>
            <Text variant="tiny" className={styles.metaLabel}>TYPE</Text>
            <span className={`${styles.typeBadge} ${typeCls}`}>{doc.documentType || "—"}</span>
          </div>
          <Separator vertical styles={{ root: { height: 32 } }} />
          <div className={styles.metaItem}>
            <Text variant="tiny" className={styles.metaLabel}>STATUS</Text>
            {doc.status
              ? <span className={`${styles.statusBadge} ${statusCls}`}>{doc.status}</span>
              : <Text variant="small" className={styles.metaValue}>—</Text>}
          </div>
          <Separator vertical styles={{ root: { height: 32 } }} />
          <div className={styles.metaItem}>
            <Text variant="tiny" className={styles.metaLabel}>REVIEW DATE</Text>
            <Text variant="small" className={`${styles.metaValue} ${isOverdue ? styles.overdueText : ""}`}>
              {isOverdue && <Icon iconName="Warning" style={{ fontSize: 11, marginRight: 4 }} />}
              {formatDate(doc.reviewDate)}
            </Text>
          </div>
          <Separator vertical styles={{ root: { height: 32 } }} />
          <div className={styles.metaItem}>
            <Text variant="tiny" className={styles.metaLabel}>PROCESS</Text>
            <Text variant="small" className={styles.metaValue}>{doc.processTitle || "—"}</Text>
          </div>
        </div>

        {/* Document viewer */}
        <div className={styles.viewerContainer}>
          {iframeLoading && !iframeError && (
            <div className={styles.viewerLoading}>
              <Spinner size={SpinnerSize.large} label="Loading document..." />
            </div>
          )}
          {iframeError ? (
            <div className={styles.viewerError}>
              <Icon iconName="DocumentWarning" className={styles.viewerErrorIcon} />
              <Text variant="mediumPlus" className={styles.viewerErrorTitle}>Preview unavailable</Text>
              <Text variant="small" className={styles.viewerErrorBody}>
                This file type cannot be previewed here.
              </Text>
              <Link href={doc.fileUrl} target="_blank" className={styles.downloadLink}>
                <Icon iconName="Download" />&nbsp;Download to view
              </Link>
            </div>
          ) : (
            <iframe
              key={doc.id}
              src={viewerUrl}
              className={styles.viewerFrame}
              title={doc.title}
              onLoad={() => setIframeLoading(false)}
              onError={() => { setIframeLoading(false); setIframeError(true); }}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            />
          )}
        </div>
      </div>
    </Panel>
  );
};
