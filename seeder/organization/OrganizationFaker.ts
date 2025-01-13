import { Prisma } from "@prisma/client";

export const organizationFaker: Array<Prisma.XOR<Prisma.OrganizationCreateInput, Prisma.OrganizationUncheckedCreateInput>> = [
    {
        email: "info@homes4life.com",
        phone: "509826068",
        phoneCode: "971",
        address: "Town Square Dubai",
        logo: "public/agents/2.jpg",
        Country: {
            connect: {
                isoCode: 'AE'
            }
        },
        locationMap: "https://www.google.com/maps/place/DAT+Engineering+Consultancy/@25.1887385,55.2648997,17z/data=!3m1!4b1!4m5!3m4!1s0x3e5f694b6c18b021:0x69274a387c7699f7!8m2!3d25.1887385!4d55.2670884",
        name: "Homes 4 Life - Town Square",
    },
    {
        email: "info@famproperties.com",
        phone: "509826068",
        phoneCode: "971",
        address: "Building 13, Office 303 & 304, Bay Square, Business Bay, Burj Khalifa District P.O.Box 215088 Dubai",
        logo: "public/agents/8.jpg",
        Country: {
            connect: {
                isoCode: 'AE'
            }
        },
        locationMap: "https://www.google.com/maps/place/DAT+Engineering+Consultancy/@25.1887385,55.2648997,17z/data=!3m1!4b1!4m5!3m4!1s0x3e5f694b6c18b021:0x69274a387c7699f7!8m2!3d25.1887385!4d55.2670884",
        name: "Fam Properties - Branch 14",
    }
]