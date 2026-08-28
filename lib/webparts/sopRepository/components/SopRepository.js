import * as React from "react";
import { useState, useEffect } from "react";
import { Stack, Text, Spinner, SpinnerSize, SearchBox, MessageBar, MessageBarType, Separator, } from "@fluentui/react";
import { RoleSelector } from "./RoleSelector/RoleSelector";
import { SummaryBar } from "./SummaryBar/SummaryBar";
import { SopCard } from "./SopCard/SopCard";
import { GapCard } from "./GapCard/GapCard";
import { useCurrentUserRole } from "../hooks/useCurrentUserRole";
import { useSopData } from "../hooks/useSopData";
import styles from "./SopRepository.module.scss";
export var SopRepository = function (props) {
    var context = props.context, service = props.service, showGaps = props.showGaps, defaultRole = props.defaultRole;
    // Detect current user's role from Graph
    var _a = useCurrentUserRole(context), jobTitle = _a.jobTitle, roleLoading = _a.isLoading;
    // Selected role state — start with defaultRole override, then auto-detect, then null
    var _b = useState(defaultRole || null), selectedRole = _b[0], setSelectedRole = _b[1];
    var _c = useState(false), roleAutoDetected = _c[0], setRoleAutoDetected = _c[1];
    // Keyword search state
    var _d = useState(""), searchQuery = _d[0], setSearchQuery = _d[1];
    // When Graph returns a job title and no manual override is set, auto-select it
    useEffect(function () {
        if (!defaultRole && jobTitle && !roleAutoDetected) {
            setSelectedRole(jobTitle);
            setRoleAutoDetected(true);
        }
    }, [jobTitle, defaultRole, roleAutoDetected]);
    // When defaultRole prop changes (property pane), override selection
    useEffect(function () {
        if (defaultRole) {
            setSelectedRole(defaultRole);
        }
    }, [defaultRole]);
    // Load SOP data for selected role
    var _e = useSopData(service, selectedRole), roles = _e.roles, documentedProcesses = _e.documentedProcesses, gapProcesses = _e.gapProcesses, sopDocuments = _e.sopDocuments, jobDescriptions = _e.jobDescriptions, dataLoading = _e.isLoading, error = _e.error;
    var isLoading = roleLoading || dataLoading;
    // Filter processes by search query (searches process title, case-insensitive)
    var filterProcesses = function (list) {
        if (!searchQuery.trim())
            return list;
        var q = searchQuery.trim().toLowerCase();
        return list.filter(function (p) { return p.processTitle.toLowerCase().includes(q); });
    };
    var filteredDocumented = filterProcesses(documentedProcesses);
    var filteredGaps = filterProcesses(gapProcesses);
    return (React.createElement("div", { className: styles.container },
        React.createElement(Text, { variant: "xLarge", className: styles.header }, "IT SOP & Policy Repository"),
        React.createElement(RoleSelector, { roles: roles, selectedRole: selectedRole, onRoleChange: function (role) {
                setSelectedRole(role);
                setSearchQuery("");
            }, detectedRole: jobTitle && !defaultRole ? jobTitle : null }),
        isLoading && (React.createElement(Stack, { horizontalAlign: "center", tokens: { padding: "24px 0" } },
            React.createElement(Spinner, { size: SpinnerSize.large, label: "Loading SOP data..." }))),
        !isLoading && error && (React.createElement(MessageBar, { messageBarType: MessageBarType.error, isMultiline: true }, error)),
        !isLoading && !error && !selectedRole && (React.createElement(MessageBar, { messageBarType: MessageBarType.warning }, roleLoading
            ? "Detecting your role..."
            : "Select a role above to view SOPs and processes.")),
        !isLoading && !error && selectedRole && (React.createElement(Stack, { tokens: { childrenGap: 0 } },
            React.createElement(SummaryBar, { sopCount: sopDocuments.length, jdCount: jobDescriptions.length, gapCount: showGaps ? gapProcesses.length : 0 }),
            React.createElement(SearchBox, { placeholder: "Search processes...", value: searchQuery, onChange: function (_, val) { return setSearchQuery(val || ""); }, onClear: function () { return setSearchQuery(""); }, className: styles.search }),
            React.createElement(Text, { variant: "large", className: styles.sectionHeader }, "DOCUMENTED"),
            filteredDocumented.length === 0 ? (React.createElement(Text, { variant: "medium", className: styles.emptyState }, searchQuery ? "No documented processes match your search." : "No documented processes found for this role.")) : (filteredDocumented.map(function (p) { return React.createElement(SopCard, { key: p.id, process: p }); })),
            showGaps && (React.createElement(React.Fragment, null,
                React.createElement(Separator, { className: styles.separator }),
                React.createElement(Text, { variant: "large", className: "".concat(styles.sectionHeader, " ").concat(styles.gapHeader) }, "\u26A0 GAPS \u2014 No SOP Yet"),
                filteredGaps.length === 0 ? (React.createElement(Text, { variant: "medium", className: styles.emptyState }, searchQuery
                    ? "No gap processes match your search."
                    : "All processes are documented for this role.")) : (filteredGaps.map(function (p) { return React.createElement(GapCard, { key: p.id, process: p }); }))))))));
};
//# sourceMappingURL=SopRepository.js.map