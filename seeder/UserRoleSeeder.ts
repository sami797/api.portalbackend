import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const seederData : Array<Prisma.UserRoleCreateInput> = [
  {
    User: {
      connect: {
        email: "root@datconsultancy.com"
      }
    },
    Role: {
      connect: {
        slug: "SUPER-ADMIN"
      }
    }
  },
  {
    User: {
      connect: {
        email: "yogen.pokhrel@datconsultancy.com"
      }
    },
    Role: {
      connect: {
        slug: "SYSTEM-ADMIN"
      }
    }
  },
  {
    User: {
      connect: {
        email: "dikshya@yallahproperty.com"
      }
    },
    Role: {
      connect: {
        slug: "ORG-ADMIN"
      }
    }
  },
  {
    User: {
      connect: {
        email: "james@gmail.com"
      }
    },
    Role: {
      connect: {
        slug: "CUSTOMER"
      }
    }
  },
]
export const  UserRoleSeeder = {

  up : ()  => {
    const __promises = [];
    seederData.forEach(async function(ele){
      let dt = await prisma.userRole.findFirst({where: {User: {email: ele.User.connect.email}, Role: {slug: ele.Role.connect.slug}}});
      if(!dt){
        let __n =  await prisma.userRole.create({
          data: ele
        }).catch(err => {
          console.log("Error while seeding User Roles",err);
        })
        __promises.push(__n);
      }
    })
    return Promise.all(__promises);
  }

}

