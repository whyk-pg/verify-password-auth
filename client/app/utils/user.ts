import { jwtVerify } from "jose";
import { authTokenCookie } from "./cookie";

type NotLoggedIn = {
  login: false;
};
type LoggedIn = {
  login: true;
  username: string;
  role: string;
  icon: string;
};
export type User = NotLoggedIn | LoggedIn;
type Payload = {
  sub: string;
  role: string;
  icon: string;
};

export const getUser = async (request: Request): Promise<User> => {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return {
      login: false,
    };
  }
  const authToken = await authTokenCookie.parse(cookieHeader);
  const { payload } = await jwtVerify<Payload>(
    authToken,
    new TextEncoder().encode(process.env.ACCESS_SECRET ?? ""),
  );
  return {
    login: true,
    username: payload.sub,
    role: payload.role,
    icon: payload.icon,
  };
};
