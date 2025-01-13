import { PrismaClient } from '@prisma/client'
import { CountrySeeder } from './CountrySeeder';
import { RoleSeeder } from './RoleSeeder';

import { PermissionsSeeder } from './PermissionsSeeder';
import { OrganizationSeeder } from './organization/OrganizationSeeder';
import { UserRoleSeeder } from './UserRoleSeeder';
import { UserSeeder } from './user/UserSeeder';
const prisma = new PrismaClient()

async function main() {
  let seedFakers = true;
  // await CountrySeeder.up().then((data) =>  { console.log("Country Seeding Completed.", data.length)});;
  // await OrganizationSeeder.up(seedFakers).then((data) =>  { console.log("Organization Seeding Completed.", data.length)});
  // await UserSeeder.up(seedFakers).then((data) =>  { console.log("Users Seeding Completed.", data.length)});;
  // await RoleSeeder.up().then((data) =>  { console.log("Roles Seeding Completed.", data.length)});;
  // await UserRoleSeeder.up().then((data) =>  { console.log("User Roles Seeding Completed.", data.length)});;
  await PermissionsSeeder.up().then((data) =>  { console.log("Permissions Seeding Completed.", data.length)});;
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })