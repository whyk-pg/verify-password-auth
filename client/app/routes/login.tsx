import {
  type ActionFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { authTokenStorage, refreshTokenStorage } from "~/utils/cookie";

export const meta: MetaFunction = () => {
  return [
    { title: "Login | Verify Password Auth" },
    { name: "description", content: "Verify Password Auth" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
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
    return redirect(`/login?status=${res.status}`);
  }

  const { authToken, refreshToken } = (await res.json()) as {
    authToken: string;
    refreshToken: string;
  };
  const headers = new Headers();
  const authSession = await authTokenStorage.getSession();
  authSession.set("auth_token", authToken);
  const refreshSession = await refreshTokenStorage.getSession();
  refreshSession.set("refresh_token", refreshToken);
  headers.append(
    "Set-Cookie",
    await authTokenStorage.commitSession(authSession),
  );
  headers.append(
    "Set-Cookie",
    await refreshTokenStorage.commitSession(refreshSession),
  );

  return redirect("/", { headers });
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const status = new URL(request.url).searchParams.get("status");
  return { status };
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
