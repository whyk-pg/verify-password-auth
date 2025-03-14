import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/login", (c) => {
  return c.json({ message: "Login" });
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
