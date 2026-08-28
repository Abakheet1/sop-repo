import * as React from "react";
import { Panel, PanelType, Stack, Text, Icon, Link, Separator, Spinner, SpinnerSize, IconButton, } from "@fluentui/react";
import styles from "./DocumentPreviewPanel.module.scss";
function getViewerUrl(fileUrl) {
    if (!fileUrl)
        return "";
    // SharePoint Online native viewer — appending ?web=1 renders Office files
    // via Office Online (Word, Excel, PowerPoint) and PDFs natively in the browser.
    var sep = fileUrl.includes("?") ? "&" : "?";
    return "".concat(fileUrl).concat(sep, "web=1");
}
function getFileExtension(url) {
    try {
        var path = new URL(url).pathname;
        var parts = path.split(".");
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    }
    catch (_a) {
        return "";
    }
}
function getDocIcon(ext) {
    switch (ext) {
        case "docx":
        case "doc": return "WordDocument";
        case "xlsx":
        case "xls": return "ExcelDocument";
        case "pptx":
        case "ppt": return "PowerPointDocument";
        case "pdf": return "PDF";
        default: return "TextDocument";
    }
}
function formatDate(iso) {
    if (!iso)
        return "—";
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
export var DocumentPreviewPanel = function (_a) {
    var doc = _a.document, onDismiss = _a.onDismiss;
    var _b = React.useState(true), iframeLoading = _b[0], setIframeLoading = _b[1];
    var _c = React.useState(false), iframeError = _c[0], setIframeError = _c[1];
    // Reset loading state whenever a new document is previewed
    React.useEffect(function () {
        if (doc) {
            setIframeLoading(true);
            setIframeError(false);
        }
    }, [doc === null || doc === void 0 ? void 0 : doc.id]);
    if (!doc)
        return null;
    var ext = getFileExtension(doc.fileUrl);
    var viewerUrl = getViewerUrl(doc.fileUrl);
    var isOverdue = doc.reviewDate ? new Date(doc.reviewDate) < new Date() : false;
    var typeCls = doc.documentType === "SOP"
        ? styles.badgeSop
        : doc.documentType === "Job Description"
            ? styles.badgeJd
            : styles.badgeOther;
    var statusCls = doc.status === "Approved"
        ? styles.statusApproved
        : doc.status === "Draft"
            ? styles.statusDraft
            : styles.statusReview;
    return (React.createElement(Panel, { isOpen: !!doc, onDismiss: onDismiss, type: PanelType.custom, customWidth: "100vw", isLightDismiss: false, hasCloseButton: false, styles: {
            root: { position: "fixed", inset: 0, zIndex: 9999 },
            overlay: { position: "fixed", inset: 0 },
            main: { padding: 0, width: "100vw !important", height: "100vh", top: 0, bottom: 0, position: "fixed", left: 0, right: 0 },
            scrollableContent: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" },
            content: { flex: 1, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 },
            commands: { display: "none" },
        }, onRenderHeader: function () { return (React.createElement("div", { className: styles.panelHeader },
            React.createElement(Stack, { horizontal: true, verticalAlign: "center", tokens: { childrenGap: 10 }, style: { flex: 1, minWidth: 0 } },
                React.createElement(Icon, { iconName: getDocIcon(ext), className: styles.docTypeIcon }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement(Text, { variant: "large", className: styles.docTitle }, doc.title || "(Untitled)"),
                    React.createElement(Text, { variant: "small", className: styles.docProcess }, doc.processTitle))),
            React.createElement(Stack, { horizontal: true, tokens: { childrenGap: 8 }, verticalAlign: "center" },
                React.createElement(Link, { href: doc.fileUrl, target: "_blank", className: styles.openFullLink },
                    React.createElement(Icon, { iconName: "OpenInNewWindow" }),
                    "\u00A0Open full screen"),
                React.createElement(IconButton, { iconProps: { iconName: "ChromeClose" }, onClick: onDismiss, title: "Close", ariaLabel: "Close preview", styles: { root: { color: "#fff" }, rootHovered: { color: "#fff", background: "rgba(255,255,255,0.15)" } } })))); } },
        React.createElement("div", { className: styles.panelBody },
            React.createElement("div", { className: styles.metaStrip },
                React.createElement("div", { className: styles.metaItem },
                    React.createElement(Text, { variant: "tiny", className: styles.metaLabel }, "TYPE"),
                    React.createElement("span", { className: "".concat(styles.typeBadge, " ").concat(typeCls) }, doc.documentType || "—")),
                React.createElement(Separator, { vertical: true, styles: { root: { height: 32 } } }),
                React.createElement("div", { className: styles.metaItem },
                    React.createElement(Text, { variant: "tiny", className: styles.metaLabel }, "STATUS"),
                    doc.status
                        ? React.createElement("span", { className: "".concat(styles.statusBadge, " ").concat(statusCls) }, doc.status)
                        : React.createElement(Text, { variant: "small", className: styles.metaValue }, "\u2014")),
                React.createElement(Separator, { vertical: true, styles: { root: { height: 32 } } }),
                React.createElement("div", { className: styles.metaItem },
                    React.createElement(Text, { variant: "tiny", className: styles.metaLabel }, "REVIEW DATE"),
                    React.createElement(Text, { variant: "small", className: "".concat(styles.metaValue, " ").concat(isOverdue ? styles.overdueText : "") },
                        isOverdue && React.createElement(Icon, { iconName: "Warning", style: { fontSize: 11, marginRight: 4 } }),
                        formatDate(doc.reviewDate))),
                React.createElement(Separator, { vertical: true, styles: { root: { height: 32 } } }),
                React.createElement("div", { className: styles.metaItem },
                    React.createElement(Text, { variant: "tiny", className: styles.metaLabel }, "PROCESS"),
                    React.createElement(Text, { variant: "small", className: styles.metaValue }, doc.processTitle || "—"))),
            React.createElement("div", { className: styles.viewerContainer },
                iframeLoading && !iframeError && (React.createElement("div", { className: styles.viewerLoading },
                    React.createElement(Spinner, { size: SpinnerSize.large, label: "Loading document..." }))),
                iframeError ? (React.createElement("div", { className: styles.viewerError },
                    React.createElement(Icon, { iconName: "DocumentWarning", className: styles.viewerErrorIcon }),
                    React.createElement(Text, { variant: "mediumPlus", className: styles.viewerErrorTitle }, "Preview unavailable"),
                    React.createElement(Text, { variant: "small", className: styles.viewerErrorBody }, "This file type cannot be previewed here."),
                    React.createElement(Link, { href: doc.fileUrl, target: "_blank", className: styles.downloadLink },
                        React.createElement(Icon, { iconName: "Download" }),
                        "\u00A0Download to view"))) : (React.createElement("iframe", { key: doc.id, src: viewerUrl, className: styles.viewerFrame, title: doc.title, onLoad: function () { return setIframeLoading(false); }, onError: function () { setIframeLoading(false); setIframeError(true); }, allowFullScreen: true, sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" }))))));
};
//# sourceMappingURL=DocumentPreviewPanel.js.map