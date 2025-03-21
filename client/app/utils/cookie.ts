import { type CookieOptions, createCookie } from "@remix-run/node";

const MAX_AGE = 60 * 60;
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: MAX_AGE,
  expires: new Date(Date.now() + MAX_AGE * 1000),
  secrets: ["secret"],
};
export const authTokenCookie = createCookie("auth_token", cookieOptions);
export const refreshTokenCookie = createCookie("refresh_token", cookieOptions);
