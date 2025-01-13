export type Organization = {
    id: number,
    uuid: string,
    name: string,
    logo: string,
    status: number
}

export type UserRoles = {
    ids: Array<number>,
    slugs: Array<string>
}

export type AuthenticatedUser = {
    userEmail: string, 
    userId: number,
    userUid: string,
    roles: UserRoles,
    litmitAccessTo: number[], //list of organzation the data is limited to, if empty - access to all
    department?: {
        id: number;
        title: string;
        slug: string;
    },
    organization?: Organization
}

export class AuthenticatedUserPhone {
    phone: string;
    phoneCode: string;
    userAgent?: string
}

export class AuthenticatedUserEmail {
    email: string;
    userAgent?: string
}

export class AuthenticatedResetToken {
    uuid: string;
}