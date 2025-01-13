import { Options } from "@nestjs/common";
import { Request } from "express";

export const generateSEOFriendlyFileName = (fileName) => {
    var temp = fileName.replace(/\s/g, '-');
    temp = temp.toLowerCase();
    temp = temp.replace(/[%'?&*()#+=!/~@$^{}"']/g, '');
    return temp;
}

export const loggerOptions = () => {
    let options = [];
    switch(process.env.ENVIRONMENT){
        case "development" : options = ['error', 'log', 'debug']; break;
        case "production" : options = ['error', 'log']; break;
        default: options = ['error']; break;
    }
    return options;
}

export const findClientIpAddress = (req: Request) => {
    let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    let clientIPAddress = Array.isArray(userIp) ? userIp.join(",") : userIp;
    return clientIPAddress;
}