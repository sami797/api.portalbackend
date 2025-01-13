import { User } from "@prisma/client"
export type SendPasswordResetLink = {
    user: Partial<User>,
    token: string,
    origin: string,
}