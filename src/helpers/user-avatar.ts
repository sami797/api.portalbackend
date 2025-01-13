import { createCanvas } from "canvas";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { uploadFile } from "./file-management";

type ColorTypes = {
    primary: string;
    secondary: string;
}
export function createAvatarImage(username: string, fileLocation: string = "public/users/", filename : string) {
    if(!username || !filename) return;
    let user = username.split(" ");
    let imageText = user[0].charAt(0).toUpperCase() + ((user[1]) ? user[1].charAt(0).toUpperCase() : '');

    const width = 256
    const height = 256

    const colors : Array<ColorTypes> = [
        {
            primary: "#1abc9c",
            secondary: "#000000"
        },
        {
            primary: "#2ecc71",
            secondary: "#ffffff"
        },
        {
            primary: "#3498db",
            secondary: "#ffffff"
        },
        {
            primary: "#9b59b6",
            secondary: "#ffffff"
        },
        {
            primary: "#34495e",
            secondary: "#ffffff"
        },
        {
            primary: "#16a085",
            secondary: "#ffffff"
        },
        {
            primary: "#27ae60",
            secondary: "#ffffff"
        },
        {
            primary: "#2980b9",
            secondary: "#ffffff"
        },
        {
            primary: "#8e44ad",
            secondary: "#ffffff"
        },
        {
            primary: "#2c3e50",
            secondary: "#ffffff"
        },
        {
            primary: "#f1c40f",
            secondary: "#000000"
        },
        {
            primary: "#e67e22",
            secondary: "#000000"
        },
        {
            primary: "#000000",
            secondary: "#ffffff"
        },
        {
            primary: "#e74c3c",
            secondary: "#ffffff"
        },
        {
            primary: "#95a5a6",
            secondary: "#000000"
        },
        {
            primary: "#f39c12",
            secondary: "#000000"
        },
        {
            primary: "#d35400",
            secondary: "#ffffff"
        },
        {
            primary: "#c0392b",
            secondary: "#ffffff"
        }
    ]

    let randomColor = colors[Math.floor(Math.random()*colors.length)];

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = randomColor.primary;
    context.arc(128,128,128,0,Math.PI*2, false);
    context.fill()

    context.font = '600 80pt Menlo'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = randomColor.primary

    const text = imageText;

    const textWidth = context.measureText(text).width;
    // context.fillRect(0, 0, textWidth + 20, 40)
    context.fillStyle = randomColor.secondary
    context.fillText(text, width/2, 128)

    const buffer = canvas.toBuffer('image/png');
    let __fileLocation = process.cwd() + "/" + fileLocation;
    if (!existsSync(fileLocation)) {
        mkdirSync(fileLocation, { recursive: true });
      }

    writeFileSync(__fileLocation+"/"+filename, buffer);
    const fileToUpload : Express.Multer.File = {
        fieldname : "",
        filename: filename,
        size : 0,
        encoding: 'utf-8',
        mimetype: "image/png",
        destination: fileLocation,
        path: __fileLocation+"/"+filename,
        originalname: filename,
        stream: undefined,
        buffer: undefined

    }
    uploadFile(fileToUpload);
}