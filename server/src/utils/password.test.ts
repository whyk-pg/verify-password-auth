import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("パスワードのハッシュ化", () => {
  const PASSWORD = "password";
  const salt = crypto.getRandomValues(new Uint8Array(16));

  it("パスワードをハッシュ化して平文パスワードと比較したとき、検証が通ること", async () => {
    const hashedPassword = await hashPassword(PASSWORD, salt);
    const isVerified = await verifyPassword(hashedPassword, PASSWORD);

    expect(isVerified).toBe(true);
  });

  it("同じパスワードを違うソルトでハッシュ化したとき、検証が通らないこと", async () => {
    const otherSalt = crypto.getRandomValues(new Uint8Array(16));
    const hashedPassword = await hashPassword(PASSWORD, salt);
    const wrongPassword = await hashPassword(PASSWORD, otherSalt);
    const isVerified = await verifyPassword(hashedPassword, wrongPassword);

    expect(isVerified).toBe(false);
  });

  it("違うパスワードを同じソルトでハッシュ化したとき、検証が通らないこと", async () => {
    const wrongPassword = "wrongPassword";
    const hashedPassword = await hashPassword(PASSWORD, salt);
    const isVerified = await verifyPassword(hashedPassword, wrongPassword);

    expect(isVerified).toBe(false);
  });
});
