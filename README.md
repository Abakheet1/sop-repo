# Role & Responsibility Documentation

This repository contains the SharePoint Framework (SPFx) web part for the Role & Responsibility Documentation application (internally, the solution and code are still named "sop-repository"/"SopRepository" to avoid breaking sites where the web part is already deployed).

It is designed to help a developer or GitHub Copilot quickly understand the project, make UI or logic changes, and package/deploy the solution to SharePoint.

## Project purpose

The app provides a searchable, role- and department-organized documentation experience for employees. It includes:

- role and department filtering
- SOP and job description cards with metadata
- direct access to a user's own job description
- document preview and detail behaviors
- highlighting of processes that still need documentation ("Undocumented Processes")
- SharePoint-formatted packaging for deployment

## Tech stack

- SharePoint Framework (SPFx)
- React + TypeScript
- Office UI Fabric / Fluent-style patterns
- Node.js / npm
- Gulp build pipeline

## Repository layout

- `src/webparts/sopRepository/` — main web part code
- `src/webparts/sopRepository/components/` — reusable UI components
- `src/webparts/sopRepository/hooks/` — custom hooks
- `src/webparts/sopRepository/models/` — TypeScript interfaces and models
- `src/webparts/sopRepository/services/` — service methods for data access
- `config/` — SPFx configuration files
- `sharepoint/solution/` — packaged SPFx deployment artifacts
- `dist/` and `lib/` — generated build output

## Local setup

1. Open a terminal in the repo root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local SPFx workbench:
   ```bash
   gulp serve
   ```
4. If you need a production package:
   ```bash
   gulp build
   gulp bundle --ship
   gulp package-solution --ship
   ```

## Deployment notes

The packaged solution is located in:

- `sharepoint/solution/sop-repository.sppkg`

Use this package in SharePoint or the tenant app catalog to deploy the web part.

## Key files to review first

- `src/webparts/sopRepository/SopRepositoryWebPart.ts`
- `src/webparts/sopRepository/components/SopRepository.tsx`
- `src/webparts/sopRepository/services/SopService.ts`
- `src/webparts/sopRepository/models/IRole.ts`
- `src/webparts/sopRepository/components/RoleSelector/RoleSelector.tsx`

## Copilot guidance

When making changes in GitHub Copilot, keep the following in mind:

- Preserve the existing SharePoint/SPFx architecture and build conventions.
- Prefer targeted edits in the existing component structure instead of creating unrelated parallel implementations.
- Keep behavior consistent with the current web part UX and mobile layout expectations.
- Validate with the SPFx build before shipping changes.
- If adding a new feature, update the relevant component, model, and service layer together.
- Use clear, formal, professional wording in all user-facing text — the audience is municipal government staff. Avoid slang, casual phrasing, and alarming language (e.g. prefer "Undocumented Processes" over "Gaps", and amber/informational styling over red/critical styling for missing-but-not-urgent items).

## Typical edit workflow

1. Understand the relevant component and data flow.
2. Update TypeScript models or services if data changes.
3. Modify the UI component that renders the affected behavior.
4. Run build validation:
   ```bash
   gulp build
   ```
5. Repackage if deployment artifacts need to be refreshed.

## Notes for maintainers

- The project is currently set up as a SharePoint Framework package.
- Keep `sharepoint/solution/` artifacts aligned with the latest build when shipping updates.
- If a new package is generated, review the package manifest and app details before deployment.

## Common edit tasks

Use this workflow when updating the web part:

1. Identify the exact component or service that owns the behavior.
2. Make the UI or logic change in the relevant TypeScript file.
3. Update supporting models or services if the data contract changes.
4. Validate with `gulp build` before packaging.
5. Regenerate and review the packaged solution under `sharepoint/solution/` when needed.

## Copilot handoff checklist

When handing this repo to GitHub Copilot or another developer, make sure they know:

- This is an SPFx project, not a plain React app.
- The main application entry is `src/webparts/sopRepository/SopRepositoryWebPart.ts`.
- Most UI updates belong in the components folder, while data logic belongs in services and hooks.
- SharePoint packaging and deployment artifacts live in `sharepoint/solution/`.
- Build validation should happen with the SPFx gulp commands before final deployment.

## License

This project currently does not include an explicit license file. Add one if your organization requires a formal license before publishing externally.
