import { jwtVerify } from "jose";
import { authTokenStorage } from "./auth";

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
  const authSession = await authTokenStorage.getSession(cookieHeader);
  const { payload } = await jwtVerify<Payload>(
    authSession.get("auth_token"),
    new TextEncoder().encode(process.env.ACCESS_SECRET ?? ""),
  );
  return {
    login: true,
    username: payload.sub,
    role: payload.role,
    icon: payload.icon,
  };
};
