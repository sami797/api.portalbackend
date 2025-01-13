import { BadRequestException } from "@nestjs/common";
import { Transform } from "class-transformer";
import { isNumber } from "class-validator";
import { camelToSnakeCase } from "./common";

export const optionalBooleanMapper = new Map([
  ['undefined', undefined],
  ['true', true],
  ['false', false],
]);

export const ParseBoolean = () =>
  Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1');

export const SlugifyString = (upper: boolean = false, delimeter: string = '-') =>
  Transform(({ value }) => {
    if(typeof value !== "string") throw {message: "Please provide a valid slug. You may have provided multiple values", statusCode: 400}
    let tempSlug = value;
    if(!upper){
      tempSlug = camelToSnakeCase(value);
    }
    tempSlug = tempSlug.replace(/\s/g, delimeter);
    if (upper) {
      tempSlug = tempSlug.toUpperCase();
    } else {
      tempSlug = tempSlug.toLowerCase();
    }
    // tempSlug = tempSlug.replace(/[%'?&*()+=!~@$^{}/;,"']/g, '');
    tempSlug = tempSlug.replace(/[^\w-]+/g, '').replace(/-+/g,delimeter);
    return tempSlug;
  })

export const ParseJson = () =>
  Transform((options: {
    key: string;
    value: string;
    obj: string | Record<string, any>;
  }) => {
    try {
      if(typeof options.value === "object") return options.value;
      return JSON.parse(options.value);
    } catch (e) {
      throw new BadRequestException(`${options.key} contains invalid JSON `);
    }
  })

  export const ParseCustomNumberArray = () => 
  Transform(({key,value}) => {
    if(Array.isArray(value)){
      let temp = [... new Set(value)];
      return temp.map((val) => {if(parseInt(val)) return parseInt(val); else throw new BadRequestException(`Invalid ${key} provided, ${key} must be an integer value`); });
    }
    return parseInt(value);
  })

  export const ParseCustomPropertyId = () => 
  Transform(({key,value}) => {
    if(typeof value === 'number'){
      return value
    }else if(typeof value === 'string'){
      if(value.includes("-")){
        let t = value.split("-");
        if(t[1]){
          return Number(t[1])
        }else{
          throw new BadRequestException(`Provided ${key} is not a valid property ID or Reference number `);
        }
      }else{
        let t = Number(value);
        if(isNumber(t) === true){
          return t;
        }else{
          throw new BadRequestException(`Provided ${key} is not a valid property ID or Reference number `);
        }
      }
    }else{
      throw new BadRequestException(`Provided ${key} is not a valid property ID or Reference number `);
    }
  })


// export function parseJson(options: {
//   key: string;
//   value: string;
//   obj: string | Record<string, any>;
// }): Record<string, any> {
//   try {
//     return JSON.parse(options.value);
//   } catch (e) {
//     throw new BadRequestException(`${options.key} contains invalid JSON `);
//   }
// }
