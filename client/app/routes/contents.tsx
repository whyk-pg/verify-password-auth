import {
  type ActionFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { json, useLoaderData } from "@remix-run/react";
import { authTokenStorage, getTokens, refreshTokenStorage } from "~/utils/auth";

export const meta: MetaFunction = () => {
  return [
    { title: "Content | Verify Password Auth" },
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

  return redirect("/contents", { headers });
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒
export const loader = async ({ request }: LoaderFunctionArgs) => {
  let retryCount = 0;
  
  const fetchWithRetry = async (): Promise<Response> => {
    const { authToken } = await getTokens(request.headers.get("Cookie"));

    if (!authToken && retryCount < MAX_RETRIES) {
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry();
    }

    const res = await fetch(`${process.env.API_ORIGIN}/contents`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!res.ok && retryCount < MAX_RETRIES) {
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry();
    }

    return res;
  };

  const res = await fetchWithRetry();

  if (!res.ok) {
    return json(
      { title: "Error", body: "Failed to fetch content." },
      { status: 500 }
    );
  }

  return res.json<{ title: string; body: string }>();
};

export default function Index() {
  const content = useLoaderData<typeof loader>();

  return (
    <>
      <section>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
      </section>
      <a href="/">TOPページに戻る</a>
    </>
  );
}
