import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import {allCountries} from "./Country/allCountry";

export const  CountrySeeder = {

  up : ()  => {
    const __promises = [];
    allCountries.forEach(async function(ele){
      let __n = await prisma.country.upsert({
        where: {isoCode : ele.code},
        update: {},
        create: {
          name: ele.name,
          shortName: ele.code,
          isoCode: ele.code,
          displayName: ele.name,
          phoneCode: ele.dial_code,
          flag: ele.emoji
        }
      }).catch(err => {
        console.log("Error while seeding Country ",err);
      })
      __promises.push(__n);
    })
    return Promise.all(__promises);
  }

}

