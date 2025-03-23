import { jwtVerify } from "jose";
import type { Payload } from "~/type";

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

/**
 * ユーザー情報を取得する
 * @param token 認証トークン
 * @returns ユーザー情報
 */
export const getUser = async (token: string | undefined): Promise<User> => {
  if (!token) {
    return {
      login: false,
    };
  }

  const { payload } = await jwtVerify<Payload>(
    token,
    new TextEncoder().encode(process.env.ACCESS_SECRET ?? ""),
  );

  return {
    login: true,
    username: payload.sub,
    role: payload.role,
    icon: payload.icon,
  };
};
