export const jwtConstants = {
  accessTokensecret: process.env.JWT_SECRET_KEY,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET_KEY,
  signupTempTokenSecret: process.env.JWT_SIGNUP_TEMP_KEY,
  passwordResetTokenSecret: process.env.JWT_PASSWORD_RESET_SECRET_KEY,
  userSubscriptionTokenSecret: process.env.JWT_USER_SUBSCRIPITIONS_KEY,
  refreshTokenExpiry: "14d",
  accessTokenExpiry: "1d",
  signupTempTokenExpiry: "1d",
  passwordResetTokenExpiry: "1d",
  userSubscriptionTokenExpiry: "1y"
};

export const bcryptConstants = {
  saltRounds: 9,
}
