# Role & Responsibility Documentation — Application Lifecycle (Internal)

> **Audience:** Village of Mundelein IT staff who own, build, or maintain this
> application. This is **internal** documentation, not client-facing material.

## Solution status — read this first

This repository currently has two states, and this document describes both so
nothing here is misleading:

| | Branch | Status |
|---|---|---|
| **Current baseline** | `main` | The original "SOP Repository" web part: read-only browsing, no admin upload feature, hardcoded SharePoint field names. |
| **Pending rebrand** | `abakheet1-spfx-audit` (PR #1, "Rebrand to Role & Responsibility Documentation") | Renames the app to **Role & Responsibility Documentation**, adds an admin-gated document upload feature, a "Current Role" card, dynamic SharePoint field-name resolution, and several UX fixes. **Not yet merged to `main`.** |

The rest of this document describes the **rebranded (PR #1) version**, since
that reflects the intended/current design of the app. Anything that only
exists in PR #1 and not yet in `main` is called out explicitly. Once PR #1
merges, this document will describe `main` as-is.

**Internal naming note:** the rebrand only changes user-facing text (page
title, section labels, terminology). The solution folder, component names,
and web part class are all still `sop-repository` / `SopRepository*` to avoid
breaking sites where the web part is already deployed under that name.

## 1. What this application is

The **Role & Responsibility Documentation** web part is a SharePoint
Framework (SPFx) client-side web part built for Village of Mundelein IT. It
is embedded on a SharePoint page and gives employees a searchable,
role-filtered view of their Standard Operating Procedures (SOPs) and Job
Description, and highlights which processes for their role still need
documentation ("Undocumented Processes").

| Item | Value |
|---|---|
| Solution / folder name (unchanged) | `sop-repository` |
| Display name (PR #1) | Role & Responsibility Documentation |
| Display name (`main`, current) | SOP Repository |
| Web part class | `SopRepositoryWebPart` |
| Package output (PR #1) | `sharepoint/solution/role-responsibility-documentation.sppkg` |
| Package output (`main`) | `sharepoint/solution/sop-repository.sppkg` |
| Owner | Village of Mundelein IT |
| Tenant | `communityessentials.sharepoint.com` |
| Repository | https://github.com/JonEricEubanks/sop-repo |

## 2. How it was built

### Tooling and scaffolding
- Generated with the Microsoft SharePoint Framework Yeoman generator
  (`@microsoft/generator-sharepoint` v1.20.0 — see `.yo-rc.json`), targeting
  SharePoint Online, single web part component.
- Language/framework: **React 17 + TypeScript**, compiled with the SPFx
  build pipeline (`@microsoft/sp-build-web`) and orchestrated with **Gulp 4**.
- UI library: **Fluent UI** (`@fluentui/react` v8) for controls, cards, dialogs.
- Data access: **PnP.js** (`@pnp/sp`, `@pnp/graph`) using the SPFx auth
  context, so the app runs with the signed-in user's own SharePoint
  permissions — no separate app registration or stored credentials.

### Code architecture (`src/webparts/sopRepository/`)

| Path | Purpose |
|---|---|
| `SopRepositoryWebPart.ts` | Web part entry point + property pane (site URL, list names, toggles) |
| `components/SopRepository.tsx` | Root React component — state, filtering, layout |
| `components/RoleSelector/` | Role/department dropdown filter |
| `components/CurrentRoleCard/` *(PR #1)* | Shows the selected role's name/description and a direct link to that role's Job Description |
| `components/SopCard/` | Card UI for a documented process/SOP |
| `components/GapCard/` | Card UI for an "Undocumented Process" (internal component name is still `GapCard`) |
| `components/SummaryBar/` | Counts/summary strip (SOPs, Job Descriptions, Undocumented Processes) |
| `components/DocumentPreviewPanel/` | Slide-out panel for previewing/opening a document in-page |
| `components/UploadDocumentDialog/` *(PR #1)* | Admin-only dialog to upload a document directly to a process |
| `hooks/` | `useCurrentUserRole` (Graph job title), `useSopData` (loads/joins Process + Library data), `useIsAdmin` *(PR #1)* |
| `models/` | `IRole`, `IProcess`, `ISopDocument`, `IProcessViewModel` — TypeScript row/view-model shapes |
| `services/SopService.ts` | All SharePoint REST/PnP.js data-access logic |
| `config/` | SPFx configuration files |
| `sharepoint/solution/` | Packaged SPFx deployment artifacts (`.sppkg`) |
| `dist/` and `lib/` | Generated build output |

### Data model (SharePoint-side)

The web part reads from SharePoint objects on a configurable "documentation
site" (property pane field `sopSiteUrl`, default site `SOPProcessManagement`):

1. **Roles list** (default name `Roles`) — one row per job role/department.
   The `Active` column controls whether a role appears in the role filter.
   Columns used: `Title`, `Description`, `Department`, `Active`.
2. **Process list** (default name `Process`) — maps a `Role (Choice)` value
   to a process `Title` and an optional `Document Link` + `Document Type`.
   If `Document Link` is empty **and** no library document matches this
   process by title, `useSopData.ts` treats it as an **Undocumented
   Process**.
3. **Documentation library** (default name, PR #1: `SOP & Process Library`;
   `main`: `SOP Process Library`) — the actual SOP/Job Description files,
   tagged with `Role (Choice)`, `Process` (a Lookup column back to the
   Process list), `Document Type`, `Status` (Approved/Draft), `Review Date`,
   and *(PR #1 only)* an `Owner` Person column and a `Role (Lookup)` column.
4. **Admin Access list** *(PR #1 only, default name `Admin Access`)* — gates
   the document-upload feature. Columns: a Person/Group column
   (`UserPrincipalName`) identifying the user, and a Choice column
   (`AccessLevel`) — a user must have `AccessLevel = Admin` to see the
   Upload button on process cards. `SopService.isAdmin()` checks this list
   by the signed-in user's email/UPN (matching against both the plain email
   and the claims-encoded login name) and **fails closed**: any lookup
   error, missing configuration, or no match means the user does **not**
   get upload access. This list does not exist in `main` today.

### Field-name resolution — an important accuracy note

- **`main` (current production):** SharePoint internal field names are
  hardcoded as constants in `SopService.ts` (`FIELDS` object), because
  SharePoint encodes spaces/parentheses in internal names (e.g. `Role
  (Choice)` → `Role_x0020__x0028_Choice_x0029_`). If a column is renamed or
  recreated in SharePoint, these constants must be updated by hand.
- **PR #1 (pending):** this was fixed. `SopService._resolveFieldName()` now
  looks up each column's real internal name from the list's schema **at
  runtime**, by its display name (e.g. looks up "Role (Choice)" and asks
  SharePoint what its internal name actually is), and only falls back to a
  hardcoded guess if that lookup fails. This removes the most common source
  of "field does not exist" runtime errors and is one of the most valuable
  fixes in the pending rebrand.

### Configuration (property pane)

All SharePoint locations are configurable per page instance via the web part
property pane — nothing is hard-coded to a single site:

| Property | Purpose | Default |
|---|---|---|
| `sopSiteUrl` | Site containing the lists/library | *(none — must be set)* |
| `libraryName` | Documentation library name | `SOP & Process Library` (PR #1) / `SOP Process Library` (`main`) |
| `processListName` | Process list name | `Process` |
| `rolesListName` | Roles list name | `Roles` |
| `adminListName` *(PR #1 only)* | Admin Access list name — gates the upload feature | `Admin Access` |
| `showGaps` | Show/hide the Undocumented Processes section | Show |
| `defaultRole` | Override auto-detected role for all users | *(blank — auto-detect)* |

### Packaging
- `gulp bundle --ship` produces production JS bundles under `dist/`/`lib/`.
- `gulp package-solution --ship` produces the deployable `.sppkg`, described
  by `config/package-solution.json`.
  - `main`: solution id `a1b2c3d4-e5f6-7890-abcd-ef1234567890`, version
    `1.0.0.0`, output `sharepoint/solution/sop-repository.sppkg`.
  - PR #1: solution id `ed3767e9-6819-453c-b8c1-b979758b0084`, version
    `1.1.0.0`, output `sharepoint/solution/role-responsibility-documentation.sppkg`.
- `skipFeatureDeployment: true` in both, so the App Catalog deploys
  tenant-wide automatically without a manual per-site feature activation.
- Built `.sppkg` files are committed to the repo under `sharepoint/solution/`
  so anyone can deploy directly from git without needing a local build.

## 3. Runtime lifecycle (what happens when the page loads)

1. SharePoint loads the web part manifest/bundle referenced by the App
   Catalog deployment.
2. `SopRepositoryWebPart.onInit()` runs, then `_initService()` builds a
   `SopService` pointed at the configured `sopSiteUrl` and list names.
3. `render()` creates the React tree (`SopRepository.tsx`), passing the
   service and property-pane configuration as props.
4. `useCurrentUserRole` fetches the signed-in user's job title from
   Microsoft Graph (`User.Read` permission, granted by default to SPFx web
   parts). *(PR #1)* `useIsAdmin` checks the Admin Access list for the
   signed-in user in parallel.
5. Once the Roles list loads, the component auto-selects the role matching
   the Graph job title (unless `defaultRole` is set or the user picks one
   manually), then loads Processes and Documents for that role via
   `useSopData`.
6. `useSopData` joins Process + Document data: a process with a non-empty
   `Document Link` **or** at least one matching library document (by title)
   is **Documented**; otherwise it's an **Undocumented Process**.
7. *(PR #1)* `CurrentRoleCard` shows the selected role's identity/description
   and a direct link to that role's Job Description. `SummaryBar` totals
   SOP/Job Description/Undocumented counts. `SopCard`/`GapCard` render each
   process; `DocumentPreviewPanel` opens on demand to preview a document
   in-page instead of a new browser tab.
8. *(PR #1)* If the signed-in user is a verified admin, each process card
   shows an **Upload Document** button that opens `UploadDocumentDialog`.
   The admin picks a file, Document Type, Status, and optionally an Owner;
   `SopService.uploadDocument()` uploads the file to the library, stamps its
   metadata (Role, Process lookup, Document Type, Status, Owner), and — only
   if the Process record's `Document Link` was previously blank — stamps
   that link too, so the process is immediately recognized as documented.
9. Property pane changes (site URL, list names, toggles) trigger `render()`
   again, rebuilding the service and refreshing data.

## 4. Environments / deployment targets

- **Local dev**: `gulp serve` — SPFx local workbench (hot reload). Useful
  for isolated UI iteration, but real SharePoint data calls require testing
  against the **hosted workbench** on a real SharePoint site (see the Update
  & Maintenance Guide), since the local workbench cannot authenticate PnP.js
  calls to SharePoint.
- **Production**: the packaged `.sppkg` deployed to the tenant or site
  collection App Catalog at `communityessentials.sharepoint.com`, then added
  to the page(s) that host the app.

## 5. Dependencies to track over time

| Dependency | Why it matters |
|---|---|
| `@microsoft/sp-*` (SPFx core) v1.20.0 | Tied to a specific SharePoint Framework version; upgrading requires aligning the Yeoman generator version and Node engine range. |
| `@pnp/sp`, `@pnp/graph` v4 | Data access layer; breaking changes here affect `SopService.ts` query syntax. |
| `@fluentui/react` v8 | UI components; a v9 migration would be a larger UI rewrite. |
| `react`/`react-dom` 17 | Pinned by SPFx 1.20 compatibility; do not bump independently. |
| Node engine | `main`: `>=18.17.1 <19.0.0 \|\| >=20.9.0 <21.0.0`. PR #1: `>=18.17.1 <19.0.0 \|\| >=20.11.0 <21.0.0` (slightly narrower minimum on the Node 20 line). Build fails outside the applicable range. |

## 6. Known constraints / things maintainers should know

- No automated tests currently exist beyond the `jest --passWithNoTests`
  placeholder script.
- No CI/CD pipeline is defined in-repo; packaging and deployment are manual.
- No license file is present.
- Upload permissions are gated **only** in-app by the Admin Access list
  (PR #1) — the underlying document library's own SharePoint permissions
  still apply independently (an "admin" in the app still needs write access
  to the library at the SharePoint permissions level to actually upload).
- PR #1 has not been merged to `main` as of this writing — treat any detail
  marked "(PR #1 only)" above as **not yet live in production** until that
  PR merges.
