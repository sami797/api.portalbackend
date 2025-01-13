import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const seederData : Array<Prisma.RoleCreateInput> = [
  {
    title: "System Super User",
    slug: "SUPER-ADMIN",
    description: "This is a super user of the system",
    AddedBy: {
      connect: {
        email: "root@datconsultancy.com"
      }
    }
  },
  {
    title: "System Admin User",
    slug: "SYSTEM-ADMIN",
    description: "This is an admin of the system",
    AddedBy: {
      connect: {
        email: "root@datconsultancy.com"
      }
    }
  },
  {
    title: "Organization Admin",
    slug: "ORG-ADMIN",
    description: "This is an organization admin",
    AddedBy: {
      connect: {
        email: "root@datconsultancy.com"
      }
    }
  },
  {
    title: "Customer",
    slug: "CUSTOMER",
    description: "This is a customer role in the system who has only view access",
    AddedBy: {
      connect: {
        email: "root@datconsultancy.com"
      }
    }
  }
]

export const  RoleSeeder = {

  up : ()  => {
    const __promises = [];
    seederData.forEach(async function(ele){
      let __n =  await prisma.role.upsert({
        where: {slug : ele.slug},
        update: {},
        create: ele
      }).catch(err => {
        console.log("Error while seeding Roles",err);
      })
      __promises.push(__n);
    })
    return Promise.all(__promises);
  }

}

