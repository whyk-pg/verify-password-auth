import {
  type CookieOptions,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";

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

type Tokens =
  | {
      ok: true;
      status: number;
      authToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      status: number;
    };

/**
 * 認証に使うトークン群を取得
 * @param request HTTPリクエスト
 * @returns 認証トークンとリフレッシュトークン
 */
export const getTokens = async (request: Request): Promise<Tokens> => {
  const formData = await request.formData();
  const res = await fetch(`${process.env.API_ORIGIN}/login`, {
    method: "POST",
    body: JSON.stringify({
      email: formData.get("email"),
      password: formData.get("password"),
    }),
    credentials: "include",
  });
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
    };
  }

  const { authToken, refreshToken } = await res.json<{
    authToken: string;
    refreshToken: string;
  }>();

  return {
    ok: true,
    status: res.status,
    authToken,
    refreshToken,
  };
};
