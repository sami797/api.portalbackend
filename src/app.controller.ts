import { Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from "express";
import { AppService } from './app.service';
import { Public } from './authentication/public-metadata';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(@Req() req: Request): string {
    console.log("In Get Hello");
    console.log("Body", req.body);
    console.log("Params", req.params);
    console.log("Query", req.query);
    return this.appService.getHello();
  }


  @Public()
  @Get('biometrics-test')
  getTest(@Req() req: Request): string {
    console.log("In biometrics-test get");
    console.log("Body", req.body);
    console.log("Params", req.params);
    console.log("Query", req.query);
    return this.appService.getHello();
  }

  @Public()
  @Post('biometrics-test')
  postHello(@Req() req: Request): string {
    console.log("In biometrics-test post");
    console.log("Body", req.body);
    console.log("Params", req.params);
    console.log("Query", req.query);
    return this.appService.getHello();
  }
}
