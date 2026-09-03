# Client-Facing SharePoint Page — "SOP Repository App: Documentation & Support"

This file is the **content draft** for a SharePoint page that links staff to
the SOP Repository application's supporting documentation. Copy the sections
below into a SharePoint modern page using matching web parts, then publish.

## How to build the page in SharePoint

1. Go to the site that hosts the SOP Repository web part
   (e.g. `https://communityessentials.sharepoint.com/sites/SOPProcessManagement`).
2. **Site contents → Site Pages → + New → Site Page**.
3. Name it `SOP Repository – Documentation` (or similar).
4. Add web parts in this order, using the content below:
   - **Text** web part → paste the "Overview" section.
   - **Quick Links** web part → one link per row in the "Documentation
     links" table below.
   - **Text** web part → paste the "Support & change requests" section.
5. Set the page to **News** or a standard page depending on how it should be
   surfaced; add it to site navigation (e.g. under "IT Resources").
6. Click **Publish**.
7. Optional: promote it to the site's home page navigation or a hub site
   link so it's easy to find.

---

## Page content to paste in

### Overview

> ## SOP Repository App
>
> The SOP Repository app helps Village of Mundelein staff quickly find the
> Standard Operating Procedures (SOPs) and Job Descriptions relevant to their
> role. It automatically filters documents by your role/department and flags
> processes that don't have a documented SOP yet.
>
> Use the links below for setup help, technical documentation, and how to
> request changes or new content.

### Documentation links

| Link text | Target |
|---|---|
| Application overview & architecture | Link to `docs/APPLICATION-LIFECYCLE.md` (see "Where documentation lives" below) |
| How to request an update or fix | Link to `docs/UPDATE-GUIDE.md`, or an internal IT ticket form |
| Source code repository | `https://github.com/JonEricEubanks/sop-repo` |
| SOP Process Library (source documents) | Your tenant's document library, e.g. `https://communityessentials.sharepoint.com/sites/SOPProcessManagement/SOP%20Process%20Library` |
| Report missing/incorrect SOPs | Link to an IT Helpdesk request form/mailbox |

> **Note:** Update the exact URLs above to match wherever your organization
> chooses to publish the repo docs (see options below) and your real
> document library path.

### Support & change requests

> ## Need something changed?
>
> - **Missing or outdated SOP content:** contact IT with the process name and
>   role so the source document can be added/updated in the SOP Process
>   Library.
> - **App behavior or bug:** file a ticket with IT describing what you saw
>   and which role/page you were on.
> - **New feature request:** submit through the same IT request channel;
>   requests are prioritized against the existing roadmap.

---

## Where documentation lives (choose one and update the links above)

Since `docs/APPLICATION-LIFECYCLE.md` and `docs/UPDATE-GUIDE.md` live in the
git repository, pick how staff without repo access will read them:

1. **Mirror as SharePoint pages** — copy the Markdown content into two more
   SharePoint site pages (simplest for non-technical staff, but must be
   manually kept in sync with the repo).
2. **Link to GitHub directly** — if staff have GitHub access, link straight
   to the files in the repo (`https://github.com/JonEricEubanks/sop-repo/blob/main/docs/APPLICATION-LIFECYCLE.md`).
   Lowest maintenance, but requires a GitHub account/permissions.
3. **Upload as PDFs to a document library** — export both docs to PDF and
   store them in a SharePoint library alongside the SOPs, then link to those
   files. Good middle ground for non-technical audiences with no GitHub
   access.

Whichever option is chosen, keep this page's links updated whenever the
underlying docs move or are renamed.
