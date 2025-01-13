import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { google, Auth } from 'googleapis';

@Injectable()
export class GoogleAuthService {
  oauthClient: Auth.OAuth2Client;
  constructor(
  ) {
    const clientID = process.env.GOOGLE_AUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET;

    this.oauthClient = new google.auth.OAuth2(
      clientID,
      clientSecret
    );
  }

  async authenticate(token: string) {
    try {
      this.oauthClient.setCredentials({access_token: token});
      let oauth2 = google.oauth2({
        auth: this.oauthClient,
        version: 'v2'
      });
      let { data } = await oauth2.userinfo.get(); 
      let tokenInfo = data;
      const email = tokenInfo.email;
      if (!email) {
        throw { message: "Couldnot fetch user from the given token", statusCode: 404 }
      }
      return {
        email: tokenInfo.email,
        firstName: tokenInfo.given_name,
        lastName: tokenInfo.family_name,
        profile: tokenInfo.picture
      };
    } catch (err) {
      throw { message: err.message, statusCode: 400 }
    }
  }

}