import { HttpException, Logger } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { diskStorage } from "multer";
import { extname } from "path";
import { generateSEOFriendlyFileName } from "./helpers";
import { existsSync, mkdirSync, unlink } from "fs";


export enum FileTypes {
  "images_and_pdf" = "images_and_pdf",
  "images_only" = "images_only",
  "images_and_videos" = "images_and_videos",
  "all_files" = "all_files",
  "json" = "json",
  "images_only_with_svg" = "images_only_with_svg",
  "json_and_excel" = "json_and_excel"
}

type multerConfigOptions = {
  destination?: string;
  /**
   * limit in bytes, 500000 = 500KB
   */
  limit?: number;
  fileTypes?: keyof typeof FileTypes
}

export function imageFileFilter(req, file, callback) {
  let fileAttributes = { pattern: /\.(jpg|jpeg|png)$/i, plain: "jpg|jpeg|png" };
  if (this && this.fileTypes) {
    let fileTypes: keyof typeof FileTypes = this.fileTypes;
    switch (fileTypes) {
      case 'images_only': fileAttributes.pattern = /\.(jpg|jpeg|png)$/i;
        fileAttributes.plain = "jpg|jpeg|png";
        break;

      case 'images_and_videos': fileAttributes.pattern = /\.(jpg|jpeg|png|mp4|mov|3gp)$/i;
        fileAttributes.plain = "jpg|jpeg|png|mp4|mov|3gp";
        break;

      case 'images_only_with_svg': fileAttributes.pattern = /\.(jpg|jpeg|png|svg)$/i;
        fileAttributes.plain = "jpg|jpeg|png|svg";
        break;
      case 'images_and_pdf': fileAttributes.pattern = /\.(jpg|jpeg|png|pdf)$/i;
        fileAttributes.plain = "jpg|jpeg|png|pdf";
        break;

      case 'json': fileAttributes.pattern = /\.(json)$/i;
      fileAttributes.plain = "json";
      break;

      case 'json_and_excel': fileAttributes.pattern = /\.(json|xlsx|csv)$/i;
      fileAttributes.plain = "jpg|jpeg|png|pdf";
      break;

      // case 'all_files': fileAttributes.pattern = /\.*$/i;
      //   fileAttributes.plain = "all types";
      //   break;
      case 'all_files': fileAttributes.pattern = /^(?:(?!\.(exe|bat|cmd|com|sh|ps1|dll|py|pyc|js|mjs|bsh|bash|pl|php|rb|jar|lnk|zip)$).)*$/i;
        fileAttributes.plain = "regular documents except executable files";
        break;

      default: fileAttributes.pattern = /\.(jpg|jpeg|png)$/i;
        fileAttributes.plain = "jpg|jpeg|png";
        break;
    }
  }

  if (!file.originalname.match(fileAttributes.pattern)) {
    return callback(new HttpException(`File type not allowed! Allowed Extensions ${fileAttributes.plain}`, 415), false);
  }

  callback(null, true);
};

export const imageAndPdfFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new HttpException(`Only image and pdf files are allowed! Allowed Extensions jpg|jpeg|png|gif|webp`, 400), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  let name = file.originalname.split('.')[0];
  name = name.slice(0, 60);
  name = generateSEOFriendlyFileName(name);
  const fileExtName = extname(file.originalname);
  const randomName = Date.now();
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const getMulterOptions = (options: multerConfigOptions = {}) => {
  const { destination = "public/uploads", limit = 500000, fileTypes = FileTypes["images_only"], ...rest } = options
  const multerOptions: MulterOptions = {
    storage: diskStorage({
      destination: function (req, file, callback) {
        let _fullPath = process.cwd() + '/' + destination;
        if (!existsSync(_fullPath)) {
          mkdirSync(_fullPath, { recursive: true });
        }
        callback(null, _fullPath)
      },
      filename: editFileName,
    }),
    limits: {
      fileSize: limit,
    },
    fileFilter: imageFileFilter.bind(options)
  }

  return multerOptions;
}

export const removeUploadedFiles = async (file: Express.Multer.File | Array<Express.Multer.File>) => {
  if (!file) return false;
  if (Array.isArray(file)) {
    file.forEach(function (ele) {
      __removeFiles(ele);
    })
  } else {
    __removeFiles(file);
  }
}

const __removeFiles = async (file: Express.Multer.File) => {
  const path = file.path;
  const logger = new Logger("File Utils");
  try {
    unlink(path, (err) => {
      if (err)
        logger.log(" Some error while removing file " + file.filename);

      logger.log("File " + file.filename + " has been removed successfully")
    })
  } catch (err) {
    logger.error(err)
  }
}

export const extractRelativePathFromFullPath = (filePath: string) => {
  return filePath.replace(process.cwd() + "/", '');
}

export const extractRelativeDirectoryFromFilePath = (filePath: string, fileName: string) => {
  let path = filePath.replace(process.cwd() + "/", '');
  return path.replace("/" + fileName, '');
}

export const isVideo = (file: Express.Multer.File) => {
  if (file.originalname.match(/\.(mp4|mov|3gp)$/i)) {
    return true;
  }
  return false;
}