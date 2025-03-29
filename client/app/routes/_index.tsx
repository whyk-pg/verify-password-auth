import {
  type ActionFunction,
  type MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { authTokenStorage, refreshTokenStorage } from "~/utils/auth";

export const meta: MetaFunction = () => {
  return [
    { title: "Verify Password Auth" },
    { name: "description", content: "Verify Password Auth" },
  ];
};

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

export default function Index() {
  return (
    <>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim unde
        itaque quia, a libero, minima quidem fugit dignissimos alias dolorum
        eveniet quis beatae non autem quibusdam necessitatibus, dolores soluta
        praesentium! Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Ducimus enim sunt officiis nam ea nulla deserunt nemo tenetur in
        corporis libero, dolore voluptates reprehenderit fugiat neque earum,
        voluptate esse sed.
      </p>
      <a href="/contents">コンテンツページへ行く</a>
    </>
  );
}
