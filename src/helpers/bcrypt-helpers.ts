import * as bcrypt from "bcrypt";
const saltRounds = 10;

export const generateHash = (password: string) => {
    let  hashData =  bcrypt.hashSync(password,saltRounds);
    return hashData;
}

export const compareHash = (password: string, hash : string) => {
    let compareResult = bcrypt.compareSync(password, hash);
    return compareResult
}