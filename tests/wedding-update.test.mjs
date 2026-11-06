import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));

// Exercise the real route handlers without Next's server or external services.
function setup({
  guest = { name: "friends" },
  environment = "development",
} = {}) {
  const sent = [];
  const api = {
    auth: { validateSession: "validateSession" },
    guests: { listGuests: "listGuests", markUpdateSent: "markUpdateSent" },
  };
  const mocks = {
    "next/server": { NextResponse: Response },
    "next/headers": {
      cookies: async () => ({ get: () => ({ value: "test-session" }) }),
    },
    "convex/nextjs": {
      fetchQuery: async (query) =>
        query === api.auth.validateSession
          ? { valid: true }
          : [{ ...guest, _id: "guest-1", email: "guest@example.com" }],
      fetchMutation: async () => ({ ok: true }),
    },
    "@/convex/_generated/api": { api },
    "@/lib/email": {
      sendEmail: async (email) => {
        sent.push(email);
        return { messageId: "test-only" };
      },
    },
    "@/lib/request-ip": {
      getRequestIpAddress: () => undefined,
      getRequestLocation: () => ({}),
    },
  };
  const cache = new Map();
  function load(relativePath) {
    if (cache.has(relativePath)) return cache.get(relativePath);
    const source = readFileSync(path.join(root, relativePath), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    });
    const compiledModule = { exports: {} };
    vm.runInNewContext(
      outputText,
      {
        module: compiledModule,
        exports: compiledModule.exports,
        Request,
        Response,
        URL,
        process: { env: { NODE_ENV: environment } },
        require: (id) => {
          if (Object.hasOwn(mocks, id)) return mocks[id];
          if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
          throw new Error(`Unexpected dependency: ${id}`);
        },
      },
      { filename: relativePath },
    );
    cache.set(relativePath, compiledModule.exports);
    return compiledModule.exports;
  }
  return { load, sent };
}

for (const guest of [
  { name: "friends" },
  { name: "Alex", plusOne: "Sam", kids: "Charlie|Jamie" },
  { name: '<script>alert("test")</script>', plusOne: "A & B" },
]) {
  test(`preview matches the outgoing email for ${guest.name}`, async () => {
    const { load, sent } = setup({ guest });
    const previewUrl = new URL("http://localhost:3000/dash/email-preview");
    for (const [key, value] of Object.entries(guest))
      previewUrl.searchParams.set(key, value);
    const preview = await load(
      "app/(dashboard)/dash/email-preview/route.ts",
    ).GET(new Request(previewUrl));
    const delivery = await load("app/api/send-update/route.ts").POST(
      new Request("http://localhost:3000/api/send-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: "guest-1" }),
      }),
    );
    assert.equal(preview.status, 200);
    assert.equal(delivery.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(await preview.text(), sent[0].html);
    const expected = load(
      "lib/email-templates/wedding-update.ts",
    ).buildWeddingUpdateEmail({ origin: previewUrl.origin, guest });
    for (const field of ["from", "subject", "html", "text"])
      assert.equal(sent[0][field], expected[field]);
    assert.ok(
      sent[0].html.includes(
        'src="http://localhost:3000/email/wedding-map.png"',
      ),
    );
    assert.doesNotMatch(sent[0].html, /<a\s|<script>|View wedding details/);
    assert.match(sent[0].html, /<strong>11am<\/strong>/);
    assert.doesNotMatch(sent[0].text, /\*\*|<strong>/);
  });
}

test("default preview uses the same content as a friends greeting", async () => {
  const { load } = setup();
  const preview = await load("app/(dashboard)/dash/email-preview/route.ts").GET(
    new Request("http://localhost:3000/dash/email-preview"),
  );
  const expected = load(
    "lib/email-templates/wedding-update.ts",
  ).buildWeddingUpdateEmail({ origin: "http://localhost:3000" });
  assert.equal(await preview.text(), expected.html);
});

test("preview stays unavailable outside development", async () => {
  for (const environment of ["production", "test"]) {
    const { load } = setup({ environment });
    for (const query of ["", "?name=Alex", "?image=map"]) {
      const response = await load(
        "app/(dashboard)/dash/email-preview/route.ts",
      ).GET(
        new Request(`https://www.belandjon.com/dash/email-preview${query}`),
      );
      assert.equal(response.status, 404);
      assert.equal(await response.text(), "");
    }
  }
});

test("preview and delivery have one map asset", () => {
  assert.ok(existsSync(path.join(root, "public/email/wedding-map.png")));
  assert.equal(
    existsSync(path.join(root, "assets/email/wedding-map.png")),
    false,
  );
});
