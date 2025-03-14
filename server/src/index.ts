import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";

const app = new Hono();

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
  password: string;
}

// テスト用のユーザー情報（本来はDBなどから取得）
const MOCK_USERS = [
  {
    email: "mock01@example.com",
    username: "mock01",
    password: "password",
    role: Role.ADMIN,
  },
] satisfies User[];

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST"],
    credentials: true,
  }),
);

app.post("/login", async (c) => {
  const { email, password } = await c.req.json<{
    email: string;
    password: string;
  }>();

  const user = MOCK_USERS.find(
    (u) => u.email === email && u.password === password,
  );

  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const MAX_AGE = 60 * 60;
  const SECRET = "secret";
  const payload = { sub: user.username, role: user.role, exp };
  const authToken = await sign(payload, SECRET);
  const refreshToken = await sign(payload, SECRET);

  setCookie(c, "auth_token", authToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
  });
  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
  });

  return c.json({ message: "Login success" });
});

app.get("/refresh", (c) => {
  return c.json({ message: "Refresh" });
});

app.get("/logout", (c) => {
  return c.json({ message: "Logout" });
});

app.get("/profile", (c) => {
  return c.json({ message: "Profile" });
});

export default app;
