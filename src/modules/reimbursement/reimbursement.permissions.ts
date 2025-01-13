export enum ReimbursementPermissionSet {
    "CREATE" = "createReimbursement",
    "UPDATE" = "updateReimbursement",
    "DELETE" = "deleteReimbursement",
    "READ" = "readReimbursement",
    "HR_APPROVAL" = "reimbursementHRApproval",
    "FINANCE_APPROVAL" = "reimbursementFinanceApproval"
}

export type ReimbursementPermissionSetType = {
    [key in ReimbursementPermissionSet]: boolean;
}