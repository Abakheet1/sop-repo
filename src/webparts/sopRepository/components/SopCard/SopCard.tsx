import * as React from "react";
import { Stack, Text, Link, Icon, TooltipHost, ActionButton } from "@fluentui/react";
import { IProcessViewModel } from "../../models/IProcessViewModel";
import { ISopDocument } from "../../models/ISopDocument";
import styles from "./SopCard.module.scss";

export interface ISopCardProps {
  process: IProcessViewModel;
  /** Opens the in-page document preview panel instead of a new browser tab */
  onSelectDocument?: (doc: ISopDocument) => void;
  /** Shows the Add Document button when true (current user is a verified admin) */
  isAdmin?: boolean;
  /** Opens the upload dialog for this process */
  onUpload?: (process: IProcessViewModel) => void;
}

/** The date actually shown to the user: the manually-curated Review Date when
 * set, otherwise SharePoint's built-in Modified date (always populated) so a
 * "Last Updated" date is visible even when Review Date was never filled in. */
function getDisplayDate(doc: ISopDocument): string {
  return doc.reviewDate || doc.modified || "";
}

export const SopCard: React.FC<ISopCardProps> = ({ process, onSelectDocument, isAdmin, onUpload }) => {
  const sopDocs = process.matchedDocuments.filter((d) => d.documentType === "SOP");
  const jdDocs = process.matchedDocuments.filter((d) => d.documentType === "Job Description");

  const handleDocClick = (doc: ISopDocument) => (e: React.MouseEvent<HTMLAnchorElement>): void => {
    if (!onSelectDocument) return;
    e.preventDefault();
    onSelectDocument(doc);
  };

  return (
    <div className={styles.card}>
      <Stack tokens={{ childrenGap: 6 }}>
        <Stack horizontal verticalAlign="center" horizontalAlign="space-between" tokens={{ childrenGap: 8 }}>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <Icon iconName="DocumentSet" className={styles.docIcon} />
            <Text variant="mediumPlus" className={styles.title}>
              {process.processTitle}
            </Text>
          </Stack>
          {isAdmin && onUpload && (
            <ActionButton
              iconProps={{ iconName: "Upload" }}
              onClick={() => onUpload(process)}
              className={styles.uploadBtn}
            >
              Add Document
            </ActionButton>
          )}
        </Stack>

        {/* Direct document link from Process list */}
        {process.documentLink && sopDocs.length === 0 && (
          <Link href={process.documentLink} target="_blank" className={styles.docLink}>
            <Icon iconName="OpenFile" /> View Document
          </Link>
        )}

        {/* Matched SOP documents */}
        {sopDocs.map((doc) => {
          const displayDate = getDisplayDate(doc);
          return (
            <Stack key={doc.id} tokens={{ childrenGap: 2 }} className={styles.docRow}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
                <Icon iconName="PageList" className={styles.sopIcon} />
                <Link href={doc.fileUrl} target="_blank" onClick={handleDocClick(doc)} className={styles.docLink}>
                  {doc.title}
                </Link>
                <span className={`${styles.typeBadge} ${styles.typeSop}`}>SOP</span>
                {doc.status && (
                  <span className={`${styles.statusPill} ${doc.status === "Approved" ? styles.approved : styles.draft}`}>
                    {doc.status}
                  </span>
                )}
              </Stack>
              {displayDate && (
                <TooltipHost content={doc.reviewDate ? "Manually set on the document" : "From SharePoint's file activity"}>
                  <Text variant="small" className={styles.dateText}>
                    <Icon iconName="Calendar" className={styles.calIcon} /> Last Updated Date: {new Date(displayDate).toLocaleDateString()}
                  </Text>
                </TooltipHost>
              )}
            </Stack>
          );
        })}

        {/* Matched Job Description documents */}
        {jdDocs.map((doc) => {
          const displayDate = getDisplayDate(doc);
          return (
            <Stack key={doc.id} tokens={{ childrenGap: 2 }} className={styles.docRow}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
                <Icon iconName="ContactCard" className={styles.jdIcon} />
                <Link href={doc.fileUrl} target="_blank" onClick={handleDocClick(doc)} className={styles.docLink}>
                  {doc.title}
                </Link>
                <span className={`${styles.typeBadge} ${styles.typeJd}`}>Job Description</span>
              </Stack>
              {displayDate && (
                <TooltipHost content={doc.reviewDate ? "Manually set on the document" : "From SharePoint's file activity"}>
                  <Text variant="small" className={styles.dateText}>
                    <Icon iconName="Calendar" className={styles.calIcon} /> Last Updated Date: {new Date(displayDate).toLocaleDateString()}
                  </Text>
                </TooltipHost>
              )}
            </Stack>
          );
        })}
      </Stack>
    </div>
  );
};

