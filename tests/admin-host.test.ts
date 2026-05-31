import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  getAdminHostname,
  getRequestHostname,
  isAdminHostRequest,
} from "../src/lib/adminHost";

const originalAdminHostname = process.env.ADMIN_HOSTNAME;

afterEach(() => {
  if (originalAdminHostname === undefined) {
    delete process.env.ADMIN_HOSTNAME;
  } else {
    process.env.ADMIN_HOSTNAME = originalAdminHostname;
  }
});

test("normalizes the configured admin hostname", () => {
  process.env.ADMIN_HOSTNAME = " Admin.TheLonesomeEra.com ";
  assert.equal(getAdminHostname(), "admin.thelonesomeera.com");
});

test("allows all hostnames when admin hostname isolation is not configured", () => {
  delete process.env.ADMIN_HOSTNAME;

  assert.equal(getAdminHostname(), null);
  assert.equal(
    isAdminHostRequest(new Request("http://localhost:3000/admin")),
    true,
  );
});

test("matches requests to the configured admin hostname", () => {
  process.env.ADMIN_HOSTNAME = "admin.thelonesomeera.com";

  assert.equal(
    isAdminHostRequest(
      new Request("https://admin.thelonesomeera.com/admin", {
        headers: { host: "admin.thelonesomeera.com" },
      }),
    ),
    true,
  );
  assert.equal(
    isAdminHostRequest(
      new Request("https://thelonesomeera.com/admin", {
        headers: { host: "thelonesomeera.com" },
      }),
    ),
    false,
  );
});

test("uses x-forwarded-host before host when resolving the public hostname", () => {
  assert.equal(
    getRequestHostname(
      new Request("http://127.0.0.1:3000/admin", {
        headers: {
          host: "127.0.0.1:3000",
          "x-forwarded-host": "admin.thelonesomeera.com",
        },
      }),
    ),
    "admin.thelonesomeera.com",
  );
});
