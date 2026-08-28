import { ISopDocument } from "./ISopDocument";

/** A process enriched with its matching SOP documents, ready for display */
export interface IProcessViewModel {
  id: number;
  processTitle: string;
  roleChoice: string;
  /** True when documentLink is non-empty or matching SOP documents exist */
  isDocumented: boolean;
  /** Direct link from Process list "Document Link" column */
  documentLink: string;
  /** SOP documents that reference this process by title */
  matchedDocuments: ISopDocument[];
}
