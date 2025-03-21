import {
  type ActionFunction,
  type CookieOptions,
  type LoaderFunctionArgs,
  type MetaFunction,
  createCookie,
  redirect,
} from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Login | Verify Password Auth" },
    { name: "description", content: "Verify Password Auth" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const res = await fetch("http://localhost:8787/login", {
    method: "POST",
    body: JSON.stringify({
      email: formData.get("email"),
      password: formData.get("password"),
    }),
    credentials: "include",
  });

  if (!res.ok) {
    return redirect(`/login?status=${res.status}`);
  }

  const { authToken, refreshToken } = await res.json();
  const MAX_AGE = 60 * 60;
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
  };
  const authTokenCookie = createCookie("auth_token", cookieOptions);
  const refreshTokenCookie = createCookie("refresh_token", cookieOptions);
  const headers = new Headers();
  headers.append("Set-Cookie", await authTokenCookie.serialize(authToken));
  headers.append(
    "Set-Cookie",
    await refreshTokenCookie.serialize(refreshToken),
  );

  return redirect("/", { headers });
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const status = new URL(request.url).searchParams.get("status");
  return json({ status });
};

export default function Index() {
  const { status } = useLoaderData<typeof loader>();

  return (
    <>
      <form method="post">
        <div className="flex flex-col">
          <div>
            <label htmlFor="email">メールアドレス</label>
            <input type="email" id="email" name="email" />
          </div>
          <div>
            <label htmlFor="password">パスワード</label>
            <input type="password" id="password" name="password" />
          </div>
        </div>
        <button type="submit">ログイン</button>
      </form>
      {status === null ? "" : <p>{status}エラーが出ました</p>}
    </>
  );
}
