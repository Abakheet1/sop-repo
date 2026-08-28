export interface IProcess {
  id: number;
  title: string;
  /** Value from "Role (Choice)" column — REST API internal name: Role_x0020__x0028_Choice_x0029_ */
  roleChoice: string;
  /**
   * URL to the associated document from the "Document Link" column.
   * If blank, this process is a gap (no SOP exists yet).
   * NOTE: "Has SOP" boolean is stale and ignored — gap is derived from this field at runtime.
   */
  documentLink: string;
  documentType: string;
}
