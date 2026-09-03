import * as React from "react";
import { Stack, Text, Icon, ActionButton } from "@fluentui/react";
import { IProcessViewModel } from "../../models/IProcessViewModel";
import styles from "./GapCard.module.scss";

export interface IGapCardProps {
  process: IProcessViewModel;
  /** Shows the Upload Document button when true (current user is a verified admin) */
  isAdmin?: boolean;
  /** Opens the upload dialog for this process */
  onUpload?: (process: IProcessViewModel) => void;
}

export const GapCard: React.FC<IGapCardProps> = ({ process, isAdmin, onUpload }) => {
  return (
    <div className={styles.card}>
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between" tokens={{ childrenGap: 8 }}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Icon iconName="Info" className={styles.warnIcon} />
          <Stack tokens={{ childrenGap: 2 }}>
            <Text variant="mediumPlus" className={styles.title}>
              {process.processTitle}
            </Text>
            <Text variant="small" className={styles.subtitle}>
              No documentation has been submitted for this process yet.
            </Text>
          </Stack>
        </Stack>
        {isAdmin && onUpload && (
          <ActionButton
            iconProps={{ iconName: "Upload" }}
            onClick={() => onUpload(process)}
            className={styles.uploadBtn}
          >
            Upload Document
          </ActionButton>
        )}
      </Stack>
    </div>
  );
};
