import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { verifyPassword } from "./utils/password";

type Bindings = {
  SERVICE_ORIGIN: string;
  ACCESS_SECRET: string;
  REFRESH_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

/** ロール定義 */
enum Role {
  /** 管理者 */
  ADMIN = "ADMIN",
  /** 編集者 */
  EDITOR = "EDITOR",
  /** 原作者 */
  ORIGINATOR = "ORIGINATOR",
}

interface User {
  username: string;
  role: Role;
  email: string;
  icon_url: string;
  password: string;
  salt: string;
}

// テスト用のユーザー情報（本来はDBなどから取得）
const MOCK_USERS = [
  {
    email: "mock01@example.com",
    username: "mock01",
    password:
      "73616c74:fbb92d693fc005c6f557c892f4c7072d043a81a3049c59c04e023a9aad42b46d", // password
    salt: "salt", // 本来はランダムなソルトを使用する
    // [Deno Avater](https://deno-avatar.deno.dev)で生成したアバター画像
    icon_url: "https://deno-avatar.deno.dev/avatar/50659f.svg",
    role: Role.ADMIN,
  },
] satisfies User[];

app.use("*", (c, next) =>
  cors({
    origin: c.env.SERVICE_ORIGIN,
    allowMethods: ["GET", "POST"],
    credentials: true,
  })(c, next),
);

app.post("/login", async (c) => {
  const { email, password } = await c.req.json<{
    email: string;
    password: string;
  }>();

  const user = MOCK_USERS.find(
    (u) => u.email === email && verifyPassword(u.password, password),
  );

  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // 現在時刻(ミリ秒)をUNIX時刻(秒)に変換
  const unixTimeNow = Date.now() / 1000;
  // 1時間の秒数
  const ONE_HOUR = 3600;
  const authExpire = unixTimeNow + ONE_HOUR;
  const refreshExpire = unixTimeNow + ONE_HOUR * 24 * 7;

  const authToken = await sign(
    {
      sub: user.username,
      role: user.role,
      icon: user.icon_url,
      exp: authExpire,
      token_type: "access",
    },
    c.env.ACCESS_SECRET,
  );
  const refreshToken = await sign(
    {
      sub: user.username,
      exp: refreshExpire,
      token_type: "refresh",
    },
    c.env.REFRESH_SECRET,
  );

  return c.json({ authToken, refreshToken });
});

app.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json<{
    refreshToken: string;
  }>();
  const decoded = await verify(refreshToken, c.env.REFRESH_SECRET);
  if (decoded.exp && decoded.exp < Date.now() / 1000) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const user = MOCK_USERS.find((u) => u.username === decoded.sub);
  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // 現在時刻(ミリ秒)をUNIX時刻(秒)に変換
  const unixTimeNow = Date.now() / 1000;
  // 1時間の秒数
  const ONE_HOUR = 3600;
  const authExpire = unixTimeNow + ONE_HOUR;
  const authToken = await sign(
    {
      sub: user.username,
      role: user.role,
      icon: user.icon_url,
      exp: authExpire,
      token_type: "access",
    },
    c.env.ACCESS_SECRET,
  );
  return c.json({ authToken });
});

app.get(
  "/contents",
  bearerAuth({
    verifyToken: async (token, c) => {
      try {
        await verify(token, c.env.ACCESS_SECRET);
        return true;
      } catch (_error) {
        return false;
      }
    },
  }),
  (c) => {
    const content = {
      title: "Sample Content",
      body: "This is a sample content.",
    };

    return c.json(content);
  },
);

export default app;
