# Role & Responsibility Documentation — Internal SharePoint Page Content

> **Audience:** Village of Mundelein IT staff. This page is for **internal**
> use — it is not intended for external clients. It gives the IT/solution
> team (and any staff who need to maintain or reference this app) one place
> to find the supporting documentation.

## How to build the page in SharePoint

1. Go to the site that hosts the Role & Responsibility Documentation web
   part (e.g. `https://communityessentials.sharepoint.com/sites/SOPProcessManagement`).
2. **Site contents → Site Pages → + New → Site Page**.
3. Name it `Role & Responsibility Documentation — Internal Docs` (or
   similar).
4. Add web parts in this order, using the content below:
   - **Text** web part → paste the "Overview" section.
   - **Quick Links** web part → one link per row in the "Documentation
     links" table below.
   - **Text** web part → paste the "Support & change requests" section.
5. Add the page to internal site navigation (e.g. under "IT Resources").
   Do **not** promote this page to any externally-shared or client-visible
   navigation — it is internal only.
6. Click **Publish**.

## Page content to paste in

### Overview

> ## Role & Responsibility Documentation — Internal Reference
>
> This page links the IT team to the technical and operational documentation
> for the Role & Responsibility Documentation SharePoint web part (internal
> solution name: `sop-repository`). Use it to find how the app was built,
> how to update and redeploy it, and where the supporting SharePoint lists
> and library live.

### Documentation links

| Link text | Target |
|---|---|
| Application lifecycle & architecture | `docs/APPLICATION-LIFECYCLE.md` in the repository |
| Update & maintenance guide | `docs/UPDATE-GUIDE.md` in the repository |
| Source code repository | https://github.com/JonEricEubanks/sop-repo |
| Pending rebrand / Admin upload feature (PR #1) | https://github.com/JonEricEubanks/sop-repo/pull/1 |
| Roles list | Your tenant's Roles list, e.g. `{sopSiteUrl}/Lists/Roles` |
| Process list | Your tenant's Process list, e.g. `{sopSiteUrl}/Lists/Process` |
| Documentation library | Your tenant's document library — `SOP & Process Library` (pending rebrand) or `SOP Process Library` (current), e.g. `{sopSiteUrl}/SOP%20Process%20Library` |
| Admin Access list (pending rebrand only) | Your tenant's `Admin Access` list, once created — controls who sees the Upload button |

> **Note:** Replace `{sopSiteUrl}` above with the actual site URL configured
> in the web part's property pane before publishing this page.

### Support & change requests

> ## Need something changed?
>
> - **Missing or outdated SOP/Job Description content:** update the source
>   document directly in the documentation library, or use the in-app
>   Upload feature if you're listed in the Admin Access list (pending
>   rebrand only).
> - **App behavior or bug:** log it with the IT team internally, including
>   the role/page you were on and what you expected to happen.
> - **New feature request or config change:** raise it with whoever owns
>   this repository so it can be scoped against `docs/UPDATE-GUIDE.md`'s
>   common-change scenarios and the existing roadmap (see PR #1 for what's
>   already in progress).

---

## Where this documentation actually lives

Since `docs/APPLICATION-LIFECYCLE.md` and `docs/UPDATE-GUIDE.md` live in the
git repository, this internal page just links out to them rather than
duplicating their content, so there's a single source of truth to keep
updated as the app changes:

1. **Link to GitHub directly** (recommended for IT staff with repo access) —
   link straight to the files, e.g.
   `https://github.com/JonEricEubanks/sop-repo/blob/main/docs/APPLICATION-LIFECYCLE.md`.
   Lowest maintenance; always reflects the current `main` branch.
2. **Mirror as SharePoint pages** — copy the Markdown content into additional
   internal SharePoint pages if some staff need it without GitHub access.
   Must be manually kept in sync with the repo.
3. **Upload as Word/PDF files to an internal library** — export the docs
   (see `docs/word/`) and store them in an internal SharePoint library.
   Useful for staff who prefer a Word document over GitHub.

Whichever option is used, keep this page's links updated whenever the
underlying docs move, are renamed, or PR #1 merges (at which point the
"pending rebrand" callouts throughout the docs should be removed).
