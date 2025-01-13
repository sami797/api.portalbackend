import { Prisma } from "@prisma/client";

export const moduleName = "Role(s)";
export const model = "role";
export const recordsMockup: Array<Prisma.RoleCreateManyInput> = [
    {
        id: 1,
        title: "Admin",
        slug: "A",
        isPublished: true,
        isDeleted: false
    },
    {
        id: 2,
        title: "Manager",
        slug: "M",
        isPublished: false,
        isDeleted: true
    }
]

export const oneItemOfRecordsMockup = recordsMockup[0];

const findDataById = (id : number) => {
    return recordsMockup.find(e => e.id === id);
}

export const db = {
    [model]: {
        findMany: jest.fn().mockResolvedValue(recordsMockup),
        findUnique: jest.fn().mockResolvedValue(oneItemOfRecordsMockup),
        create: jest.fn().mockReturnValue(oneItemOfRecordsMockup),
        update: jest.fn().mockResolvedValue(oneItemOfRecordsMockup),
        delete: jest.fn().mockResolvedValue(oneItemOfRecordsMockup),

        // Controller Functions
        findAll: jest.fn().mockResolvedValue(recordsMockup),
        findOne: jest.fn().mockImplementation((id: number) => {
            return new Promise((resolve, reject) => {
                const record = findDataById(id)
                if(record){
                    resolve(record)
                }else{
                    reject({statusCode: 400, data: {}})
                }
            })
        }),
    },
};