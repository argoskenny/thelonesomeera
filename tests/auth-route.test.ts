import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { POST } from "../src/app/api/auth/route";

const originalAdminPassword = process.env.ADMIN_PASSWORD;
const originalJwtSecret = process.env.JWT_SECRET;
const originalAdminHostname = process.env.ADMIN_HOSTNAME;

function restoreEnv() {
  if (originalAdminPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  }

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }

  if (originalAdminHostname === undefined) {
    delete process.env.ADMIN_HOSTNAME;
  } else {
    process.env.ADMIN_HOSTNAME = originalAdminHostname;
  }
}

function requestWithJson(body: unknown) {
  return {
    json: async () => body,
  } as never;
}

async function postAuth(body: unknown) {
  return POST(requestWithJson(body));
}

afterEach(() => {
  restoreEnv();
});

test("rejects login when ADMIN_PASSWORD is missing", async () => {
  delete process.env.ADMIN_PASSWORD;
  process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";

  const response = await postAuth({});

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "管理員認證尚未設定",
  });
});

test("rejects login when ADMIN_PASSWORD is still the deployment placeholder", async () => {
  process.env.ADMIN_PASSWORD = "changeme";
  process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";

  const response = await postAuth({ password: "changeme" });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "管理員認證尚未設定",
  });
});

test("rejects login when JWT_SECRET is missing", async () => {
  process.env.ADMIN_PASSWORD = "correct-admin-password";
  delete process.env.JWT_SECRET;

  const response = await postAuth({ password: "correct-admin-password" });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "管理員認證尚未設定",
  });
});

test("sets the admin cookie for a valid login configuration", async () => {
  process.env.ADMIN_PASSWORD = "correct-admin-password";
  process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";

  const response = await postAuth({ password: "correct-admin-password" });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.match(response.headers.get("set-cookie") ?? "", /admin_token=/);
});

test("rejects login outside the configured admin hostname", async () => {
  process.env.ADMIN_PASSWORD = "correct-admin-password";
  process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";
  process.env.ADMIN_HOSTNAME = "admin.thelonesomeera.com";

  const response = await POST(
    new Request("https://thelonesomeera.com/api/auth", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "thelonesomeera.com",
      },
      body: JSON.stringify({ password: "correct-admin-password" }),
    }) as never,
  );

  assert.equal(response.status, 404);
});
