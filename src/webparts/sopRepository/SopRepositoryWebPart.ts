import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";

import * as strings from "SopRepositoryWebPartStrings";
import { SopRepository } from "./components/SopRepository";
import { ISopRepositoryProps } from "./components/ISopRepositoryProps";
import { SopService } from "./services/SopService";

export interface ISopRepositoryWebPartProps {
  sopSiteUrl: string;
  libraryName: string;
  processListName: string;
  rolesListName: string;
  adminListName: string;
  showGaps: boolean;
  defaultRole: string;
}

export default class SopRepositoryWebPart extends BaseClientSideWebPart<ISopRepositoryWebPartProps> {
  private _service: SopService;

  protected async onInit(): Promise<void> {
    await super.onInit();
    this._initService();
  }

  private _initService(): void {
    this._service = new SopService(this.context, {
      sopSiteUrl: this._resolveSiteUrl(),
      libraryName: this.properties.libraryName || "SOP & Process Library",
      processListName: this.properties.processListName || "Process",
      rolesListName: this.properties.rolesListName || "Roles",
      adminListName: this.properties.adminListName || "Admin Access",
    });
  }

  /**
   * Resolves the site to read SOP data from. Defaults to the CURRENT site
   * (wherever the web part was added) so it works out of the box on any
   * site — an admin only needs to fill in "Site URL" in the property pane
   * if the data actually lives on a *different* site than the page.
   */
  private _resolveSiteUrl(): string {
    return this.properties.sopSiteUrl || this.context.pageContext.web.absoluteUrl;
  }

  public render(): void {
    // Rebuild service if site URL or list names have changed (property pane update)
    this._initService();

    const element: React.ReactElement<ISopRepositoryProps> = React.createElement(
      SopRepository,
      {
        context: this.context,
        service: this._service,
        sopSiteUrl: this._resolveSiteUrl(),
        libraryName: this.properties.libraryName || "SOP & Process Library",
        processListName: this.properties.processListName || "Process",
        rolesListName: this.properties.rolesListName || "Roles",
        showGaps: this.properties.showGaps !== false,
        defaultRole: this.properties.defaultRole || "",
        isPropertyPaneOpen: this.context.propertyPane.isPropertyPaneOpen(),
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.DataGroupName,
              groupFields: [
                PropertyPaneTextField("sopSiteUrl", {
                  label: strings.SopSiteUrlLabel,
                  description:
                    "Leave blank to use the current site (recommended). Only fill this in if the SOP & Process Library, Process list, and Roles list actually live on a DIFFERENT site than the one this web part is placed on.",
                  placeholder: "(current site)",
                  multiline: false,
                }),
                PropertyPaneTextField("libraryName", {
                  label: strings.LibraryNameLabel,
                  placeholder: "SOP & Process Library",
                }),
                PropertyPaneTextField("processListName", {
                  label: strings.ProcessListNameLabel,
                  placeholder: "Process",
                }),
                PropertyPaneTextField("rolesListName", {
                  label: strings.RolesListNameLabel,
                  placeholder: "Roles",
                }),
                PropertyPaneTextField("adminListName", {
                  label: strings.AdminListNameLabel,
                  description:
                    "List used to gate the document upload feature. Users listed here with Access Level 'Admin' see an Upload button on each process.",
                  placeholder: "Admin Access",
                }),
              ],
            },
            {
              groupName: strings.DisplayGroupName,
              groupFields: [
                PropertyPaneToggle("showGaps", {
                  label: strings.ShowGapsLabel,
                  onText: "Show",
                  offText: "Hide",
                }),
                PropertyPaneTextField("defaultRole", {
                  label: strings.DefaultRoleLabel,
                  description:
                    "Leave blank to auto-detect from the user's Azure AD job title. Enter a role name to override for all users.",
                  placeholder: "e.g. IT Support Technician",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
