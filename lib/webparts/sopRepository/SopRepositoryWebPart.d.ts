import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IPropertyPaneConfiguration } from "@microsoft/sp-property-pane";
export interface ISopRepositoryWebPartProps {
    sopSiteUrl: string;
    libraryName: string;
    processListName: string;
    rolesListName: string;
    showGaps: boolean;
    defaultRole: string;
}
export default class SopRepositoryWebPart extends BaseClientSideWebPart<ISopRepositoryWebPartProps> {
    private _service;
    protected onInit(): Promise<void>;
    private _initService;
    render(): void;
    protected onDispose(): void;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
}
//# sourceMappingURL=SopRepositoryWebPart.d.ts.map