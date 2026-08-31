import * as React from "react";
import { Dropdown, IDropdownOption, Stack, Label } from "@fluentui/react";
import { IRole } from "../../models/IRole";
import styles from "./RoleSelector.module.scss";

const ALL_DEPARTMENTS_KEY = "__all__";

export interface IRoleSelectorProps {
  roles: IRole[];
  selectedRole: string | null;
  onRoleChange: (role: string) => void;
  detectedRole: string | null;
  selectedDepartment: string | null;
  onDepartmentChange: (department: string | null) => void;
}

export const RoleSelector: React.FC<IRoleSelectorProps> = ({
  roles,
  selectedRole,
  onRoleChange,
  detectedRole,
  selectedDepartment,
  onDepartmentChange,
}) => {
  const departments = Array.from(
    new Set(roles.map((r) => r.department).filter((d) => !!d))
  ).sort((a, b) => a.localeCompare(b));

  const departmentOptions: IDropdownOption[] = [
    { key: ALL_DEPARTMENTS_KEY, text: "All Departments" },
    ...departments.map((d) => ({ key: d, text: d })),
  ];

  const rolesInDepartment = selectedDepartment
    ? roles.filter((r) => r.department === selectedDepartment)
    : roles;

  const roleOptions: IDropdownOption[] = rolesInDepartment.map((r) => ({
    key: r.title,
    text: r.title,
  }));

  return (
    <Stack className={styles.roleSelector} tokens={{ childrenGap: 12 }}>
      <Dropdown
        label="Department"
        placeholder="Select a department"
        options={departmentOptions}
        selectedKey={selectedDepartment || ALL_DEPARTMENTS_KEY}
        onChange={(_, option) => {
          if (!option) return;
          onDepartmentChange(option.key === ALL_DEPARTMENTS_KEY ? null : String(option.key));
        }}
        styles={{ root: { width: "100%" } }}
      />
      <Dropdown
        label="Role"
        placeholder="Select a role"
        options={roleOptions}
        selectedKey={selectedRole || undefined}
        onChange={(_, option) => option && onRoleChange(String(option.key))}
        styles={{ root: { width: "100%" } }}
      />
      {detectedRole && (
        <Label className={styles.detectedLabel}>
          Auto-detected role: <strong>{detectedRole}</strong>
        </Label>
      )}
    </Stack>
  );
};
