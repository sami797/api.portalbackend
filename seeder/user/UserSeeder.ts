import { Prisma, PrismaClient } from '@prisma/client'
import { userFaker } from './UserFaker'
const prisma = new PrismaClient()
const seederData : Array<Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput >> = [
  {
    firstName: "Super",
    lastName: "User",
    phone: "509826068",
    phoneCode: "971",
    email: "root@datconsultancy.com",
    address: "11b Street, Dubai, UAE",
    password: "$2b$10$Ssf3HDf/EHdiooNpbg3QV.6TGcnV5Wohu/iBnLvVpKhc4mTgSsyIu",//somePassword
    isPublished: true,
    Organization: {
      connect: {
        email: "root@datconsultancy.com"
      }
    }
  },
  {
    firstName: "Yogen",
    lastName: "Pokhrel",
    phone: "509826068",
    phoneCode: "971",
    email: "yogen.pokhrel@datconsultancy.com",
    address: "11b Street, Dubai, UAE",
    password: "$2b$10$Ssf3HDf/EHdiooNpbg3QV.6TGcnV5Wohu/iBnLvVpKhc4mTgSsyIu",//somePassword
    isPublished: true,
    Organization: {
      connect: {
        email: "info@datconsultancy.com"
      }
    }
  }
]
export const  UserSeeder = {

  up : (faker: boolean = true)  => {
    const __promises = [];
    let seeds = seederData
    if(faker){
      seeds = [...seeds, ...userFaker]
    }
    seeds.forEach(async function(ele){
      let __n = await prisma.user.upsert({
        where: {email : ele.email},
        update: {},
        create: ele
      }).catch(err => {
        console.error("Error while seeding User",err.message);
      })
      __promises.push(__n);
    })

    return Promise.all(__promises);
  }

}

