import { Test, TestingModule } from '@nestjs/testing';
import { ResponseSuccess } from 'src/common-types/common-types';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { moduleName, recordsMockup, oneItemOfRecordsMockup,db, model} from "./test-data";


describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [RoleService],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // describe('findAll', () => {
  //   it(`Fetch all ${moduleName}`, async () => {
  //     const result:any = { statusCode: 200, message: "Success", data: [] };
  //     const records = await controller.findAll();
  //     jest.spyOn(controller, 'findAll').mockImplementation(() => result);
  //     expect(records).toBe(result);
  //   })
  // })

  // describe('findAll', () => {
  //   it(`Fetch all ${moduleName}`, async () => {
  //     let records = controller.findAll();
  //     const expectedOutput : Partial<ResponseSuccess> = { data: recordsMockup, statusCode: 200};
  //     await expect(controller.findAll()).resolves.toEqual(expect.objectContaining(expectedOutput));
  //   });
  // });



  describe('findOne', () => {
    it(`should get a single ${moduleName}`, async () => {
      const expectedOutput : Partial<ResponseSuccess> = { data: oneItemOfRecordsMockup, statusCode: 200};
      let record = controller.findOne({id:recordsMockup[0].id});
      await expect(record).resolves.toEqual(expect.objectContaining(expectedOutput));

      const expectedOutput2 : Partial<ResponseSuccess> = { data: {}, statusCode: 200};
      let record2 = controller.findOne({id:2000});
      await expect(record2).resolves.toEqual(expect.objectContaining(expectedOutput2));

    });
  });
  

});
