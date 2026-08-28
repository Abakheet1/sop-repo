import * as React from "react";
import { Dropdown, IDropdownOption, Stack, Label } from "@fluentui/react";
import { IRole } from "../../models/IRole";
import styles from "./RoleSelector.module.scss";

export interface IRoleSelectorProps {
  roles: IRole[];
  selectedRole: string | null;
  onRoleChange: (role: string) => void;
  detectedRole: string | null;
}

export const RoleSelector: React.FC<IRoleSelectorProps> = ({
  roles,
  selectedRole,
  onRoleChange,
  detectedRole,
}) => {
  const options: IDropdownOption[] = roles.map((r) => ({
    key: r.title,
    text: r.title,
  }));

  return (
    <Stack className={styles.roleSelector} horizontal verticalAlign="end" tokens={{ childrenGap: 12 }}>
      <Stack.Item grow>
        <Dropdown
          label="Role"
          placeholder="Select a role"
          options={options}
          selectedKey={selectedRole || undefined}
          onChange={(_, option) => option && onRoleChange(String(option.key))}
          styles={{ root: { minWidth: 240 } }}
        />
      </Stack.Item>
      {detectedRole && (
        <Stack.Item>
          <Label className={styles.detectedLabel}>
            Auto-detected: <strong>{detectedRole}</strong>
          </Label>
        </Stack.Item>
      )}
    </Stack>
  );
};
