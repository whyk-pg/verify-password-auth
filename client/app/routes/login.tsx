import {
  type ActionFunction,
  type MetaFunction,
  redirect,
} from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Login | Verify Password Auth" },
    { name: "description", content: "Verify Password Auth" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const res = await fetch("https://89cf-175-132-206-78.ngrok-free.app/login", {
    method: "POST",
    body: JSON.stringify({
      email: formData.get("email"),
      password: formData.get("password"),
    }),
    credentials: "include",
  });

  console.log({ header: res.headers, cookie: res.headers.get("Set-Cookie") });

  if (!res.ok) {
    return redirect("/login");
  }
  return redirect("/");
};

export default function Index() {
  return (
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
  );
}
