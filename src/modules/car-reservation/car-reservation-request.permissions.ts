export enum CarReservationRequestPermissionSet {
    "CREATE" = "createcarReservationRequest",
    "UPDATE" = "updatecarReservationRequest",
    "DELETE" = "deletecarReservationRequest",
    "READ" = "readcarReservationRequest",
    "HR_APPROVAL" = "carReservationRequestHRApproval"
}

export type CarReservationRequestPermissionSetType = {
    [key in CarReservationRequestPermissionSet]: boolean;
}