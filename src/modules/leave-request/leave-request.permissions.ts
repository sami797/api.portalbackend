export enum LeaveRequestPermissionSet {
    "CREATE" = "createLeaveRequest",
    "UPDATE" = "updateLeaveRequest",
    "DELETE" = "deleteLeaveRequest",
    "READ" = "readLeaveRequest",
    "HR_APPROVAL" = "leaveRequestHRApproval"
}

export type LeaveRequestPermissionSetType = {
    [key in LeaveRequestPermissionSet]: boolean;
}