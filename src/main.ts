import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe, VersioningType, VERSION_NEUTRAL } from "@nestjs/common";
import { loggerOptions } from './helpers/helpers';
import { initializeSwagger } from './app-configuration/swagger-configuration';
// import { PrismaService } from './prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request } from "express";
import * as bodyParser from 'body-parser';
const basicAuth = require('express-basic-auth')
const whitelistDomains = [
  'localhost',
  'yallahproperty.ae',
  'admin.yallahproperty.ae',
  'api.yallahproperty.ae',
  'analytics.yallahproperty.ae',
  'sandbox.yallahproperty.ae',
  'sandbox.admin.yallahproperty.ae',
  'sandbox.api.yallahproperty.ae',
]
const whitelistIp = ["54.169.31.224", "172.31.23.152", "94.205.243.22", "2.51.154.3", "::11"];

const getDomainName = (fullUrl: string) => {
  let url = new URL(fullUrl);
  return url.hostname
}

const corsOptionsDelegate = function (req: Request, res, next) {

  if (process.env.ENVIRONMENT === "development") {
    return next()
  }

  let origin = (req.headers.origin) ? getDomainName(req.headers.origin) : "";
  let referer = (req.headers.referer) ? getDomainName(req.headers.referer) : "";
  if (whitelistDomains.includes(origin) || whitelistDomains.includes(referer)) {
    return next();
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let allIp = []
  if (!Array.isArray(ip)) {
    allIp = ip.split(',');
  } else {
    allIp = ip
  }

  for (const __ip of allIp) {
    if (whitelistIp.indexOf(__ip.trim()) !== -1) {
      return next()
    }
  }

  // let logger = new Logger("CORS")
  // logger.error("Blocked by cors policy")
  // logger.error(`Ip Address ${allIp}`);
  // logger.error(`Origin ${origin}`);
  // logger.error(`Referer ${referer}`);
  // res.json({
  //   statusCode: 400,
  //   message: "Blocked by cors policy"
  // })
  return next()

}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: loggerOptions() });

  app.enableCors({
    exposedHeaders: ['Content-Disposition']
  });
  app.use('*', corsOptionsDelegate)

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, exceptionFactory: (errors) => new BadRequestException(errors), }));
  if (process.env.ENVIRONMENT === "development") {
    app.use(['/api-documentation', '/api-documentation-json', '*/templates/*'], basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD,
      },
    }));
    initializeSwagger(app);
  }
  // const prismaService = app.get(PrismaService);
  app.enableShutdownHooks();
  // await prismaService.enableShutdownHooks(app)

  //enable raw body in webhook
  app.use('/xero/webhook', bodyParser.raw({ type: 'application/json' }));

  //remove in production
  app.setViewEngine('ejs');
  //remove upto here

  await app.listen(5569);
}
bootstrap();
