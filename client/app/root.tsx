import type {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  redirect,
  useLoaderData,
} from "@remix-run/react";

import "./tailwind.css";
import {
  authTokenStorage,
  getTokens,
  isValidAuth,
  refreshTokenStorage,
  regenerateAuthToken,
} from "./utils/auth";
import { getUser } from "./utils/user";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const action: ActionFunction = async ({ request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const authSession = await authTokenStorage.getSession(cookieHeader);
  const refreshSession = await refreshTokenStorage.getSession();

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    await authTokenStorage.destroySession(authSession),
  );
  headers.append(
    "Set-Cookie",
    await refreshTokenStorage.destroySession(refreshSession),
  );

  return redirect("/", { headers });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authToken, refreshToken } = await getTokens(
    request.headers.get("Cookie"),
  );
  const { isAuth, canRefresh } = await isValidAuth({ authToken, refreshToken });
  let newToken: string | undefined;
  const headers = new Headers();
  if (!isAuth && canRefresh) {
    const regeneretedToken = await regenerateAuthToken(refreshToken);
    newToken = regeneretedToken.isRegenerated
      ? regeneretedToken.newToken
      : undefined;
    const authSession = await authTokenStorage.getSession();
    authSession.set("auth_token", newToken);
    headers.append(
      "Set-Cookie",
      await authTokenStorage.commitSession(authSession),
    );
  }
  const user = await getUser(authToken ?? newToken);
  // Remixのjson関数は非推奨だが、型情報を上手いこと解釈してくれるので使っている
  return json(user, { headers });
};

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen">
        <header className="bg-slate-800 px-5 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Verify Password Auth</h1>
          {user.login && (
            <div className="flex items-center space-x-4">
              <img
                src={user.icon}
                alt="icon"
                className="w-8 h-8 rounded-full"
              />
              <p>
                {user.username} ({user.role})
              </p>
              <form method="post">
                <button type="submit">ログアウト</button>
              </form>
            </div>
          )}
          {!user.login && <a href="/login">ログイン</a>}
        </header>
        <main className="w-2/5 mx-auto mt-10">{children}</main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
