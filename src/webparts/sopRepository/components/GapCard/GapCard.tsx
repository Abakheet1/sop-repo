import * as React from "react";
import { Stack, Text, Icon } from "@fluentui/react";
import { IProcessViewModel } from "../../models/IProcessViewModel";
import styles from "./GapCard.module.scss";

export interface IGapCardProps {
  process: IProcessViewModel;
}

export const GapCard: React.FC<IGapCardProps> = ({ process }) => {
  return (
    <div className={styles.card}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
        <Icon iconName="Warning" className={styles.warnIcon} />
        <Stack tokens={{ childrenGap: 2 }}>
          <Text variant="mediumPlus" className={styles.title}>
            {process.processTitle}
          </Text>
          <Text variant="small" className={styles.subtitle}>
            No SOP or document linked for this process
          </Text>
        </Stack>
      </Stack>
    </div>
  );
};
