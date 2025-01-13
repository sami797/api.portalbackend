export enum CashAdvancePermissionSet {
    "CREATE" = "createCashAdvance",
    "UPDATE" = "updateCashAdvance",
    "DELETE" = "deleteCashAdvance",
    "READ" = "readCashAdvance",
    "HR_APPROVAL" = "cashAdvanceHRApproval",
    "MANAGER_APPROVAL" = "cashAdvanceMANAGERApproval",
    "FINANCE_APPROVAL" = "cashAdvanceFinanceApproval"
}

export type CashAdvancePermissionSetType = {
    [key in CashAdvancePermissionSet]: boolean;
}