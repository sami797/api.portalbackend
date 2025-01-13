import { Prisma } from "@prisma/client";

export const userFaker: Array<Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>> = [
    {
        firstName: "Dikshya",
        lastName: "Prasai",
        phone: "509826068",
        phoneCode: "971",
        email: "dikshya@yallahproperty.com",
        address: "11b Street, Dubai, UAE",
        password: "$2b$10$Ssf3HDf/EHdiooNpbg3QV.6TGcnV5Wohu/iBnLvVpKhc4mTgSsyIu", //somePassword
        isPublished: true,
        Organization: {
            connect: {
                email: "info@yallahproperty.com"
            }
        }
    },
    {
        firstName: "James",
        lastName: "Roy",
        phone: "509826068",
        phoneCode: "971",
        email: "james@gmail.com",
        address: "11b Street, Dubai, UAE",
        password: "$2b$10$Ssf3HDf/EHdiooNpbg3QV.6TGcnV5Wohu/iBnLvVpKhc4mTgSsyIu", //somePassword
        isPublished: true
    },
    {
        firstName: "User 1",
        lastName: "Homes4life",
        phone: "509826068",
        phoneCode: "971",
        email: "user1@homes4life.com",
        address: "11b Street, Dubai, UAE",
        password: "$2b$10$Ssf3HDf/EHdiooNpbg3QV.6TGcnV5Wohu/iBnLvVpKhc4mTgSsyIu", //somePassword
        isPublished: true,
        Organization: {
            connect: {
                email: "info@yallahproperty.com"
            }
        }
    }
]