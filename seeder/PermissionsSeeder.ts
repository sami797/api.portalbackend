import { Prisma, PrismaClient } from '@prisma/client';
import { camelToSnakeCase, slugify, toSentenceCase } from '../src/helpers/common';
import { permissionSets } from '../src/modules/permissions/permissions.permissions';

const prisma = new PrismaClient();

export const PermissionsSeeder = {
  up: async () => {
    const seederData: Array<Prisma.ModulesCreateInput & { modulePermissions: Array<Prisma.PermissionsCreateInput> }> = [];
    let index = 0;

    for (const [moduleKey, moduleValue] of Object.entries(permissionSets)) {
      let modulePermissions: Array<Prisma.PermissionsCreateInput> = [];
      for (const [permissionKey, permissionValue] of Object.entries(moduleValue)) {
        const modulePermissionsSet = {
          name: (toSentenceCase(camelToSnakeCase(permissionValue))).replace(/-_/g, " "),
          action: permissionValue,
          condition: {},
          Module: { connect: { id: index + 1 } } // Example: connecting with the module ID
        };
        modulePermissions.push(modulePermissionsSet);
      }

      let slug = slugify(moduleKey);
      seederData.push({
        name: toSentenceCase(camelToSnakeCase(moduleKey)),
        slug: slug,
        url: '/siteSettings/' + slug,
        modulePermissions: modulePermissions
      });

      index++;
    }

    const __promises = [];
    for (const ele of seederData) {
      let __n = await prisma.modules.upsert({
        where: { slug: ele.slug },
        update: {},
        create: { name: ele.name, slug: ele.slug, url: ele.url }
      }).catch(err => {
        console.log("Error while seeding Modules and Permissions ", err);
      });

      if (__n) {
        for (const __ele of ele.modulePermissions) {
          await prisma.permissions.upsert({
            where: {
              action_moduleId: {
                moduleId: __n.id,
                action: __ele.action
              }
            },
            create: {
              name: __ele.name,
              action: __ele.action,
              condition: __ele.condition,
              moduleId: __n.id
            },
            update: {}
          });
        }
      }

      __promises.push(__n);
    }
    return Promise.all(__promises);
  }
};
