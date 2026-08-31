declare interface ISopRepositoryWebPartStrings {
  PropertyPaneDescription: string;
  DataGroupName: string;
  DisplayGroupName: string;
  SopSiteUrlLabel: string;
  LibraryNameLabel: string;
  ProcessListNameLabel: string;
  RolesListNameLabel: string;
  ShowGapsLabel: string;
  DefaultRoleLabel: string;
  LoadingLabel: string;
  ErrorLabel: string;
  NoRoleDetectedLabel: string;
  SelectRoleLabel: string;
  SelectDepartmentLabel: string;
  AllDepartmentsLabel: string;
  DocumentedSectionTitle: string;
  GapsSectionTitle: string;
  JobDescriptionsSectionTitle: string;
  SearchPlaceholder: string;
  StatusApproved: string;
  StatusDraft: string;
  ReviewDateLabel: string;
  NoDocumentsLabel: string;
  NoGapsLabel: string;
}

declare module "SopRepositoryWebPartStrings" {
  const strings: ISopRepositoryWebPartStrings;
  export = strings;
}
