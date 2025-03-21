import {
  type CookieOptions,
  createCookieSessionStorage,
} from "@remix-run/node";

const MAX_AGE = 60 * 60;
const cookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: MAX_AGE,
  expires: new Date(Date.now() + MAX_AGE * 1000),
};
export const authTokenStorage = createCookieSessionStorage({
  cookie: {
    name: "auth_token",
    ...cookieBaseOptions,
    secrets: [process.env.ACCESS_SECRET ?? ""],
  },
});
export const refreshTokenStorage = createCookieSessionStorage({
  cookie: {
    name: "refresh_token",
    ...cookieBaseOptions,
    secrets: [process.env.REFRESH_SECRET ?? ""],
  },
});
