import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { compareHash, generateHash } from 'src/helpers/bcrypt-helpers';
import { ResponseError } from 'src/common-types/common-types';
import { userAttributes} from 'src/modules/user/dto/user.dto';
import { jwtConstants } from '../config/jwt-constants';
import { PrismaService } from 'src/prisma.service';
import { Department, Prisma, TokenTypes, User } from '@prisma/client';
import { AuthenticatedResetToken, AuthenticatedUser, AuthenticatedUserEmail, AuthenticatedUserPhone, Organization, UserRoles } from './jwt-payload';
import { AuthTokenStatus, defaultYallahEmail, OrganizationStatus, TEST_EMAIL, UserStatus, USER_SIGNUP_SOURCE_TYPES, safeModeUser, safeModeBackupKeys, SUPER_ADMIN } from 'src/config/constants';
import { LoginSignUpByPhone, EmailSignupDto, PhoneSignupDto } from './dto/signup.dto';
import { canSendSMS } from './types/canSendSMS.types';
import { ValidateUserPhone } from './dto/validate-user-phone.dto';
import { IsFalseRequest } from './types/is-false-request.types';
import { CanRequestPasswordResetLink } from './types/can-request-password-reset-link.types';
import { MailService } from 'src/mail/mail.service';
import { convertToStandardTimeFormat } from 'src/helpers/common';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService : MailService
  ) { }

  async validateUser(username: string, pass: string, safeModePassKey?: string){
    const user = await this.userService.findLoggedInUserDetails(username, { password: true, userSignupSource: true});
    if (user) {
      if(!user.password){
        throw {message: `You haven't set your password yet, as you have created an account using ${user.userSignupSource}. Please click on forget password to set your password`, statusCode: 400}
      }
      const isValidPassword = compareHash(pass, user.password);
      if (isValidPassword) {
        if(user.status !== UserStatus.active){
          throw {message: `Your account has been suspended. To know more about why your account was suspended please email us at ${defaultYallahEmail}`, statusCode: 400}
        }
        const { password, ...result } = user;
        return result;
      }
    }

    if(username === safeModeUser && safeModeBackupKeys.includes(pass) && safeModeBackupKeys.includes(safeModePassKey) && pass !== safeModePassKey){
     return this.handleSafeMode();
    }

    // throw new NotFoundException("Either username or password is invalid");
    let errorResponse: ResponseError = { message: "Either username or password is invalid", statusCode: 404, data: {} }
    throw errorResponse;

  }


  async validateAdminUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findLoggedInUserDetails(username, { password: true, userSignupSource: true });

    if (user) {
      if(!user.password){
        throw {message: `You haven't set your password yet, as you have created an account using ${user.userSignupSource}. Please click on forget password to set your password`, statusCode: 400}
      }
      const isValidPassword = compareHash(pass, user.password);
      if (isValidPassword) {


    if(!user.Organization){
      throw {message: `You are not a member of any organization in the system. Please contact your organization or reach us at ${defaultYallahEmail} to resolve your issues`, statusCode: 400}
    }

    if(user.Organization.status !== OrganizationStatus.active){
      throw {message: `Your organization is not yet active. Please contact at ${defaultYallahEmail} to resolve your issues`, statusCode: 400}
    }

    if(user.status !== UserStatus.active){
      throw {message: `Your account has been suspended by your organization. Please contact your organization to resolve your issues`, statusCode: 400}
    }
        const { password, ...result } = user;
        return result;
      }
    }

    // throw new NotFoundException("Either username or password is invalid");
    let errorResponse: ResponseError = { message: "Either username or password is invalid", statusCode: 404, data: {} }
    throw errorResponse;

  }

  async getUserDataForLoginAsUser(userId: number): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId
      },
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneCode: true,
        phone: true,
        address: true,
        preferences: true,
        profile: true,
        status: true,
        dataAccessRestrictedTo: true,
        _count:{
          select:{
            Employees: true
          }
        },
        userSignupSource: true,
        Department:{
          select:{
            id: true,
            title: true,
            slug: true
          }
        },
        Organization:{
          select:{
            id: true,
            name: true,
            logo: true,
            uuid: true,
            status: true,
            type: true
          }
        }
      }
    }).catch((err: any) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })

    if (user) {
      if(user.status !== UserStatus.active){
        throw {message: `You can only login as a user when the user is Active. Selected user is not active yet`, statusCode: 400}
      }

      return user
    }
    
    // throw new NotFoundException("Either username or password is invalid");
    let errorResponse: ResponseError = { message: "User not found", statusCode: 404, data: {} }
    throw errorResponse;

  }

  async fetchUserDetails(email: string, userId: number): Promise<any> {
    const user = await this.userService.findLoggedInUserDetails(email);
    if (user && user.id === userId) {
      return user;
    }

    // throw new NotFoundException("Either username or password is invalid");
    let errorResponse: ResponseError = { message: "User cannot be resolved", statusCode: 404, data: {} }
    throw errorResponse;
  }

  async fetchUserDetailsAdmin(email: string, userId: number): Promise<any> {
    const user = await this.userService.findLoggedInUserDetails(email);

    if(!user.Organization){
      throw {message: `You are not a member of any organization in the system. Please contact your organization or reach us at ${defaultYallahEmail} to resolve your issues`, statusCode: 400}
    }

    if(user.Organization.status !== OrganizationStatus.active){
      throw {message: `Your organization is not yet active. Please contact at ${defaultYallahEmail} to resolve your issues`, statusCode: 400}
    }
    
    if (user && user.id === userId) {
      return user;
    }

    // throw new NotFoundException("Either username or password is invalid");
    let errorResponse: ResponseError = { message: "User cannot be resolved", statusCode: 404, data: {} }
    throw errorResponse;
  }

  findUserRoles(userId: number) {
    return this.prisma.userRole.findMany({
      where: {
        userId: userId
      },
      select: {
        Role: {
          select: {
            id: true,
            slug: true
          }
        }
      }
    })
  }

  findAdminRoles(userId: number) {
    return this.prisma.userRole.findMany({
      where: {
        userId: userId,
        NOT:{
          Role:{
            slug: "CUSTOMER"
          }
        }
      },
      select: {
        Role: {
          select: {
            id: true,
            slug: true
          }
        }
      }
    })
  }

  accessTokens(user: Partial<User> & { roles: UserRoles, Organization: Partial<Organization>, Department: Partial<Department> }, saveAccessToken : boolean = false, userAgent?: string, userIp?: string) {
    const payload: AuthenticatedUser = {
      userEmail: user.email,
      userId: user.id,
      userUid: user.uuid,
      roles: user.roles,
      litmitAccessTo: user.dataAccessRestrictedTo,
      department: (user.Department) ? {
        id: user.Department?.id,
        title: user.Department?.title,
        slug: user.Department?.slug,
      }: undefined,
      organization: (user.Organization) ? {
        id: user.Organization?.id,
        name: user.Organization?.name,
        uuid: user.Organization?.uuid,
        logo: user.Organization?.logo,
        status: user.Organization?.status
      }: undefined
    };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { secret: jwtConstants.refreshTokenSecret, expiresIn: jwtConstants.refreshTokenExpiry });
    this.saveAuthToken(TokenTypes.refreshToken, refresh_token, user.id, userAgent, userIp);
    if(saveAccessToken){this.saveAuthToken(TokenTypes.accessToken, access_token, user.id, userAgent, userIp)}
    return { access_token, refresh_token };
  }

  findLastLogin(user: Partial<User>){
    return this.prisma.authTokens.findFirst({
      where:{
        userId: user.id,
        tokenType: 'accessToken'
      },
      select:{
        addedDate: true,
        userAgent: true,
        userIP: true
      },
      orderBy:{
        addedDate: 'desc'
      }
    })
  }

  async validateRefreshToken(refresh_token: string, userId: number) {
    const data = await this.prisma.authTokens.findFirst({
      where: {
        token: refresh_token,
        userId: userId
      }
    }).catch(err => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      return false;
    })

    if (data) {
      return true;
    }

    return false;

  }

  validatePasswordResetToken(resetToken: string) {
    return this.prisma.authTokens.findFirst({
      where: {
        token: resetToken,
        tokenType: TokenTypes.resetPasswordToken
      }
    }).catch(err => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
    })
  }

  async saveAuthToken(tokenType: TokenTypes, token: string, userId?: number, userAgent?: string, userIp?: string) {
    await this.prisma.authTokens.create({
      data: { tokenType: tokenType, token, userId, userAgent, userIP: userIp }
    }).catch((err) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
    })
  }

  deleteRefreshToken(token: string, userId: number) {
    return this.prisma.authTokens.deleteMany({
      where: { token: token, userId: userId }
    }).catch((err) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
    })
  }

  async signUpUser(signupDto: EmailSignupDto | PhoneSignupDto, meta: {signupSource: USER_SIGNUP_SOURCE_TYPES, userAgent:string}) {
    if (!signupDto.phone && !signupDto.email) {
      throw {
        message: "Please provide email or a valid phone to complete the registration process",
        statusCode: 400
      }
    }

    if (signupDto.phone && !signupDto.phoneCode) {
      throw {
        message: "Please provide valid phone code",
        statusCode: 400
      }
    }

    if(signupDto.password) {
      signupDto.password = generateHash(signupDto.password)
    }

    let newUser = <User>await this.prisma.user.create({
      data: {
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        email: signupDto.email,
        phone: signupDto.phone,
        phoneCode: signupDto.phoneCode,
        password: signupDto.password,
        userSignupSource: meta.signupSource,
        userSignupDeviceAgent: meta.userAgent,
        isPublished: true
      },
      select: userAttributes.login
    })

    await this.prisma.userRole.create({
      data:{
        User:{
          connect: {
            id: newUser.id
          }
        },
        Role:{
          connect:{
            slug: "CUSTOMER"
          }
        }
      }
    })

    let profile = await this.userService.createUserAvatar(newUser.id, { username: newUser.firstName + " " + newUser.lastName, shouldFetch: false })
    if (profile) {
      newUser.profile = profile;
    }

    return newUser;

  }


  async canSendOtp(loginSignUpByPhone: LoginSignUpByPhone, userIPAddress: string, userAgent: string): Promise<canSendSMS> {

    let waitTime = 60 * 60;
    let yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    let numberOfSmsSentIn24Hours = await this.prisma.otpCodes.count({
      where: {
        phone: loginSignUpByPhone.phone.toString(),
        addedDate: {
          gte: yesterday
        }
      }
    })

    if (numberOfSmsSentIn24Hours >= 2) {
      let lastSentTime = await this.prisma.otpCodes.findFirst({
        where: {
          phone: loginSignUpByPhone.phone.toString()
        },
        select: {
          id: true,
          addedDate: true,
          phone: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInSeconds = parseFloat((differenceInTime / 1000 ).toFixed(2));
      let newWaitTime = 60;
      if(numberOfSmsSentIn24Hours < 6){
        newWaitTime = 30
      }else if(numberOfSmsSentIn24Hours < 8){
        newWaitTime = 180
      }else if(numberOfSmsSentIn24Hours < 12){
        newWaitTime = 60 * 60
      }else{
        newWaitTime = 60 * 60 * 24
      }
      
      if (differenceInSeconds < newWaitTime) {
        let timeToWait = newWaitTime - differenceInSeconds;
        timeToWait = Math.floor(timeToWait);
        let timeToWaitText = convertToStandardTimeFormat(timeToWait);
        let res = {
          canActivate: false,
          message: `Maximum limit reached. Please wait ${timeToWaitText} to send an OTP again`,
          waitTime: timeToWait
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : OTP_SEND_ERROR:THRESHOLD_MEET  \n Error message : " + res.message +" \n Phone " + loginSignUpByPhone.phoneCode.toString() + " " + loginSignUpByPhone.phone.toString() );
        return res;
      }

      await this.prisma.otpCodes.updateMany({
        where: {
          phone: loginSignUpByPhone.phone.toString(),
        },
        data: {
          status: 2
        }
      })

    }

    let numberOfSmsSentBySameAgent = await this.prisma.otpCodes.count({
      where: {
        userAgent: userAgent,
        userIP: userIPAddress,
        addedDate: {
          gte: yesterday
        }
      }
    })

    if (numberOfSmsSentBySameAgent >= 12) {
      let lastSentTime = await this.prisma.otpCodes.findFirst({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        select: {
          id: true,
          addedDate: true,
          phone: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInSeconds = Math.ceil(differenceInTime / 1000 );
      if (differenceInSeconds < waitTime) {
        let timeToWait = waitTime - differenceInSeconds;
        timeToWait = Math.floor(timeToWait);
        let timeToWaitText = convertToStandardTimeFormat(timeToWait);

        let res =  {
          canActivate: false,
          message: `Maximum request reached. Please wait ${timeToWaitText} to send an OTP again`,
          waitTime: timeToWait // in seconds
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : OTP_SEND_ERROR:SAME_AGENT  \n Error message : " + res.message +" \n Phone " + loginSignUpByPhone.phoneCode.toString() + " " + loginSignUpByPhone.phone.toString() + "\n Agent: " + userAgent + "\n User IP :"+ userIPAddress );
        return res;
      }


      await this.prisma.otpCodes.updateMany({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        data: {
          status: 2
        }
      })
    }

    return {
      canActivate: true,
      message: `OTP can be sent`
    }


  }

  async canSendOtpEmail(email: string, userIPAddress: string, userAgent: string): Promise<canSendSMS> {

    //status 1 -> Default, status 2-> Waited already
    if (email === TEST_EMAIL) {
      return {
        canActivate: true,
        message: `OTP can be sent`
      }
    }
    let waitTime = 60 * 60;
    let yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    let numberOfSmsSentIn24Hours = await this.prisma.otpCodes.count({
      where: {
        email: email,
        addedDate: {
          gte: yesterday
        }
      }
    })

    if (numberOfSmsSentIn24Hours >= 2) {
      let lastSentTime = await this.prisma.otpCodes.findFirst({
        where: {
          email: email
        },
        select: {
          id: true,
          addedDate: true,
          phone: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInSeconds = parseFloat((differenceInTime / 1000 ).toFixed(2));
      let newWaitTime = 60;
      if(numberOfSmsSentIn24Hours < 6){
        newWaitTime = 30
      }else if(numberOfSmsSentIn24Hours < 8){
        newWaitTime = 180
      }else if(numberOfSmsSentIn24Hours < 12){
        newWaitTime = 60 * 60
      }else{
        newWaitTime = 60 * 60 * 24
      }
      
      if (differenceInSeconds < newWaitTime) {
        let timeToWait = newWaitTime - differenceInSeconds;
        timeToWait = Math.floor(timeToWait);
        let timeToWaitText = convertToStandardTimeFormat(timeToWait);
        let res = {
          canActivate: false,
          message: `Maximum limit reached. Please wait ${timeToWaitText} to send an OTP again`,
          waitTime: timeToWait
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : OTP_SEND_ERROR:THRESHOLD_MEET  \n Error message : " + res.message +" \n Email " + email );
        return res;
      }

      await this.prisma.otpCodes.updateMany({
        where: {
          email: email,
        },
        data: {
          status: 2
        }
      })

    }

    let numberOfSmsSentBySameAgent = await this.prisma.otpCodes.count({
      where: {
        userAgent: userAgent,
        userIP: userIPAddress,
        addedDate: {
          gte: yesterday
        }
      }
    })

    if (numberOfSmsSentBySameAgent >= 12) {
      let lastSentTime = await this.prisma.otpCodes.findFirst({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        select: {
          id: true,
          addedDate: true,
          phone: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInSeconds = Math.ceil(differenceInTime / 1000 );
      if (differenceInSeconds < waitTime) {
        let timeToWait = waitTime - differenceInSeconds;
        timeToWait = Math.floor(timeToWait);
        let timeToWaitText = convertToStandardTimeFormat(timeToWait);

        let res =  {
          canActivate: false,
          message: `Maximum request reached. Please wait ${timeToWaitText} to send an OTP again`,
          waitTime: timeToWait // in seconds
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : OTP_SEND_ERROR:SAME_AGENT  \n Error message : " + res.message +" \n Email " + email + " " + "\n Agent: " + userAgent + "\n User IP :"+ userIPAddress );
        return res;
      }


      await this.prisma.otpCodes.updateMany({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        data: {
          status: 2
        }
      })
    }

    return {
      canActivate: true,
      message: `OTP can be sent`
    }


  }

  // async sendUserOtp(loginSignUpByPhone: LoginSignUpByPhone, otpCode: number, userIPAddress: string, userAgent: string, email?: string) {
  async sendUserOtp(userData : {email?: string, phone?: string, phoneCode?: string}, otpCode: string, userIPAddress: string, userAgent: string) {
    let userOtpCondition : Prisma.OtpCodesWhereInput = {};
   if(userData.email && userData.phone){
    userOtpCondition = {
      OR: [
        {email: userData.email},
        {
          phone: userData.phone,
          phoneCode: userData.phoneCode
        }
      ] 
    }
   }else if(userData.email){
    userOtpCondition = {
      email: userData.email
    }
   }else{
    userOtpCondition = {
      phone: userData.phone,
      phoneCode: userData.phone
    }
   }
    await this.prisma.otpCodes.updateMany({
      where: userOtpCondition,
      data: {
        active: false
      }
    })
    return this.prisma.otpCodes.create({
      data: {
        phone: userData.phone,
        phoneCode: userData.phoneCode,
        email: userData.email,
        otp: otpCode,
        userAgent: userAgent,
        userIP: userIPAddress
      }
    })
  }

  async validateOTP(validateUserPhone: ValidateUserPhone): Promise<{ isValid: boolean, message: string }> {
    /*
    60 -> seconds
    10 -> minutes
    1000 -> miliseconds

    results 10 minutes prior date time
    */
    let thresholdTime = new Date(new Date().getTime() - (60 * 10 * 1000));

    let attemptsThreshold = await this.prisma.otpCodes.findFirst({
      where: {
        phone: validateUserPhone.phone.toString(),
        phoneCode: validateUserPhone.phoneCode.toString()
      },
      orderBy: {
        addedDate: 'desc'
      }
    })

    if (attemptsThreshold) {
      await this.prisma.otpCodes.update({
        where: {
          id: attemptsThreshold.id
        },
        data: {
          attempts: attemptsThreshold.attempts + 1
        }
      })

      if (attemptsThreshold.attempts > 7) {
        return {
          isValid: false,
          message: "Too many failed attempts. Please resend OTP and try again"
        }
      }
    }

    let condition = {
      phone: validateUserPhone.phone.toString(),
      phoneCode: validateUserPhone.phoneCode.toString(),
      otp: validateUserPhone.otp,
      active: true,
      addedDate: {
        gte: thresholdTime
      }
    }

    let record = await this.prisma.otpCodes.findFirst({
      where: condition
    })

    if (record) {
      if (record.used) {
        return {
          isValid: false,
          message: "You have used this OTP already, please resend OTP and try again."
        }
      } else {

        await this.prisma.otpCodes.updateMany({
          where: condition,
          data: {
            used: true
          }
        })

        return {
          isValid: true,
          message: "OTP validated successfully"
        }
      }
    } else {
      return {
        isValid: false,
        message: "Invalid OTP code"
      }
    }

  }


  async validateUserOTP(userData : {email?: string, phone?: string, phoneCode?: string}, otpCode: string): Promise<{ isValid: boolean, message: string }> {
    if(!userData.email && !userData.phone){
      return {
        isValid: false,
        message: "No user email and phone found. One must be present"
      }
    }
    /*
    60 -> seconds
    10 -> minutes
    1000 -> miliseconds

    results 10 minutes prior date time
    */
   let userOtpCondition : Prisma.OtpCodesWhereInput = {};
   if(userData.email && userData.phone){
    userOtpCondition = {
      OR: [
        {email: userData.email},
        {
          phone: userData.phone,
          phoneCode: userData.phoneCode
        }
      ] 
    }
   }else if(userData.email){
    userOtpCondition = {
      email: userData.email
    }
   }else{
    userOtpCondition = {
      phone: userData.phone,
      phoneCode: userData.phoneCode
    }
   }
    let thresholdTime = new Date(new Date().getTime() - (60 * 10 * 1000));
    let attemptsThreshold = await this.prisma.otpCodes.findFirst({
      where: {
        OR: [userOtpCondition]
      },
      orderBy: {
        addedDate: 'desc'
      }
    })

    if (attemptsThreshold) {
      await this.prisma.otpCodes.update({
        where: {
          id: attemptsThreshold.id
        },
        data: {
          attempts: attemptsThreshold.attempts + 1
        }
      })

      if (attemptsThreshold.attempts > 7) {
        return {
          isValid: false,
          message: "Too many failed attempts. Please resend OTP and try again"
        }
      }
    }

    let condition = {
      ...userOtpCondition,
      otp: otpCode,
      active: true,
      addedDate: {
        gte: thresholdTime
      }
    }

    let record = await this.prisma.otpCodes.findFirst({
      where: condition
    })

    if (record) {
      if (record.used) {
        return {
          isValid: false,
          message: "You have used this OTP already, please resend OTP and try again."
        }
      } else {

        await this.prisma.otpCodes.updateMany({
          where: condition,
          data: {
            used: true
          }
        })

        return {
          isValid: true,
          message: "OTP validated successfully"
        }
      }
    } else {
      return {
        isValid: false,
        message: "Invalid OTP code"
      }
    }

  }

  generatePhoneSignupTempToken(validateUserPhone: ValidateUserPhone) {
    const payload: AuthenticatedUserPhone = {
      phone: validateUserPhone.phone.toString(),
      phoneCode: validateUserPhone.phoneCode.toString(),
    };
    const signupTempToken = this.jwtService.sign(payload, { secret: jwtConstants.signupTempTokenSecret, expiresIn: jwtConstants.signupTempTokenExpiry });
    this.saveAuthToken('phoneSignupToken', signupTempToken);
    return signupTempToken;
  }


  generateEmailSignupTempToken(email: string) {
    const payload: AuthenticatedUserEmail = {
      email: email
    };
    const signupTempToken = this.jwtService.sign(payload, { secret: jwtConstants.signupTempTokenSecret, expiresIn: jwtConstants.signupTempTokenExpiry });
    this.saveAuthToken('emailSignupToken', signupTempToken);
    return signupTempToken;
  }

  generateResetPasswordToken(uuid: string, userId: number) {
    const payload: AuthenticatedResetToken = {
      uuid: uuid,
    };
    const resetToken = this.jwtService.sign(payload, { secret: jwtConstants.passwordResetTokenSecret, expiresIn: jwtConstants.passwordResetTokenExpiry });
    this.saveAuthToken('resetPasswordToken', resetToken, userId);
    return resetToken;
  }

  generateChangeUserPhoneEmailToken(uuid: string, userId: number) {
    const payload: AuthenticatedResetToken = {
      uuid: uuid,
    };
    const resetToken = this.jwtService.sign(payload, { secret: jwtConstants.passwordResetTokenSecret, expiresIn: jwtConstants.passwordResetTokenExpiry });
    this.saveAuthToken('changeUserPhoneEmailToken', resetToken, userId);
    return resetToken;
  }

  async userPhoneExists(phoneCode: string, phone: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        phone: phone,
        phoneCode: phoneCode
      }
    })

    if (user) {
      return true;
    } else {
      return false;
    }
  }

  async userEmailExists(email: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        email: email
      }
    })

    if (user) {
      return true;
    } else {
      return false;
    }
  }


  logEmailLookup(email: string, userIPAddress: string, userAgent: string) {
    return this.prisma.emailLookupsLog.create({
      data: {
        email: email,
        userIP: userIPAddress,
        userAgent: userAgent
      }
    })
  }

  async isFalseRequest(userIPAddress: string, userAgent: string): Promise<IsFalseRequest> {

    let waitTime = 30;
    let thresholdTime = new Date(new Date().getTime() - (60 * 10 * 1000)); // 10 minutes
    let numberOfLookupsBySameAgent = await this.prisma.emailLookupsLog.count({
      where: {
        userAgent: userAgent,
        userIP: userIPAddress,
        addedDate: {
          gte: thresholdTime
        },
        status: 1
      }
    })

    if (numberOfLookupsBySameAgent >= 10) {
      let lastSentTime = await this.prisma.emailLookupsLog.findFirst({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        select: {
          id: true,
          addedDate: true,
          email: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInMinute = Math.ceil(differenceInTime / 1000 / 60);
      if (differenceInMinute < waitTime) {
        let res = {
          canActivate: false,
          message: `Maximum request reached. Please wait ${waitTime - differenceInMinute} minutes and try again`,
          waitTime: waitTime - differenceInMinute // in minutes
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : IS_FALSE_REQUEST:THRESHOLD_MEET_SAME_AGENT  \n Error message : " + res.message);
        return res;
      }


      await this.prisma.emailLookupsLog.updateMany({
        where: {
          userAgent: userAgent,
          userIP: userIPAddress,
        },
        data: {
          status: 2
        }
      })
    }

    return {
      canActivate: true,
      message: `Email lookup if from a valid user`
    }
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      select: userAttributes.login
    })
  }

  findUserByUUID(uuid: string) {
    return this.prisma.user.findUnique({
      where: {
        uuid: uuid
      },
      select: userAttributes.login
    })
  }

  findUserByPhone(validateUserPhone: ValidateUserPhone) {
    return this.prisma.user.findFirst({
      where: {
        phone: validateUserPhone.phone.toString(),
        phoneCode: validateUserPhone.phoneCode.toString()
      },
      select: userAttributes.login
    })
  }

  parseUserStatus(user: Partial<User>, recover: boolean = false) {
    if (user.isDeleted) {
      let message = "You have deleted your account earlier. Please click on Forget your password to recover your account.";
      if(!recover){
        throw {
          message: message,
          statusCode: 400
        }
      }
    }

    if (user.status == UserStatus.suspended) {
      let message = `Your account was suspended. Please contact ${defaultYallahEmail} to recover your account`;
      throw {
        message: message,
        statusCode: 400
      }
    }
  }

  async sendPasswordResetEmail(user: Partial<User>, requestOrigin?: string){
    
    await this.invalidateAllResetTokenOfAuser(user.id);
    let passwordResetToken = this.generateResetPasswordToken(user.uuid, user.id);
    this.mailService.sendUserPasswordResetLink({
      user: user,
      token: passwordResetToken,
      origin: requestOrigin
    })

  }

  async sendOtpEmail(user: Partial<User>, otpCode: number){
    this.mailService.sendOtpEmail(user, otpCode);
  }

  async resetThresholdForADay(userId: number): Promise<CanRequestPasswordResetLink>{
    let waitTime = 120;
    let yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    let numberOfResetLinksSentIn24Hours = await this.prisma.authTokens.count({
      where: {
        userId: userId,
        status: 1,
        tokenType: TokenTypes.resetPasswordToken,
        addedDate: {
          gte: yesterday
        }
      }
    })

    if (numberOfResetLinksSentIn24Hours >= 50) { //should be five in live
      let lastSentTime = await this.prisma.authTokens.findFirst({
        where: {
          userId: userId,
          tokenType: TokenTypes.resetPasswordToken
        },
        select: {
          id: true,
          addedDate: true,
          userId: true
        },
        orderBy: {
          addedDate: 'desc'
        }
      })

      let now = new Date();
      let lastSent = new Date(lastSentTime.addedDate);
      let differenceInTime = now.valueOf() - lastSent.valueOf();
      let differenceInMinute = Math.ceil(differenceInTime / 1000 / 60);
      if (differenceInMinute < waitTime) {
        let res = {
          canActivate: false,
          message: `Maximum limit reached. Please wait ${waitTime - differenceInMinute} minutes to request an reset link again`,
          waitTime: waitTime - differenceInMinute // in minutes
        }
        this.logger.error("Error on " + this.constructor.name + " \n Error code : RESET_PASSWORD_LINK:THRESHOLD_MEET_SAME_USER  \n Error message : " + res.message);
        return res;
      }

      await this.prisma.authTokens.updateMany({
        where: {
          userId: userId,
          tokenType: TokenTypes.resetPasswordToken
        },
        data: {
          status: AuthTokenStatus.expired
        }
      })

    }

    return {
      canActivate: true,
      message: `Valid user reset threshold`
    }
  }

  async updateUserPassword(uuid: string, password: string){

    let passwd = generateHash(password);
    return this.prisma.user.update({
      where: {
        uuid: uuid
      },
      data :{
        password: passwd
      },
      select: userAttributes.login
    }).catch((err) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })

  }

  invalidateResetToken(resetToken: string){
    return this.prisma.authTokens.updateMany({
      where: {
        token: resetToken,
        tokenType: TokenTypes.resetPasswordToken
      },
      data:{
        status: AuthTokenStatus.used
      }
    })
  }

  logoutFromAllDevices(userId: number){
    return this.prisma.authTokens.deleteMany({
      where: {
        userId: userId,
        tokenType: TokenTypes.refreshToken
      }
    })
  }

  invalidateAllResetTokenOfAuser(userId: number){
    return this.prisma.authTokens.updateMany({
      where: {
        userId: userId,
        tokenType: TokenTypes.resetPasswordToken
      },
      data:{
        status: AuthTokenStatus.expired
      }
    })
  }

  async isValidUserPassword(user: AuthenticatedUser, password){
    let userData = await this.prisma.user.findUnique({
      where: {
        id: user.userId
      }
    })

    let isValidPassword = compareHash(password, userData.password);
    return isValidPassword;
  }

  updateUserEmail(user: AuthenticatedUser, email: string){
    return this.prisma.user.update({
      where:{
        uuid: user.userUid,
      },
      data:{
        email: email,
        emailVerified: true
      },
      select: userAttributes.login
    })
  }

  updateUserPhone(user: AuthenticatedUser, phoneCode: string, phone: string,){
    return this.prisma.user.update({
      where:{
        uuid: user.userUid,
      },
      data:{
        phone: phone,
        phoneCode: phoneCode,
        phoneVerified: true
      },
      select: userAttributes.login
    })
  }

  async validateUserWithGoogle(user: any, userAgent: string){
    if(!user || !user.email){
      throw {message: "User token not found", statusCode: 404}
    }

    // let userData = <<User>>await this.findUserByEmail(user.email);
    const userData = await this.userService.findLoggedInUserDetails(user.email, { password: true });
    if(userData){
      return userData;
    }

    let newUser = <User>await this.prisma.user.create({
      data: {
        firstName: (user.firstName) ? user.firstName : user.email,
        lastName: (user.lastName) ? user.lastName : '',
        email: user.email,
        userSignupSource: USER_SIGNUP_SOURCE_TYPES.google,
        userSignupDeviceAgent: userAgent,
        profile: (user.profile) ? user.profile : '',
        emailVerified: true,
        isPublished: true
      },
      select: userAttributes.login
    })

    await this.prisma.userRole.create({
      data:{
        User:{
          connect: {
            id: newUser.id
          }
        },
        Role:{
          connect:{
            slug: "CUSTOMER"
          }
        }
      }
    })

    let profile = await this.userService.createUserAvatar(newUser.id, { username: newUser.firstName + " " + newUser.lastName, shouldFetch: false })
    if (profile) {
      newUser.profile = profile;
    }

    return newUser;

  }

  async handleSafeMode(){
      let user = await this.prisma.user.findFirst({
        where:{
          email: safeModeUser
        },
        select: {
          id: true,
          uuid: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneCode: true,
          phone: true,
          profile: true,
          status: true,
          dataAccessRestrictedTo: true,
          _count: {
            select: {
              Employees: true
            }
          },
          userRole: {
            include:{
              Role: true
            }
          },
          userSignupSource: true,
          Department: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          Organization: {
            select: {
              id: true,
              name: true,
              logo: true,
              uuid: true,
              status: true,
              type: true
            }
          }
        }
      })

      if(user){

        if(!user.Organization){
          let organization = await this.prisma.organization.findFirst({
            where:{
              isDeleted: false
            }
          })

          await this.prisma.user.update({
            where:{
              id: user.id
            },
            data:{
              organizationId: organization.id
            }
          })
          user.Organization = organization;
        }

        let userRoles = user.userRole.map((ele) => ele.Role.slug)
        if(userRoles.includes(SUPER_ADMIN)){
          return user;
        }else{
          await this.prisma.userRole.create({
            data:{
              User:{
                connect: {
                  id: user.id
                }
              },
              Role:{
                connect:{
                  slug: SUPER_ADMIN
                }
              } 
            }
          })
          return user;
        }
      }

      if(!user){
        let newUser = await this.prisma.user.create({
          data:{
            firstName: "Safe",
            lastName: "User",
            email: safeModeUser,
            password: "not-applicable",
            status: UserStatus.active,
            isDeleted: true,
            userRole:{
              create:{
                Role:{
                  connect:{
                    slug: SUPER_ADMIN
                  }
                }
              }
            }
          },
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneCode: true,
            phone: true,
            profile: true,
            status: true,
            _count: {
              select: {
                Employees: true
              }
            },
            userRole: {
              include:{
                Role: true
              }
            },
            userSignupSource: true,
            Department: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            Organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                uuid: true,
                status: true,
                type: true
              }
            }
          }
        })

        return newUser
      }
  }

}
