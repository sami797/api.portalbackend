import { Body, Controller, Get, HttpException, Logger, Param, Patch, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { Public } from 'src/authentication/public-metadata';
import { TokenService } from 'src/authentication/token.service';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { getFileStream } from 'src/helpers/file-management';
import { JwtToken } from './dto/jwt-token.dto';
import { ResourcesPermissionSet } from './resources.permissions';
import { ResourcesService } from './resources.service';
import { readFileSync, writeFileSync } from "fs";
import { SitemapDto } from './dto/sitemap.dto';
import { TypeFromEnumValues } from 'src/helpers/common';
import { ResourcesLocation } from 'src/config/constants';

@ApiTags("resources")
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly authorizationService: AuthorizationService,
    private readonly tokenService: TokenService
  ) { }

  @Public()
  @ApiOperation({ summary: "Fetch All Files" })
  @Get('all/*')
  async fetchResources(
    @Res() res,
    @Param() params,
    @Query() jwtToken: JwtToken,
    @Req() req: any
  ) {
    try {
      const key = params[0];
      if (!key) {
        return res.status(400).json({ msg: "Key not found", statusCode: 404 })
        
      }
      const fileLocationParts = key.split('/');
      const accessType = fileLocationParts[0];
      const resourceType = fileLocationParts[1] as keyof typeof ResourcesLocation
      let skipPermissionCheck = false;
      if (accessType === "public") {
        skipPermissionCheck = true;
      }else{
        if(!ResourcesLocation[resourceType]){
          throw {
            message: "Unknown resource type",
            statusCode: 400
          }
        }
      }

      if (!skipPermissionCheck) {
        if (jwtToken.authKey) {
          try {
            const payload = await this.tokenService.verifyUserToken(jwtToken.authKey, true);
            req.user = payload;
          } catch (err) {
            throw { message: err.message, statusCode: 401 }
          }
        } else {
          return res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
          ;
        }

        if (!req.user) {
          return res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
          
        }

        await this.resourcesService.checkResourcePermission(req.user, key, resourceType)

      }
      if(jwtToken.download){
      res.setHeader('Content-Disposition', `attachment; filename=${fileLocationParts[fileLocationParts.length - 1]}`);
      }
      const readStream = getFileStream(key);

      if (!readStream) {
        return res.status(400).json({message: "Could not read file", statusCode: 400})
      }

      let responseSent = false;
      readStream.on('error', error => {
        console.log("Error while streaming file", error?.message)
        if (!responseSent) {
          responseSent = true;
          let response: ResponseError = { message: "File not found", statusCode: 400, data: {} }
          return res.status(400).json(response)
        }
      });

      readStream.on('end', () => {
        if (!responseSent) {
          responseSent = true;
        }
      });

      return readStream.pipe(res)
    } catch (err) {
      let logger = new Logger("ResourceFetchAppModule");
      logger.error("Some error while reading file", err);
      let response: ResponseError = { message: err.message ? err.message : "File not found", statusCode: err.statusCode ? err.statusCode : 400, data: {} }
      return res.status((err.statusCode ? err.statusCode: 400)).json(response)
    }
  }

  @Public()
  @ApiOperation({ summary: "This API is deprecated. Please use all/* API insted", deprecated: true })
  @Get('project-resources/*')
  async fetchProjectResources(
    @Res() res,
    @Param() params,
    @Query() jwtToken: JwtToken,
    @Req() req: any
  ) {
    try {

      if (jwtToken.authKey) {
        try {
          const payload = await this.tokenService.verifyUserToken(jwtToken.authKey, false);
          req.user = payload;
        } catch (err) {
          throw { message: err.message, statusCode: 401 }
        }
      } else {
        res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
        return;
      }

      if (!req.user) {
        res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
        return
      }

      const key = params[0];
      if (!key) {
        res.status(400).json({ msg: "Key not found", statusCode: 404 })
        return
      }

      await this.authorizationService.checkIfUserCanReadProjectResources(req.user, key);
      const readStream = getFileStream(key);
      readStream.on('error', error => {
        let response: ResponseError = { message: "File not found", statusCode: 400, data: {} }
        res.status(400).json(response)
      });
      readStream.pipe(res)
    } catch (err) {
      let logger = new Logger("ResourceFetchAppModule");
      logger.error("Some error while reading file", err);
      let response: ResponseError = { message: err.message ? err.message : "File not found", statusCode: err.statusCode ? err.statusCode : 400, data: {} }
      res.status(400).json(response)
    }
  }

  @Public()
  @ApiOperation({ summary: "This API is deprecated. Please use all/* API insted", deprecated: true  })
  @Get('task-resources/*')
  async fetchTaskResources(
    @Res() res,
    @Param() params,
    @Query() jwtToken: JwtToken,
    @Req() req: any
  ) {
    try {

      if (jwtToken.authKey) {
        try {
          const payload = await this.tokenService.verifyUserToken(jwtToken.authKey, false);
          req.user = payload;
        } catch (err) {
          throw { message: err.message, statusCode: 401 }
        }
      } else {
        res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
        return;
      }

      if (!req.user) {
        res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
        return
      }

      const key = params[0];
      if (!key) {
        res.status(400).json({ msg: "Key not found", statusCode: 404 })
        return
      }

      await this.authorizationService.checkIfUserCanReadTaskResources(req.user, key);
      const readStream = getFileStream(key);
      readStream.on('error', error => {
        let response: ResponseError = { message: "File not found", statusCode: 400, data: {} }
        res.status(400).json(response)
      });
      readStream.pipe(res)
    } catch (err) {
      let logger = new Logger("ResourceFetchAppModule");
      logger.error("Some error while reading file", err);
      let response: ResponseError = { message: err.message ? err.message : "File not found", statusCode: err.statusCode ? err.statusCode : 400, data: {} }
      res.status(400).json(response)
    }
  }


  @Public()
  @ApiOperation({ summary: "This API is deprecated. Please use all/* API insted",  deprecated: true  })
  @Get('organization-resources/*')
  async fetchOrganizationResources(
    @Res() res,
    @Param() params,
    @Query() jwtToken: JwtToken,
    @Req() req: any
  ) {
    try {

      if (jwtToken.authKey) {
        try {
          const payload = await this.tokenService.verifyUserToken(jwtToken.authKey, false);
          req.user = payload;
        } catch (err) {
          throw { message: err.message, statusCode: 401 }
        }
      } else {
        res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
        return;
      }

      if (!req.user) {
        res.status(403).json({ msg: "Forbidden resource", statusCode: 403 })
        return
      }

      const key = params[0];
      if (!key) {
        res.status(400).json({ msg: "Key not found", statusCode: 404 })
        return
      }

      await this.authorizationService.checkIfUserCanReadOrganzationResources(req.user, key);
      const readStream = getFileStream(key);
      readStream.on('error', error => {
        let response: ResponseError = { message: "File not found", statusCode: 400, data: {} }
        res.status(400).json(response)
      });
      readStream.pipe(res)
    } catch (err) {
      let logger = new Logger("ResourceFetchAppModule");
      logger.error("Some error while reading file", err);
      let response: ResponseError = { message: err.message ? err.message : "File not found", statusCode: err.statusCode ? err.statusCode : 400, data: {} }
      res.status(400).json(response)
    }
  }

  @CheckPermissions(ResourcesPermissionSet.READ)
  @ApiOperation({ summary: `Read sitemap.xml file` })
  @ApiResponse({ status: 200, isArray: false, description: `Read sitemap.xml file` })
  @Get('read-sitemap')
  async readSitemapFile(): Promise<ResponseSuccess | ResponseError> {
    try {
      let filePath = "/var/www/html/yallahproperty.com/sitemap.xml";
      let sitemap: string;
      try {
        sitemap = readFileSync(filePath, { encoding: 'utf-8' });
      } catch (err) {
        console.log("Error while reading sitemap", err.message);
      }
      return { message: `Read sitemap.xml file`, statusCode: 200, data: sitemap };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ResourcesPermissionSet.UPDATE)
  @ApiOperation({ summary: `Read sitemap.xml file` })
  @ApiResponse({ status: 200, isArray: false, description: `Read sitemap.xml file` })
  @Patch('update-sitemap')
  async updateSitemapFile(
    @Body() sitemapDto: SitemapDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filePath = "/var/www/html/yallahproperty.com/sitemap.xml";
      try {
        writeFileSync(filePath, sitemapDto.data);
      } catch (err) {
        console.log("Error while writing sitemap", err.message);
      }
      return { message: `Sitemap file updated successfully`, statusCode: 200, data: {} };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
