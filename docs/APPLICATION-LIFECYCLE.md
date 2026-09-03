# SOP Repository — Application Lifecycle Documentation

## 1. What this application is

The **SOP Repository** web part is a SharePoint Framework (SPFx) client-side web
part built for Village of Mundelein IT. It is embedded on a SharePoint page and
gives employees a searchable, role-filtered view of IT Standard Operating
Procedures (SOPs) and Job Descriptions stored in SharePoint, plus "gap"
detection for processes that don't yet have a documented SOP.

| Item | Value |
|---|---|
| Solution name | `sop-repository` |
| Web part | `SopRepositoryWebPart` (`ISopRepositoryWebPartProps`) |
| Package | `sharepoint/solution/sop-repository.sppkg` |
| Owner | Village of Mundelein IT |
| Tenant | `communityessentials.sharepoint.com` |

## 2. How it was built

### Tooling and scaffolding
- Generated with the Microsoft SharePoint Framework Yeoman generator
  (`@microsoft/generator-sharepoint` v1.20.0 — see `.yo-rc.json`), targeting
  SharePoint Online (`environment: "spo"`), single web part component.
- Language/framework: **React 17 + TypeScript**, compiled with the SPFx
  build pipeline (`@microsoft/sp-build-web`) and orchestrated with **Gulp 4**.
- UI library: **Fluent UI (`@fluentui/react` v8)** for controls, cards, panels.
- Data access: **PnP.js** (`@pnp/sp`, `@pnp/graph`) using the SPFx auth context
  (`SPFx(context)`), so no separate app registration/credentials are needed —
  it runs with the signed-in user's SharePoint permissions.

### Code architecture (`src/webparts/sopRepository/`)
```
SopRepositoryWebPart.ts        Web part entry point + property pane (site URL, list names, toggles)
components/
  SopRepository.tsx            Root React component — state, filtering, layout
  RoleSelector/                Role/department dropdown filter
  SopCard/                     Card UI for an individual SOP/document
  GapCard/                     Card UI shown when a process has no SOP yet
  SummaryBar/                  Counts/summary strip (approved, draft, gaps, etc.)
  DocumentPreviewPanel/        Slide-out panel for previewing/opening a document
hooks/                         Custom React hooks used by the components
models/
  IRole.ts                     Roles list row shape
  IProcess.ts                  Process list row shape (role -> process -> doc link)
  ISopDocument.ts               SOP Process Library row shape (the actual documents)
services/
  SopService.ts                All SharePoint REST/PnP.js data-access logic
```

### Data model (SharePoint-side)
The web part reads from three SharePoint objects, all on a configurable "SOP
site" (default `SOPProcessManagement` site):

1. **Roles** list — one row per job role/department, `Active` flag controls
   whether it shows in the role filter.
2. **Process** list — maps a `Role (Choice)` value to a process `Title` and an
   optional `Document Link` + `Document Type`. If `Document Link` is empty,
   `SopRepository.tsx` treats that process as a **gap** (missing SOP).
3. **SOP Process Library** (document library, default name `SOP Process
   Library`) — the actual SOP/Job Description files, tagged with `Role
   (Choice)`, `Process`, `Document Type`, `Status` (Approved/Draft), and
   `Review Date`.

Field internal names are intentionally hard-coded as constants at the top of
`SopService.ts` because SharePoint encodes spaces/parentheses in internal
names (e.g. `Role (Choice)` → `Role_x0020__x0028_Choice_x0029_`). If a column
is renamed or recreated in SharePoint, these constants must be updated (see
the update guide).

### Configuration (property pane)
All SharePoint locations are configurable per page instance, not hard-coded,
via the web part property pane:
- `sopSiteUrl` — site collection/site containing the lists/library
- `libraryName` — SOP Process Library name (default `SOP Process Library`)
- `processListName` — Process list name (default `Process`)
- `rolesListName` — Roles list name (default `Roles`)
- `showGaps` — toggle gap cards on/off
- `defaultRole` — override auto-detected role (falls back to the signed-in
  user's Azure AD job title when blank)

### Packaging
- `gulp bundle --ship` produces production JS bundles under `dist/` / `lib/`.
- `gulp package-solution --ship` produces the deployable package at
  `sharepoint/solution/sop-repository.sppkg`, described by
  `config/package-solution.json` (solution id `a1b2c3d4-e5f6-7890-abcd-ef1234567890`,
  currently version `1.0.0.0`, `skipFeatureDeployment: true`).
- The built `.sppkg` is committed to the repo under `sharepoint/solution/` so
  it can be uploaded directly to a tenant/site App Catalog without requiring a
  local build.

## 3. Runtime lifecycle (what happens when the page loads)

1. SharePoint loads the web part manifest/bundle referenced by the App
   Catalog deployment.
2. `SopRepositoryWebPart.onInit()` runs, then `_initService()` builds a
   `SopService` pointed at the configured `sopSiteUrl`.
3. `render()` creates the React tree (`SopRepository.tsx`), passing the
   service and configuration as props.
4. The component loads Roles, determines the active role (from
   `defaultRole` or the user's Azure AD job title via Graph/SPFx context),
   then loads Processes and Documents for that role.
5. The component merges Process + Document data: any process without a
   matching document becomes a **Gap** card; documents render as **SopCard**
   items; a **SummaryBar** totals counts; a **DocumentPreviewPanel** opens on
   demand to preview/open a selected document.
6. Property pane changes (site URL, list names, toggles) trigger
   `render()` again, rebuilding the service and refreshing data.

## 4. Environments / deployment targets

- **Local dev**: `gulp serve` — SPFx local workbench (hot reload), useful for
  isolated UI iteration but SharePoint data calls still require it to run in
  the context of a real SharePoint page (hosted workbench) for auth to work
  against real lists.
- **Production**: the packaged `.sppkg` deployed to the tenant or site
  collection App Catalog at `communityessentials.sharepoint.com`, then added
  to the page(s) that host the SOP Repository experience.

## 5. Dependencies to track over time

| Dependency | Why it matters |
|---|---|
| `@microsoft/sp-*` (SPFx core) v1.20.0 | Tied to a specific SharePoint Framework version; upgrading requires re-running/aligning the Yeoman generator version and Node engine range. |
| `@pnp/sp`, `@pnp/graph` v4 | Data access layer; breaking changes here affect `SopService.ts` query syntax. |
| `@fluentui/react` v8 | UI components; a v9 migration would be a larger UI rewrite. |
| `react`/`react-dom` 17 | Pinned by SPFx 1.20 compatibility; do not bump independently. |
| Node engine | `>=18.17.1 <19.0.0 || >=20.9.0 <21.0.0` — build will fail outside this range. |

## 6. Known constraints / things future maintainers should know

- No automated tests currently exist beyond the `jest --passWithNoTests`
  placeholder script — any real test suite is still to be added.
- No CI/CD pipeline is defined in-repo; packaging and deployment are manual
  (see the Update Guide).
- No license file is present.
- SharePoint internal field names are the most fragile part of the
  integration — see `SopService.ts` comments before changing any SharePoint
  column.
