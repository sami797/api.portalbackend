import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma.service';
import { RoleService } from './role.service';
import { moduleName, recordsMockup, oneItemOfRecordsMockup, db} from "./test-data";

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, {
        provide: PrismaService,
        useValue: db
      }],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // describe('findAll', () => {
  //   it(`should return an array of ${moduleName}`, async () => {
  //     const records = await service.findAll();
  //     expect(records).toEqual(recordsMockup);
  //   });
  // });

});
