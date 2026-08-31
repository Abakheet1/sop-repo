export interface ISopDocument {
  id: number;
  title: string;
  /** Value from "Role (Choice)" column — REST API internal name: Role_x0020__x0028_Choice_x0029_ */
  roleChoice: string;
  /** Maps to "Process" column — used to join with Process list by title */
  processTitle: string;
  /** "SOP" | "Job Description" */
  documentType: string;
  /** "Approved" | "Draft" | "" */
  status: string;
  /** ISO date string or empty */
  reviewDate: string;
  /** SharePoint's built-in Modified date (ISO string) — always populated for a real file, used as a fallback display date when reviewDate hasn't been manually entered */
  modified: string;
  /** Absolute URL to open the document */
  fileUrl: string;
}
