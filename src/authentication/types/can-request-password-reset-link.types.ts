export type CanRequestPasswordResetLink  = {
    canActivate : boolean,
    message: string,
    waitTime?: number
}