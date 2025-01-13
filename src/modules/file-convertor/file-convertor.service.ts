import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import * as csvParser from 'papaparse';
import * as fs  from "fs";
import { getFileStream, readFile, uploadFile } from 'src/helpers/file-management';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class FileConvertorService {
    async convertFileToJSON(fileKey: string, filePath: string) {
        const readStream = await readFile(fileKey);
        if (!readStream) {
            throw {
                message: "No File Found",
                statusCode: 400
            }
        }
        const fileType = fileKey.split('.').pop();
        let fileName = fileKey.split('/').pop();
        fileName = fileName.split(".").shift() + Date.now() + ".json";
        let newFileName = filePath + fileName;
        let jsonData = null;
        if (fileType === 'xlsx') {
            jsonData = await this.parseExcelToJson(readStream);
            await this.saveAndUploadFile(jsonData, filePath, fileName);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (fileType === 'csv') {
            jsonData = await this.parseCsvToJson(readStream);
            await this.saveAndUploadFile(jsonData, filePath, fileName);
            //wait sometime for some buffer time
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (fileType === 'json') {
            // jsonData = JSON.parse(readStream.toString('utf-8'));
            newFileName = fileKey;
        }
        return newFileName;
    }

    private async saveAndUploadFile(data: Buffer, filePath: string, fileName: string,){
        let __fileLocation = process.cwd() + "/" + filePath;
        if (!existsSync(filePath)) {
        mkdirSync(filePath, { recursive: true });
        }
        fs.writeFileSync(filePath+fileName, JSON.stringify(data, null, 2));
        const fileToUpload : Express.Multer.File = {
            fieldname : "",
            filename: fileName,
            size : 0,
            encoding: 'utf-8',
            mimetype: "application/pdf",
            destination: filePath + "/",
            path: __fileLocation+fileName,
            originalname: fileName,
            stream: undefined,
            buffer: undefined

        }
        await uploadFile(fileToUpload);
    }

    private async parseExcelToJson(buffer: Buffer) {
        const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        return jsonData;
        // const jsonDataArray = [];
        // workbook.SheetNames.forEach((sheetName) => {
        //     const worksheet = workbook.Sheets[sheetName];
        //     const sheetData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        //     jsonDataArray.push({ sheetName, data: sheetData });
        // });
        // return jsonDataArray;
    }

    private async parseCsvToJson(buffer: Buffer) {
        return new Promise((resolve, reject) => {
            csvParser.parse(buffer.toString(), {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (error) => {
                    reject(error);
                },
            });
        });
    }
}
