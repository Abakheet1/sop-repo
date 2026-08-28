import * as React from "react";
import { Stack, Text, Link, Icon, TooltipHost } from "@fluentui/react";
import styles from "./SopCard.module.scss";
export var SopCard = function (_a) {
    var process = _a.process;
    var sopDocs = process.matchedDocuments.filter(function (d) { return d.documentType === "SOP"; });
    var jdDocs = process.matchedDocuments.filter(function (d) { return d.documentType === "Job Description"; });
    return (React.createElement("div", { className: styles.card },
        React.createElement(Stack, { tokens: { childrenGap: 6 } },
            React.createElement(Stack, { horizontal: true, verticalAlign: "center", tokens: { childrenGap: 8 } },
                React.createElement(Icon, { iconName: "DocumentSet", className: styles.docIcon }),
                React.createElement(Text, { variant: "mediumPlus", className: styles.title }, process.processTitle)),
            process.documentLink && sopDocs.length === 0 && (React.createElement(Link, { href: process.documentLink, target: "_blank", className: styles.docLink },
                React.createElement(Icon, { iconName: "OpenFile" }),
                " View Document")),
            sopDocs.map(function (doc) { return (React.createElement(Stack, { key: doc.id, horizontal: true, verticalAlign: "center", tokens: { childrenGap: 6 }, className: styles.docRow },
                React.createElement(Icon, { iconName: "PageList", className: styles.sopIcon }),
                React.createElement(Link, { href: doc.fileUrl, target: "_blank", className: styles.docLink }, doc.title),
                doc.status && (React.createElement("span", { className: "".concat(styles.statusPill, " ").concat(doc.status === "Approved" ? styles.approved : styles.draft) }, doc.status)),
                doc.reviewDate && (React.createElement(TooltipHost, { content: "Review Date: ".concat(new Date(doc.reviewDate).toLocaleDateString()) },
                    React.createElement(Icon, { iconName: "Calendar", className: styles.calIcon }))))); }),
            jdDocs.map(function (doc) { return (React.createElement(Stack, { key: doc.id, horizontal: true, verticalAlign: "center", tokens: { childrenGap: 6 }, className: styles.docRow },
                React.createElement(Icon, { iconName: "ContactCard", className: styles.jdIcon }),
                React.createElement(Link, { href: doc.fileUrl, target: "_blank", className: styles.docLink }, doc.title),
                doc.reviewDate && (React.createElement(TooltipHost, { content: "Review Date: ".concat(new Date(doc.reviewDate).toLocaleDateString()) },
                    React.createElement(Icon, { iconName: "Calendar", className: styles.calIcon }))))); }))));
};
//# sourceMappingURL=SopCard.js.map