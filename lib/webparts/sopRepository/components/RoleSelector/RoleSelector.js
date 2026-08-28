import * as React from "react";
import { Dropdown, Stack, Label } from "@fluentui/react";
import styles from "./RoleSelector.module.scss";
export var RoleSelector = function (_a) {
    var roles = _a.roles, selectedRole = _a.selectedRole, onRoleChange = _a.onRoleChange, detectedRole = _a.detectedRole;
    var options = roles.map(function (r) { return ({
        key: r.title,
        text: r.title,
    }); });
    return (React.createElement(Stack, { className: styles.roleSelector, horizontal: true, verticalAlign: "end", tokens: { childrenGap: 12 } },
        React.createElement(Stack.Item, { grow: true },
            React.createElement(Dropdown, { label: "Role", placeholder: "Select a role", options: options, selectedKey: selectedRole || undefined, onChange: function (_, option) { return option && onRoleChange(String(option.key)); }, styles: { root: { minWidth: 240 } } })),
        detectedRole && (React.createElement(Stack.Item, null,
            React.createElement(Label, { className: styles.detectedLabel },
                "Auto-detected: ",
                React.createElement("strong", null, detectedRole))))));
};
//# sourceMappingURL=RoleSelector.js.map