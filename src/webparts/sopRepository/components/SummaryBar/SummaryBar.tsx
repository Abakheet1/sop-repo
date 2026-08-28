import * as React from "react";
import { Stack, Text } from "@fluentui/react";
import styles from "./SummaryBar.module.scss";

export interface ISummaryBarProps {
  sopCount: number;
  jdCount: number;
  gapCount: number;
}

export const SummaryBar: React.FC<ISummaryBarProps> = ({ sopCount, jdCount, gapCount }) => {
  return (
    <Stack horizontal tokens={{ childrenGap: 24 }} className={styles.summaryBar}>
      <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
        <span className={`${styles.badge} ${styles.sopBadge}`}>{sopCount}</span>
        <Text variant="mediumPlus">SOPs</Text>
      </Stack>
      <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
        <span className={`${styles.badge} ${styles.jdBadge}`}>{jdCount}</span>
        <Text variant="mediumPlus">Job Descriptions</Text>
      </Stack>
      {gapCount > 0 && (
        <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
          <span className={`${styles.badge} ${styles.gapBadge}`}>⚠ {gapCount}</span>
          <Text variant="mediumPlus">Gaps</Text>
        </Stack>
      )}
    </Stack>
  );
};
