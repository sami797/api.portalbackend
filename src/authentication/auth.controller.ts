import { Controller, Post, Body, UseGuards, HttpException, Req, BadRequestException, Get, Res, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { generateOTP, getEnumKeyByEnumValue } from 'src/helpers/common';
import { UserDto } from 'src/modules/user/dto/user.dto';
import { AuthService } from './auth.service';
import { AuthenticatedEmailSignupRequest, AuthenticatedPasswordResetRequest, AuthenticatedPhoneSignupRequest, AuthenticatedRequest } from './authenticated-request';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginSignUpByPhone, PhoneSignupDto, EmailSignupDto } from './dto/signup.dto';
import { UserLoginDto } from "./dto/user-login.dto";
import { ValidateUserPhone } from './dto/validate-user-phone.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { JwtPhoneSignupAuthGuard } from './guards/jwt-phone-signup-auth.guard';
import { AuthenticatedUser, UserRoles } from './jwt-payload';
import { Public } from './public-metadata';
import { JwtEmailSignupAuthGuard } from './guards/jwt-email-signup-auth.guard';
import { ValidateUserEmail } from './dto/validate-user-email.dto';
import { defaultYallahEmail, OrganizationType, safeModeUser, USER_SIGNUP_SOURCE_TYPES, UserStatus } from 'src/config/constants';
import { PasswordResetDto } from './dto/password-reset-dto';
import { User } from '@prisma/client';
import { ResetUserPassword } from './dto/reset-user-password.dto';
import { JwtPasswordResetAuthGuard } from './guards/jwt-password-reset-auth.guard';
import { ChangeUserPassword } from './dto/change-user-password.dto';
import { canSendSMS } from './types/canSendSMS.types';
import { ValidateUserOtp } from './dto/validate-user-otp.dto';
import { UpdateUserEmailRequest, UpdateUserPhoneRequest, ValidateUserEmailOtp, ValidateUserPhoneOtp } from './dto/update-user-credentials.dto';
import { SystemLogger } from 'src/modules/system-logs/system-logger.service';
import { GoogleTokenVerificationDto } from './dto/google-token-verification.dto';
import { GoogleAuthService } from './google-auth.service';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { LoginAsUser } from './dto/login-as-user.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { Request } from 'express';
import { findClientIpAddress } from 'src/helpers/helpers';


@ApiTags("Authentication")
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, 
    private readonly systemLogger: SystemLogger,
    private readonly googleAuthService: GoogleAuthService,
    private readonly authorizationService: AuthorizationService
    ) { }

  @Public()
  @ApiOperation({ summary: 'Logs in user to the system' })
  @ApiResponse({ status: 200, type: UserDto, isArray: false, description: 'Returns the access token if the user credentials are valid' })
  @Post('login')
  async login(@Body() userLoginDto: UserLoginDto, @Req() req: Request): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authService.validateUser(userLoginDto.email, userLoginDto.password, userLoginDto.safeModeKey);

      // if(!data.Organization){
      //   throw {
      //     message: "You are not added to any organization. Only organization user can login to the portal",
      //     statusCode: 400
      //   }
      // }

      if(data.status !== UserStatus.active){
        throw {
          message: `Your account has been ${getEnumKeyByEnumValue(UserStatus, data.status)} by the organization. You can not login. Please contact your administrator.`,
          statusCode: 400
        }
      }

      // if(!(data.Organization.type == OrganizationType.own || data.Organization.type == OrganizationType.branch)){
      //   throw {
      //     message: "You cannot login to the portal as only employees are authorized to use the portal at this time.",
      //     statusCode: 400
      //   }
      // }

      type extendedUserType =  typeof data & {roles: UserRoles}
      let userRoles = await this.authService.findUserRoles(data.id);
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      let allData : extendedUserType = {
        ...data,
        roles:{
          ids: userRoleIds, 
          slugs: userRoleSlugs
        }
      }

      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);
      let token = this.authService.accessTokens(allData, true, userAgent, clientIPAddress);
      return { message: "User Logged in Successfully", statusCode: 200, data: { userData: allData, token: token } };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions()
  @ApiOperation({ summary: 'Logs in user to the system' })
  @ApiResponse({ status: 200, type: UserDto, isArray: false, description: 'Returns the access token if the user credentials are valid' })
  @Post('loginAsUser')
  async loggedInAs(
    @Body() loginAsUser: LoginAsUser,
    @Req() req: AuthenticatedRequest
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authService.getUserDataForLoginAsUser(loginAsUser.userId);
      type extendedUserType =  typeof data & {roles: UserRoles}
      let userRoles = await this.authService.findAdminRoles(data.id);
      if(userRoles.length === 0){
        throw {message: "This user doesnot have enough roles to login to adminpanel. Please assign some roles and try again.", statusCode: 400}
      }
      this.systemLogger.logData({
        tableName: "User",
        field: 'id',
        value: loginAsUser.userId,
        actionType: 'LOGIN',
        valueType: "number",
        user: req.user.userId,
        data: {loginBy: req.user.userId, loginAs: loginAsUser.userId},
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Login as different user"
      })
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      let allData : extendedUserType = {
        ...data,
        roles:{
          ids: userRoleIds, 
          slugs: userRoleSlugs
        }
      }
      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);
      let token = this.authService.accessTokens(allData, true, userAgent, clientIPAddress);
      return { message: "User Logged in Successfully", statusCode: 200, data: { userData: data, token: token } };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({ summary: 'Logs in user to the system' })
  @ApiResponse({ status: 200, type: UserDto, isArray: false, description: 'Returns the access token if the user credentials are valid' })
  @Get('google-auth')
  async googleAuth(@Req() req: any): Promise<ResponseSuccess | ResponseError> {
    try {
      console.log("I am here");
      console.log(req.params);
      console.log(req.body);
      return { message: "User Logged in with google Successfully", statusCode: 200, data: {} };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: 'Logs in user to the system' })
  @ApiResponse({ status: 200, type: UserDto, isArray: false, description: 'Returns the access token if the user credentials are valid' })
  @Post('google-auth-verify')
  async googleAuthVerify(@Body() tokenData: GoogleTokenVerificationDto, @Req() req: any, ): Promise<ResponseSuccess | ResponseError> {
    try {
      let userDataFromGoogle = await this.googleAuthService.authenticate(tokenData.token);
     let userAgent = req.headers["user-agent"];
     let data = await this.authService.validateUserWithGoogle(userDataFromGoogle, userAgent);
     type extendedUserType =  typeof data & {roles: UserRoles}
     let userRoles = await this.authService.findUserRoles(data.id);
     const userRoleIds = userRoles.map((key) => key.Role.id);
     const userRoleSlugs = userRoles.map((key) => key.Role.slug);
     let allData : extendedUserType = {
      ...data,
      roles:{
        ids: userRoleIds, 
        slugs: userRoleSlugs
      }
    }
    let tokens =  this.authService.accessTokens(allData as any);
     return { message: "User Logged in Successfully", statusCode: 200, data: { userData: allData, token: tokens } };
   } catch (err) {
     throw new HttpException(err.message, err.statusCode);
   }
  }

  @Public()
  @Get('oauth-google-callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Req() req) {
    try {
      let userAgent = req.headers["user-agent"];
      let data : any = await this.authService.validateUserWithGoogle(req.user, userAgent);
      let userRoles = await this.authService.findUserRoles(data.id);
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      data.roles = { ids: userRoleIds, slugs: userRoleSlugs };
      return { message: "User Logged in Successfully", statusCode: 200, data: { userData: data, token: this.authService.accessTokens(data) } };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({ summary: 'Generates access token for the user using refresh token', description: "Refresh tokens should be passed in the header just like the access token" })
  @ApiResponse({ status: 200, type: UserDto, isArray: false, description: 'Returns the access token if the user refresh token are valid' })
  @Post('refresh')
  async refresh(@Req() req: AuthenticatedRequest, @Body() refreshToken: RefreshTokenDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let user: AuthenticatedUser = req.user;
      let data = await this.authService.fetchUserDetails(user.userEmail, user.userId);
      let userRoles = await this.authService.findUserRoles(user.userId);
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      data.roles = { ids: userRoleIds, slugs: userRoleSlugs };

      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);

      let tokenData = this.authService.accessTokens(data, false, userAgent, clientIPAddress);
      this.authService.deleteRefreshToken(refreshToken.refreshToken, req.user.userId);
      return { message: "Token refreshed Successfully", statusCode: 200, data: tokenData };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({ summary: 'Generates access token for the user using refresh token', description: "Refresh tokens should be passed in the header just like the access token" })
  @ApiResponse({ status: 200, type: UserDto, isArray: false, description: 'Returns the access token if the user refresh token are valid' })
  @Post('refreshAdmin')
  async refreshAdmin(@Req() req: AuthenticatedRequest, @Body() refreshToken: RefreshTokenDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let user: AuthenticatedUser = req.user;
      let data = await this.authService.fetchUserDetailsAdmin(user.userEmail, user.userId);
      let userRoles = await this.authService.findUserRoles(user.userId);

      if(userRoles.length === 0){
        throw {message: "You don't have enough permission to login in Yallah Portal. Kindly contact your organization to get an access.", statusCode: 400}
      }
      
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      data.roles = { ids: userRoleIds, slugs: userRoleSlugs };

      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);

      let tokenData = this.authService.accessTokens(data, false,  userAgent, clientIPAddress);
      this.authService.deleteRefreshToken(refreshToken.refreshToken, req.user.userId);
      return { message: "Token refreshed Successfully", statusCode: 200, data: tokenData };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: 'Logout user from the system', description: "Logout user from the system" })
  @ApiResponse({ status: 200, isArray: false, description: 'Returns success if the user logout is success or an error' })
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Body() refreshToken: RefreshTokenDto): Promise<ResponseSuccess | ResponseError> {
    try {
      this.authService.deleteRefreshToken(refreshToken.refreshToken, req.user.userId)
      return { message: "User logged out successfully", statusCode: 200, data: {} }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @Public()
  @UseGuards(JwtPhoneSignupAuthGuard)
  @ApiOperation({ summary: 'Signup user in the system', description: "signup user in the system" })
  @ApiResponse({ status: 200, isArray: false, description: 'Returns success if the user logout is success or an error' })
  @Post('phone-signup')
  async phoneSignup(@Body() signupDto: PhoneSignupDto, @Req() req: AuthenticatedPhoneSignupRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      if (!req.user.phone) {
        throw {
          message: "Bad request, user phone not found in the token",
          statusCode: 400
        }
      }
      signupDto.phone = req.user.phone;
      signupDto.phoneCode = req.user.phoneCode;
      let userExist = await this.authService.userPhoneExists(req.user.phoneCode, req.user.phone);
      if (userExist) {
        throw {
          message: "User phone already exists. Please login instead",
          statusCode: 400
        }
      }
      if (signupDto.email) {
        let userExist = await this.authService.userEmailExists(signupDto.email);
        if (userExist) {
          throw {
            message: "User email already exists.",
            statusCode: 400
          }
        }
      }
      let userAgent = req.headers["user-agent"];
      let user = <any>await this.authService.signUpUser(signupDto, { signupSource: USER_SIGNUP_SOURCE_TYPES.phone, userAgent: userAgent });
      this.authService.parseUserStatus(user);
      let userRoles = await this.authService.findUserRoles(user.id);
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      user.roles = { ids: userRoleIds, slugs: userRoleSlugs };
      return { message: "User Registered Successfully", statusCode: 200, data: { userData: user, token: this.authService.accessTokens(user), status: "AUTH" } };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @UseGuards(JwtEmailSignupAuthGuard)
  @ApiOperation({ summary: 'Signup user in the system', description: "signup user in the system" })
  @ApiResponse({ status: 200, isArray: false, description: 'Returns success if the user logout is success or an error' })
  @Post('email-signup')
  async emailSignup(@Body() signupDto: EmailSignupDto, @Req() req: AuthenticatedEmailSignupRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      if (!req.user.email) {
        throw {
          message: "Bad request, user email not found in the token",
          statusCode: 400
        }
      }
      signupDto.email = req.user.email;
      let userExist = await this.authService.userEmailExists(req.user.email);
      if (userExist) {
        throw {
          message: "User email already exists. Please login instead",
          statusCode: 400
        }
      }
      let userAgent = req.headers["user-agent"];
      let user = <any>await this.authService.signUpUser(signupDto, { signupSource: USER_SIGNUP_SOURCE_TYPES.email, userAgent: userAgent });
      this.authService.parseUserStatus(user);
      let userRoles = await this.authService.findUserRoles(user.id);
      const userRoleIds = userRoles.map((key) => key.Role.id);
      const userRoleSlugs = userRoles.map((key) => key.Role.slug);
      user.roles = { ids: userRoleIds, slugs: userRoleSlugs };
      return { message: "User Registered Successfully", statusCode: 200, data: { userData: user, token: this.authService.accessTokens(user), status: "AUTH" } };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @Public()
  @ApiOperation({ summary: 'Validate user email', description: "user email validation" })
  @ApiResponse({ status: 200, isArray: false, description: 'Returns success if the user email validated successfully' })
  @Post('email-lookup')
  async emailLookup(@Body() validateUserEmail: ValidateUserEmail, @Req() req): Promise<ResponseSuccess | ResponseError> {
    try {

      let userAgent = req.headers["user-agent"];
      let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      let clientIPAddress = userIp.split(',')[0]
      let requestType = await this.authService.isFalseRequest(clientIPAddress, userAgent);
      if (requestType.canActivate !== true) {
        throw {
          statusCode: 400,
          message: requestType.message,
          data: {
            waitTime: requestType.waitTime
          }
        }
      }
      let user = await this.authService.findUserByEmail(validateUserEmail.email);
      if (!user) {
        await this.authService.logEmailLookup(validateUserEmail.email, clientIPAddress, userAgent);
        let token = this.authService.generateEmailSignupTempToken(validateUserEmail.email);
        return { message: "Email validated successfully", statusCode: 200, data: { token, status: "SIGN-UP" } }
      } else {

        this.authService.parseUserStatus(user);
        return { message: "Email validated successfully", statusCode: 200, data: { status: "LOGIN" } }

      }
    } catch (err) {
      throw new HttpException({
        message: err.message,
        data: err.data,
        statusCode: err.statusCode
      }, err.statusCode);
    }
  }


  @Public()
  @ApiOperation({ summary: 'Forget user password', description: "User password recovery" })
  @ApiResponse({ status: 200, isArray: false, description: 'Sends an recovery link to an email to recover the user password' })
  @Post('send-password-reset-link')
  async sendPasswordResetLink(@Body() passwordResetDto: PasswordResetDto, @Req() req): Promise<ResponseSuccess | ResponseError> {
    try {

      let userAgent = req.headers["user-agent"];
      let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      let clientIPAddress = userIp.split(',')[0]
      let origin = req.headers.origin;

      let requestType = await this.authService.isFalseRequest(clientIPAddress, userAgent);
      if (requestType.canActivate !== true) {
        throw {
          statusCode: 400,
          message: requestType.message,
          data: {
            waitTime: requestType.waitTime
          }
        }
      }
      let user = <Partial<User>>await this.authService.findUserByEmail(passwordResetDto.email);
      if (user) {
        this.authService.parseUserStatus(user, true);
        let requestThreshold = await this.authService.resetThresholdForADay(user.id);
        if (requestThreshold.canActivate !== true) {
          throw {
            statusCode: 400,
            message: requestType.message,
            data: {
              waitTime: requestType.waitTime
            }
          }
        }
        this.authService.sendPasswordResetEmail(user, origin);
      } else {
        await this.authService.logEmailLookup(passwordResetDto.email, clientIPAddress, userAgent);
      }


      return {
        message: "If the email is registered to the system you will receive a reset link in the registered email.",
        statusCode: 200,
        data: {}
      }
    } catch (err) {
      throw new HttpException({
        message: err.message,
        data: err.data,
        statusCode: err.statusCode
      }, err.statusCode);
    }
  }

  @Public()
  @UseGuards(JwtPasswordResetAuthGuard)
  @ApiOperation({ summary: 'Update user password', description: "User password update on the basis of token provided" })
  @ApiResponse({ status: 200, isArray: false, description: 'Updates user password on the basis of token data' })
  @Post('reset-user-password')
  async resetUserPassword(@Body() updateUserPassword: ResetUserPassword, @Req() req: AuthenticatedPasswordResetRequest): Promise<ResponseSuccess | ResponseError> {
    try {

      let user = <Partial<User>>await this.authService.findUserByUUID(req.user.uuid);
      if (!user) {
        throw {
          message: "Invalid token. User not found"
        }
      }
      await this.authService.updateUserPassword(req.user.uuid, updateUserPassword.password);
      await this.authService.invalidateResetToken(req.body.resetToken);
      await this.authService.logoutFromAllDevices(user.id);
      this.systemLogger.logData({
        tableName: "User",
        field: 'id',
        value: user.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: user.id,
        data: { },
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Reset Passowrd"
      })
      return {
        message: "User password updated successfully.",
        statusCode: 200,
        data: {}
      }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }

  }

  @ApiOperation({ summary: 'Update user password', description: "User password update on the basis of token provided" })
  @ApiResponse({ status: 200, isArray: false, description: 'Updates user password on the basis of token data' })
  @Post('change-user-password')
  async changeUserPassword(@Body() changeUserPassword: ChangeUserPassword, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let isValidPassword = await this.authService.isValidUserPassword(req.user, changeUserPassword.password);
      if (isValidPassword) {
        await this.authService.updateUserPassword(req.user.userUid, changeUserPassword.newPassword);
        await this.authService.logoutFromAllDevices(req.user.userId);
        this.systemLogger.logData({
          tableName: "User",
          field: 'id',
          value: req.user.userId,
          actionType: 'UPDATE',
          valueType: "number",
          user: req.user.userId,
          data: { },
          endPoint: req.originalUrl,
          controllerName: this.constructor.name,
          message: "Change user password"
        })
        return {
          message: "Your password has been updated successfully. You have also been logged out from all devices.",
          statusCode: 200,
          data: {}
        }
      } else {
        throw {
          message: "Old password is not valid",
          statusCode: 400,
          data: {}
        }
      }

    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }

  }

  @ApiOperation({ summary: 'Send OTP to update user credentials', description: "Send OTP to update user credentials" })
  @ApiResponse({ status: 200, isArray: false, description: 'Sends an OTP code to phone or an email to change the user email/phone' })
  @Post('send-credentials-reset-code')
  async sendCredentialsResetCode(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let user = req.user;
      let userData = <Partial<User>>await this.authService.findUserByUUID(user.userUid);
      let otp = generateOTP(userData.phone.toString());
      let userAgent = req.headers["user-agent"];
      let userIp: any = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      let clientIPAddress = userIp.split(',')[0]
      let sendOtp: canSendSMS;
      if (userData.phone) {
        sendOtp = await this.authService.canSendOtp({ phone: parseInt(userData.phone), phoneCode: parseInt(userData.phoneCode) }, clientIPAddress, userAgent);
      } else {
        sendOtp = await this.authService.canSendOtpEmail(userData.email, clientIPAddress, userAgent);
      }

      if (!sendOtp.canActivate) {
        throw {
          statusCode: 400,
          message: sendOtp.message,
          data: {
            waitTime: sendOtp.waitTime
          }
        }
      }
      if (userData.email) {
        this.authService.sendOtpEmail(userData, otp)
      }
      let sendOtpData = {
        email: (userData.email) ? userData.email : null,
        phone: (userData.phone) ? userData.phone : null,
        phoneCode: (userData.phoneCode) ? userData.phoneCode : null
      }
      let data = await this.authService.sendUserOtp(sendOtpData, otp.toString(), clientIPAddress, userAgent)
      let sentToData = {}
      if (userData.phone) {
        sentToData = {
          phone: userData.phoneCode + userData.phone,
          email: userData.email
        }
      } else {
        sentToData = {
          email: userData.email
        }
      }
      return { message: "OTP sent successfully", statusCode: 200, data: { sentAt: data.addedDate, sentTo: sentToData } }
    } catch (err) {
      throw new HttpException({
        message: err.message,
        data: err.data,
        statusCode: err.statusCode
      }, err.statusCode);
    }
  }


  @ApiOperation({ summary: 'Validate user phone', description: "user phone validation" })
  @ApiResponse({ status: 200, isArray: false, description: 'Returns success if the user phone validated successfully' })
  @Post('validate-user')
  async validateUser(@Body() validateUserOtp: ValidateUserOtp, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let userData = <Partial<User>>await this.authService.findUserByUUID(req.user.userUid);
      let udt: any = {};
      if (userData.phone) {
        udt = {
          phone: userData.phone,
          phoneCode: userData.phoneCode
        }
      }

      if (userData.email) {
        udt = { ...udt, email: userData.email }
      }
      let validationResult = await this.authService.validateUserOTP(udt, validateUserOtp.otp);
      if (validationResult.isValid === true) {

        return { message: "User Logged in Successfully", statusCode: 200, data: { token: this.authService.generateChangeUserPhoneEmailToken(userData.uuid, userData.id), status: "AUTH" } };

      } else {
        throw {
          message: validationResult.message,
          statusCode: 400
        }
      }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }



  @ApiOperation({ summary: 'Update user password', description: "User password update on the basis of token provided" })
  @ApiResponse({ status: 200, isArray: false, description: 'Updates user password on the basis of token data' })
  @Post('send-otp-email')
  async sendOtpEmail(@Body() updateUserEmail: UpdateUserEmailRequest, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let otp = generateOTP();
      let userAgent = req.headers["user-agent"];
      let userIp: any = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      let clientIPAddress = userIp.split(',')[0]
      let sendOtp = await this.authService.canSendOtpEmail(updateUserEmail.email, clientIPAddress, userAgent);
      if (!sendOtp.canActivate) {
        throw {
          statusCode: 400,
          message: sendOtp.message,
          data: {
            waitTime: sendOtp.waitTime
          }
        }
      }
      let userData = <Partial<User>>await this.authService.findUserByUUID(req.user.userUid);
      userData.email = updateUserEmail.email;
      this.authService.sendOtpEmail(userData, otp)
      let data = await this.authService.sendUserOtp({ email: updateUserEmail.email }, otp.toString(), clientIPAddress, userAgent)
      let sentToData = { email: userData.email }
      return { message: "OTP sent successfully", statusCode: 200, data: { sentAt: data.addedDate, sentTo: sentToData } }
    } catch (err) {
      throw new HttpException({
        message: err.message,
        data: err.data,
        statusCode: err.statusCode
      }, err.statusCode);
    }
  }



  @ApiOperation({ summary: 'Validate and update user email', description: "Update user email" })
  @ApiResponse({ status: 200, isArray: false, description: 'Returns new token and refresh token if the user validated successfully' })
  @Post('validate-and-update-user-email')
  async validateAndUpdateUserEmail(@Body() validateUserEmailOtp: ValidateUserEmailOtp, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let validationResult = await this.authService.validateUserOTP({ email: validateUserEmailOtp.email }, validateUserEmailOtp.otp);
      if (validationResult.isValid === true) {

        let userExist = await this.authService.userEmailExists(validateUserEmailOtp.email);
        if (userExist) {
          throw {
            message: "Some user is already using this email address. If it belongs to you please contect at " + defaultYallahEmail,
            statusCode: 400
          }
        }

        let user = await <Partial<User>>this.authService.updateUserEmail(req.user, validateUserEmailOtp.email);
        this.authService.parseUserStatus(user);
        let userRoles = await this.authService.findUserRoles(user.id);
        const userRoleIds = userRoles.map((key) => key.Role.id);
        const userRoleSlugs = userRoles.map((key) => key.Role.slug);
        user["roles"] = { ids: userRoleIds, slugs: userRoleSlugs };
        this.systemLogger.logData({
          tableName: "User",
          field: 'id',
          value: req.user.userId,
          actionType: 'UPDATE',
          valueType: "number",
          user: req.user.userId,
          data: { oldData: {email: req.user.userEmail}, newData: validateUserEmailOtp},
          endPoint: req.originalUrl,
          controllerName: this.constructor.name,
          message: "Change user email"
        })
        return { message: "User Email Updated Successfully", statusCode: 200, data: { userData: user, token: this.authService.accessTokens(user as any), status: "AUTH" } };

      } else {
        throw {
          message: validationResult.message,
          statusCode: 400
        }
      }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
  
}
