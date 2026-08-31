import * as React from "react";
import { Stack, Text, Link, Icon, Separator } from "@fluentui/react";
import { IRole } from "../../models/IRole";
import { ISopDocument } from "../../models/ISopDocument";
import styles from "./CurrentRoleCard.module.scss";

export interface ICurrentRoleCardProps {
  role: IRole | undefined;
  /** Fallback title when the role isn't found in the loaded Roles list (e.g. a raw Graph job title with no match) */
  roleTitle: string;
  /** True when this role was auto-detected from the signed-in user's profile rather than manually selected */
  isAutoDetected: boolean;
  /** Job Description document(s) for this role, surfaced here for direct access alongside role identity/description */
  jobDescriptions: ISopDocument[];
  /** Opens the in-page document preview panel instead of a new browser tab */
  onSelectDocument: (doc: ISopDocument) => void;
}

/** Builds a short avatar label from a department or role title, e.g. "Information Technology" -> "IT" */
function getInitials(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return "";
}

/**
 * Orients the user to which role's content they're viewing before they scan the
 * summary counts and document lists below — restores the old app's "Current Role"
 * card (name + description), which the redesign had dropped even though the
 * Roles list's Description column was still being fetched and unused. Also
 * surfaces direct access to the role's Job Description document(s) here
 * instead of a separate box lower in the sidebar, since it's the same "about
 * your role" context and is more discoverable next to the role identity.
 */
export const CurrentRoleCard: React.FC<ICurrentRoleCardProps> = ({
  role,
  roleTitle,
  isAutoDetected,
  jobDescriptions,
  onSelectDocument,
}) => {
  const title = role?.title || roleTitle;
  const initials = getInitials(role?.department || title);

  return (
    <div className={styles.card}>
      <Text variant="tiny" className={styles.label}>
        CURRENT ROLE
      </Text>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} className={styles.titleRow}>
        <div className={styles.avatar}>
          {initials}
          {isAutoDetected && <span className={styles.autoDot} title="Auto-detected from your profile" />}
        </div>
        <Text variant="large" className={styles.title}>
          {title}
        </Text>
      </Stack>
      {role?.description && (
        <Text variant="medium" className={styles.description}>
          {role.description}
        </Text>
      )}

      {jobDescriptions.length > 0 && (
        <>
          <Separator className={styles.jdSeparator} />
          <Stack tokens={{ childrenGap: 6 }}>
            <Text variant="mediumPlus" className={styles.jdHeader}>
              Your Job Description
            </Text>
            {jobDescriptions.map((doc) => (
              <Link
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                className={styles.jdLink}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectDocument(doc);
                }}
              >
                <Icon iconName="ContactCard" /> {doc.title}
              </Link>
            ))}
          </Stack>
        </>
      )}
    </div>
  );
};

