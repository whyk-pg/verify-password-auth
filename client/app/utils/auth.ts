import {
  type CookieOptions,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import { jwtVerify } from "jose";
import type { Payload } from "~/type";

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

/**
 * Cookieからトークンを取得
 * @param cookieHeader HTTPヘッダーから取得したCookie文字列
 * @returns 認証トークンとリフレッシュトークン
 */
export const getTokens = async (
  cookieHeader: string | null,
): Promise<{
  authToken: string | undefined;
  refreshToken: string | undefined;
}> => {
  const authSession = await authTokenStorage.getSession(cookieHeader);
  const refreshSession = await refreshTokenStorage.getSession(cookieHeader);

  return {
    authToken: authSession.get("auth_token"),
    refreshToken: refreshSession.get("refresh_token"),
  };
};

interface IsValidAuthProps {
  /** 認証トークン */
  authToken: string | undefined;
  /** リフレッシュトークン */
  refreshToken: string | undefined;
}
interface IsValidAuth {
  /** 認証ができる状態か */
  isAuth: boolean;
  /** リフレッシュ可能か */
  canRefresh: boolean;
}
/**
 * Cookieから取得した認証トークンが有効かどうかを判定
 * @param {IsValidAuthProps} props Cookie文字列から取得した認証トークンとリフレッシュトークン
 * @returns 有効な認証トークンかどうか
 */
export const isValidAuth = async ({
  authToken,
  refreshToken,
}: IsValidAuthProps): Promise<IsValidAuth> => {
  // TODO: ここの条件網羅ができてないので、あとでテストを書く
  // トークンがない場合
  if (authToken === undefined && refreshToken === undefined) {
    return {
      isAuth: false,
      canRefresh: false,
    };
  }

  if (authToken === undefined && refreshToken !== undefined) {
    return {
      isAuth: false,
      canRefresh: true,
    };
  }

  const jwtAuthToken = await jwtVerify<Payload>(
    // TODO: 上でundefinedじゃないことを確認しているのに型エラーが出る件はあとで確認する
    authToken ?? "",
    new TextEncoder().encode(process.env.ACCESS_SECRET ?? ""),
  );
  const jwtRefreshToken = await jwtVerify<Payload>(
    // TODO: 上でundefinedじゃないことを確認しているのに型エラーが出る件はあとで確認する
    refreshToken ?? "",
    new TextEncoder().encode(process.env.REFRESH_SECRET ?? ""),
  );
  const unixTimeNow = Date.now() / 1000;
  // 認証トークンが有効期限切れでの場合
  if (
    jwtAuthToken.payload.exp > unixTimeNow &&
    jwtRefreshToken.payload.exp < unixTimeNow
  ) {
    return {
      isAuth: false,
      canRefresh: true,
    };
  }

  return {
    isAuth: true,
    canRefresh: true,
  };
};

type Regenerated =
  | {
      isRegenerated: true;
      newToken: string;
    }
  | {
      isRegenerated: false;
    };

export const regenerateAuthToken = async (
  refreshToken: string | undefined,
): Promise<Regenerated> => {
  if (refreshToken === undefined) {
    return {
      isRegenerated: false,
    };
  }

  const res = await fetch(`${process.env.API_ORIGIN}/refresh`, {
    method: "POST",
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!res.ok) {
    return {
      isRegenerated: false,
    };
  }

  const { authToken } = await res.json<{
    authToken: string;
  }>();

  return {
    isRegenerated: true,
    newToken: authToken,
  };
};
