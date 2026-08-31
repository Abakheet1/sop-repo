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
      sopSiteUrl: this.properties.sopSiteUrl || "",
      libraryName: this.properties.libraryName || "SOP & Process Library",
      processListName: this.properties.processListName || "Process",
      rolesListName: this.properties.rolesListName || "Roles",
    });
  }

  public render(): void {
    // Rebuild service if site URL or list names have changed (property pane update)
    this._initService();

    const element: React.ReactElement<ISopRepositoryProps> = React.createElement(
      SopRepository,
      {
        context: this.context,
        service: this._service,
        sopSiteUrl: this.properties.sopSiteUrl || "",
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
                    "Full URL of the site containing the SOP & Process Library, Process list, and Roles list. Example: https://communityessentials.sharepoint.com/sites/SOPProcessManagement",
                  placeholder:
                    "https://communityessentials.sharepoint.com/sites/SOPProcessManagement",
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
