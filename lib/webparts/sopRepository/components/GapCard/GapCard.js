import * as React from "react";
import { Stack, Text, Icon } from "@fluentui/react";
import styles from "./GapCard.module.scss";
export var GapCard = function (_a) {
    var process = _a.process;
    return (React.createElement("div", { className: styles.card },
        React.createElement(Stack, { horizontal: true, verticalAlign: "center", tokens: { childrenGap: 8 } },
            React.createElement(Icon, { iconName: "Warning", className: styles.warnIcon }),
            React.createElement(Stack, { tokens: { childrenGap: 2 } },
                React.createElement(Text, { variant: "mediumPlus", className: styles.title }, process.processTitle),
                React.createElement(Text, { variant: "small", className: styles.subtitle }, "No SOP or document linked for this process")))));
};
//# sourceMappingURL=GapCard.js.map