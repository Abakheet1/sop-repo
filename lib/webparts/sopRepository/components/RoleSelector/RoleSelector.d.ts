import * as React from "react";
import { IRole } from "../../models/IRole";
export interface IRoleSelectorProps {
    roles: IRole[];
    selectedRole: string | null;
    onRoleChange: (role: string) => void;
    detectedRole: string | null;
}
export declare const RoleSelector: React.FC<IRoleSelectorProps>;
//# sourceMappingURL=RoleSelector.d.ts.map