import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getUser, getRepoPermissions, getFileContent, commitFile } from "../github";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const TOKEN = "ghp_test123";

describe("getUser", () => {
  it("returns login and avatar_url on success", async () => {
    server.use(
      http.get("https://api.github.com/user", () => {
        return HttpResponse.json({ login: "ash", avatar_url: "https://example.com/avatar.png" });
      }),
    );
    const user = await getUser(TOKEN);
    expect(user.login).toBe("ash");
    expect(user.avatar_url).toBe("https://example.com/avatar.png");
  });

  it("throws on non-200", async () => {
    server.use(
      http.get("https://api.github.com/user", () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );
    await expect(getUser(TOKEN)).rejects.toThrow("GitHub API error: 401");
  });

  it("sends correct Authorization header", async () => {
    let receivedAuth = "";
    server.use(
      http.get("https://api.github.com/user", ({ request }) => {
        receivedAuth = request.headers.get("Authorization") ?? "";
        return HttpResponse.json({ login: "ash", avatar_url: "" });
      }),
    );
    await getUser(TOKEN);
    expect(receivedAuth).toBe(`Bearer ${TOKEN}`);
  });
});

describe("getRepoPermissions", () => {
  it("returns push: true for owner", async () => {
    server.use(
      http.get("https://api.github.com/repos/ash/pkmn", () => {
        return HttpResponse.json({ permissions: { push: true } });
      }),
    );
    const perms = await getRepoPermissions(TOKEN, "ash", "pkmn");
    expect(perms.push).toBe(true);
  });

  it("returns push: false for viewer", async () => {
    server.use(
      http.get("https://api.github.com/repos/ash/pkmn", () => {
        return HttpResponse.json({ permissions: { push: false } });
      }),
    );
    const perms = await getRepoPermissions(TOKEN, "ash", "pkmn");
    expect(perms.push).toBe(false);
  });

  it("handles missing permissions gracefully", async () => {
    server.use(
      http.get("https://api.github.com/repos/ash/pkmn", () => {
        return HttpResponse.json({});
      }),
    );
    const perms = await getRepoPermissions(TOKEN, "ash", "pkmn");
    expect(perms.push).toBe(false);
  });
});

describe("getFileContent", () => {
  it("returns sha and content", async () => {
    server.use(
      http.get("https://api.github.com/repos/ash/pkmn/contents/data.json", () => {
        return HttpResponse.json({ sha: "abc123", content: "eyJ0ZXN0IjogdHJ1ZX0=" });
      }),
    );
    const file = await getFileContent(TOKEN, "ash", "pkmn", "data.json");
    expect(file.sha).toBe("abc123");
    expect(file.content).toBe("eyJ0ZXN0IjogdHJ1ZX0=");
  });

  it("throws on error", async () => {
    server.use(
      http.get("https://api.github.com/repos/ash/pkmn/contents/data.json", () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );
    await expect(getFileContent(TOKEN, "ash", "pkmn", "data.json")).rejects.toThrow("GitHub API error: 404");
  });
});

describe("commitFile", () => {
  it("sends base64-encoded content and sha", async () => {
    let body: any;
    server.use(
      http.put("https://api.github.com/repos/ash/pkmn/contents/data.json", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          content: { sha: "new-sha" },
          commit: { sha: "commit-sha", message: "update" },
        });
      }),
    );
    await commitFile(TOKEN, "ash", "pkmn", "data.json", '{"test": true}', "old-sha", "update");
    expect(body.sha).toBe("old-sha");
    expect(body.message).toBe("update");
    expect(body.content).toBeTruthy();
  });

  it("409 conflict throws specific error message", async () => {
    server.use(
      http.put("https://api.github.com/repos/ash/pkmn/contents/data.json", () => {
        return new HttpResponse(null, { status: 409 });
      }),
    );
    await expect(
      commitFile(TOKEN, "ash", "pkmn", "data.json", "content", "sha", "msg"),
    ).rejects.toThrow("CONFLICT");
  });

  it("other errors throw generic message", async () => {
    server.use(
      http.put("https://api.github.com/repos/ash/pkmn/contents/data.json", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    await expect(
      commitFile(TOKEN, "ash", "pkmn", "data.json", "content", "sha", "msg"),
    ).rejects.toThrow("GitHub API error: 500");
  });
});
