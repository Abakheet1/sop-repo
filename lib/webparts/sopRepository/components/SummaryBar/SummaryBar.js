import * as React from "react";
import { Stack, Text } from "@fluentui/react";
import styles from "./SummaryBar.module.scss";
export var SummaryBar = function (_a) {
    var sopCount = _a.sopCount, jdCount = _a.jdCount, gapCount = _a.gapCount;
    return (React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 24 }, className: styles.summaryBar },
        React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 6 }, verticalAlign: "center" },
            React.createElement("span", { className: "".concat(styles.badge, " ").concat(styles.sopBadge) }, sopCount),
            React.createElement(Text, { variant: "mediumPlus" }, "SOPs")),
        React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 6 }, verticalAlign: "center" },
            React.createElement("span", { className: "".concat(styles.badge, " ").concat(styles.jdBadge) }, jdCount),
            React.createElement(Text, { variant: "mediumPlus" }, "Job Descriptions")),
        gapCount > 0 && (React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 6 }, verticalAlign: "center" },
            React.createElement("span", { className: "".concat(styles.badge, " ").concat(styles.gapBadge) },
                "\u26A0 ",
                gapCount),
            React.createElement(Text, { variant: "mediumPlus" }, "Gaps")))));
};
//# sourceMappingURL=SummaryBar.js.map