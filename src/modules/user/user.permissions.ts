export enum UserPermissionSet {
    "CREATE" = "createUser",
    "UPDATE" = "updateUser",
    "DELETE" = "deleteUser",
    "READ" = "readUser",
    "READ_AUTH_TOKENS_ISSUED" = "readAuthTokensIssued",
    "ADD_USER_ROLE" = "addUserRole",
    "ADD_USER_COUNTRY" = "addUserCountry",
    "MANAGE_ALL" = "manageAllUser",
    "REMOVE_USER_COUNTRY" = "removeUserCountry",
    "LOGIN_AS_OTHER_USER" = "loginAsOtherUser"
}

export type UserPermissionSetType = {
    [key in UserPermissionSet]: boolean;
}