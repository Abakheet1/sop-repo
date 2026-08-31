import * as React from "react";
import { Stack, Text, Link, Icon, TooltipHost } from "@fluentui/react";
import { IProcessViewModel } from "../../models/IProcessViewModel";
import { ISopDocument } from "../../models/ISopDocument";
import styles from "./SopCard.module.scss";

export interface ISopCardProps {
  process: IProcessViewModel;
  /** Opens the in-page document preview panel instead of a new browser tab */
  onSelectDocument?: (doc: ISopDocument) => void;
}

export const SopCard: React.FC<ISopCardProps> = ({ process, onSelectDocument }) => {
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
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Icon iconName="DocumentSet" className={styles.docIcon} />
          <Text variant="mediumPlus" className={styles.title}>
            {process.processTitle}
          </Text>
        </Stack>

        {/* Direct document link from Process list */}
        {process.documentLink && sopDocs.length === 0 && (
          <Link href={process.documentLink} target="_blank" className={styles.docLink}>
            <Icon iconName="OpenFile" /> View Document
          </Link>
        )}

        {/* Matched SOP documents */}
        {sopDocs.map((doc) => (
          <Stack key={doc.id} horizontal verticalAlign="center" tokens={{ childrenGap: 6 }} className={styles.docRow}>
            <Icon iconName="PageList" className={styles.sopIcon} />
            <Link href={doc.fileUrl} target="_blank" onClick={handleDocClick(doc)} className={styles.docLink}>
              {doc.title}
            </Link>
            {doc.reviewDate && (
              <TooltipHost content={`Last Updated Date: ${new Date(doc.reviewDate).toLocaleDateString()}`}>
                <Icon iconName="Calendar" className={styles.calIcon} />
              </TooltipHost>
            )}
            {doc.status && (
              <span className={`${styles.statusPill} ${doc.status === "Approved" ? styles.approved : styles.draft}`}>
                {doc.status}
              </span>
            )}
          </Stack>
        ))}

        {/* Matched Job Description documents */}
        {jdDocs.map((doc) => (
          <Stack key={doc.id} horizontal verticalAlign="center" tokens={{ childrenGap: 6 }} className={styles.docRow}>
            <Icon iconName="ContactCard" className={styles.jdIcon} />
            <Link href={doc.fileUrl} target="_blank" onClick={handleDocClick(doc)} className={styles.docLink}>
              {doc.title}
            </Link>
            {doc.reviewDate && (
              <TooltipHost content={`Last Updated Date: ${new Date(doc.reviewDate).toLocaleDateString()}`}>
                <Icon iconName="Calendar" className={styles.calIcon} />
              </TooltipHost>
            )}
          </Stack>
        ))}
      </Stack>
    </div>
  );
};
