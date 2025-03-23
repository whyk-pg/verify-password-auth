import {
  type CookieOptions,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";

// JWTトークン有効期限ベースで取得してたほうがズレてたので、決め打ちで実装
const ONE_HOUR = 3600;
const authExpire = ONE_HOUR;
const refreshExpire = ONE_HOUR * 24 * 7;

const cookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};
export const authTokenStorage = createCookieSessionStorage({
  cookie: {
    name: "auth_token",
    ...cookieBaseOptions,
    maxAge: authExpire,
    secrets: [process.env.ACCESS_SECRET ?? ""],
  },
});
export const refreshTokenStorage = createCookieSessionStorage({
  cookie: {
    name: "refresh_token",
    ...cookieBaseOptions,
    maxAge: refreshExpire,
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
 * 認証に使うトークン群を生成
 * @param request HTTPリクエスト
 * @returns 認証トークンとリフレッシュトークン
 */
export const generateTokens = async (request: Request): Promise<Tokens> => {
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
