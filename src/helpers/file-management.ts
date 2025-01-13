import * as fs from "fs";
import * as S3 from 'aws-sdk/clients/s3';
import * as archiver from 'archiver';
import { Logger } from "@nestjs/common";
import { extractRelativeDirectoryFromFilePath, removeUploadedFiles } from "./file-upload.utils";
import { SmartStream } from "./smartStream";
import axios from "axios";
import { unlink } from "fs";

function getS3Instance() {

    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_BUCKET_REGION;
    const accessKeyId = process.env.S3_BUCKET_ACCESS_KEY;
    const secretAccessKey = process.env.S3_BUCKET_SECRET_KEY;

    const s3 = new S3({
        region,
        accessKeyId,
        secretAccessKey
    })
    return s3;
}

export async function uploadFile(files: Express.Multer.File | Array<Express.Multer.File>, callback: Function | null = null) {
    if (!files) return;
    if (Array.isArray(files)) {
        await uploadSingle(files, callback)
    } else {
        await uploadSingle([files], callback)
    }
}

export async function uploadSingle(files: Array<Express.Multer.File>, callback: Function | null = null) {
    const s3 = getS3Instance();
    const bucketName = process.env.AWS_BUCKET_NAME;
    let allUploads = [];
    files.forEach((item) => {
        var uploadPathBucket = bucketName + '/' + extractRelativeDirectoryFromFilePath(item.path, item.filename);
        var readStream = fs.createReadStream(item.path);
        var uploadParams = {
            Bucket: uploadPathBucket,
            Key: item.filename,
            ContentType: item.mimetype,
            Body: readStream,
        };

        let t = s3.upload(uploadParams, function (err, data) {
            if (err) {
                let logger = new Logger("S3 Upload");
                logger.error("Some error while uploading files to s3 bucket ", err);
            } else {
                let logger = new Logger("S3 Upload");
                logger.log("File has been uploaded to s3 bucket successfully");
                removeUploadedFiles(item)
                if (callback) {
                    callback()
                }
            }
        });
        allUploads.push(t);
    });
    return await Promise.all(allUploads);
}

export async function createZipAndUpload(sourceKeys: Array<string>, zipFilePath: string) {
    let logger = new Logger("S3 ZIP Upload");
    logger.log("Zip file sharing started, path: ",zipFilePath);
    const s3 = getS3Instance();
    const bucketName = process.env.AWS_BUCKET_NAME;
    const archive = archiver('zip', { zlib: { level: 4 } });
    const output = fs.createWriteStream(zipFilePath);
    archive.pipe(output);

    for (const sourceKey of sourceKeys) {
        const params = { Bucket: bucketName, Key: sourceKey };
        try {
            const s3Object = await s3.getObject(params).promise();
            const fileName = sourceKey.split('/').pop();
            archive.append(s3Object.Body, { name: fileName });
        } catch (err) {
            logger.error('Error adding object to archive:', err.message);
        }
    }
    archive.finalize();
    output.on('close', async () => {
        logger.log('Zip archive created successfully.');
        const uploadParams = {
            Bucket: bucketName,
            Key: zipFilePath, // Specify the desired destination path in S3
            Body: fs.readFileSync(zipFilePath),
        };
        logger.log("Saving Zip file to s3 bucket");
        return s3.upload(uploadParams, function(err, data){
            if (err) {
                logger.error("Some error while uploading zip file to s3 bucket ", err);
            } else {
                logger.log("Zip File has been uploaded to s3 bucket successfully");
                unlink(zipFilePath, (err) => {
                    if (err){logger.log(" Some error while removing file " + zipFilePath);}
                    logger.log("File " + zipFilePath + " has been removed successfully")
                  })
            }
        })
    });
    // archive.pipe(fs.createWriteStream(zipFilepath));

}

export async function uploadFromBuffer(fileBuffer: Buffer, fileName: string) {
    const s3 = getS3Instance();
    const bucketName = process.env.AWS_BUCKET_NAME;
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: 'application/pdf'
      };
      return await s3.upload(params).promise();
}

export async function uploadFromUrl(files: Array<string>, path: string, propertyId?: number, organizationId?: number, callback: Function | null = null) {
    const s3 = getS3Instance();
    const bucketName = process.env.AWS_BUCKET_NAME;
    let uploadedFilesPath: Array<string> = [];
    let filesIndex = 0;
    for (const item of files) {
        var uploadPathBucket = bucketName + '/' + path;
        let __image = item.split('/').pop();
        let fileName = Date.now() + "_" + Math.floor((Math.random() * 1000) + 1) + "_" + __image.split("?").shift();
        let extension = fileName.split(".")[1];

        if (!extension) {
            fileName = fileName + ".jpeg";
        }
        axios({
            method: 'GET',
            url: item,
            responseType: 'arraybuffer'
        }).then(response => {

            var readStream = response.data;
            if (typeof readStream === "string") {
                throw { message: "Expected image, found string" }
            }

            var uploadParams = {
                Bucket: uploadPathBucket,
                Key: fileName,
                Body: readStream
            };

            s3.putObject(uploadParams, function (err, data) {
                if (err) {
                    let logger = new Logger("S3 Upload");
                    logger.error("Some error while uploading files to s3 bucket ", err);
                } else {
                    uploadedFilesPath.push(path + "/" + fileName);
                    let logger = new Logger("S3 Upload");
                    logger.log("File has been uploaded to s3 bucket successfully");
                }

                if (filesIndex >= files.length - 1) {
                    if (callback && propertyId && organizationId) {
                        callback(propertyId, organizationId, uploadedFilesPath)
                    }
                }
                filesIndex++;
            });
        }).catch(err => {
            filesIndex++;
            let logger = new Logger("uploadFromUrl");
            logger.error("Some error:", err.message);
        });
    };
}

export function getFileStream(fileKey) {
    const s3 = getS3Instance();
    const bucketName = process.env.AWS_BUCKET_NAME;
    const downloadParams = {
        Key: fileKey,
        Bucket: bucketName
    }
    return s3.getObject(downloadParams).createReadStream()
}

export async function readFile(fileKey) {
    const s3 = getS3Instance();
    const bucketName = process.env.AWS_BUCKET_NAME;
    const downloadParams = {
        Key: fileKey,
        Bucket: bucketName
    }
    return s3.getObject(downloadParams).promise().then((res) => {
        return res.Body as Buffer;
    }).catch((err) => {
        console.error("Read File Error", err?.message);
        return;
    });
}


export async function createAWSStream(fileKey: string, data: S3.HeadObjectOutput, { start, end }: { start: number, end: number }): Promise<SmartStream> {
    return new Promise((resolve, reject) => {
        const bucketName = process.env.AWS_BUCKET_NAME;
        const bucketParams = {
            Bucket: bucketName,
            Key: fileKey
        };

        try {
            const s3 = getS3Instance();
            const stream = new SmartStream(bucketParams, s3, data.ContentLength, start, end);
            resolve(stream);
        } catch (error) {
            reject(error);
        }
    })
}


export async function createAWSStreamMetaData(fileKey: string): Promise<S3.HeadObjectOutput> {
    return new Promise((resolve, reject) => {
        const bucketName = process.env.AWS_BUCKET_NAME;
        const bucketParams = {
            Bucket: bucketName,
            Key: fileKey
        };
        try {
            const s3 = getS3Instance();
            s3.headObject(bucketParams, (error, data) => {
                if (error) {
                    reject(error);
                    return;
                };
                resolve(data);
            })
        } catch (error) {
            reject(error);
        }
    })
}

export async function readS3JsonFile(fileKey: string) {
    return new Promise((resolve, reject) => {
        const bucketName = process.env.AWS_BUCKET_NAME;
        const bucketParams = {
            Bucket: bucketName,
            Key: fileKey
        };
        try {
            const s3 = getS3Instance();
            s3.getObject(bucketParams, (error, data) => {
                if (error) {
                    reject(error);
                    return;
                };
                var json = JSON.parse(data.Body.toString('utf-8'));
                resolve(json);
            })
        } catch (error) {
            reject(error);
        }
    })
}
// exports.getFileStream = getFileStream