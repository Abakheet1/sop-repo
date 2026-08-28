import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SopService } from "../services/SopService";

export interface ISopRepositoryProps {
  context: WebPartContext;
  service: SopService;
  sopSiteUrl: string;
  libraryName: string;
  processListName: string;
  rolesListName: string;
  showGaps: boolean;
  defaultRole: string;
  isPropertyPaneOpen: boolean;
}
