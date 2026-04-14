import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";

vi.mock("../../api/github", () => ({
  getUser: vi.fn(),
  getRepoPermissions: vi.fn(),
}));

import { getUser, getRepoPermissions } from "../../api/github";

const mockGetUser = vi.mocked(getUser);
const mockGetRepoPermissions = vi.mocked(getRepoPermissions);

// Helper component to access auth context
function AuthConsumer({ onAuth }: { onAuth: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onAuth(auth);
  return <div data-testid="consumer">{auth.user?.login ?? "no-user"}</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Default: no repo detected (local dev)
  vi.stubGlobal("location", { hostname: "localhost", pathname: "/" });
});

describe("AuthProvider", () => {
  it("renders children when no stored token", () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("validates stored token on mount", async () => {
    localStorage.setItem("github_pat", "stored-token");
    mockGetUser.mockResolvedValue({ login: "ash", avatar_url: "https://img.png" });

    let authState: any;
    render(
      <AuthProvider>
        <AuthConsumer onAuth={(a) => { authState = a; }} />
      </AuthProvider>,
    );

    await waitFor(() => expect(authState.user?.login).toBe("ash"));
    expect(mockGetUser).toHaveBeenCalledWith("stored-token");
  });

  it("saveToken stores in localStorage, validates, and sets user", async () => {
    mockGetUser.mockResolvedValue({ login: "ash", avatar_url: "" });

    let authState: any;
    render(
      <AuthProvider>
        <AuthConsumer onAuth={(a) => { authState = a; }} />
      </AuthProvider>,
    );

    await act(async () => {
      await authState.saveToken("new-token");
    });

    expect(localStorage.getItem("github_pat")).toBe("new-token");
    expect(authState.user?.login).toBe("ash");
  });

  it("saveToken with invalid token sets error and clears token", async () => {
    mockGetUser.mockRejectedValue(new Error("Bad credentials"));

    let authState: any;
    render(
      <AuthProvider>
        <AuthConsumer onAuth={(a) => { authState = a; }} />
      </AuthProvider>,
    );

    await act(async () => {
      await authState.saveToken("bad-token");
    });

    expect(authState.error).toBe("Bad credentials");
    expect(authState.user).toBeNull();
    expect(localStorage.getItem("github_pat")).toBeNull();
  });

  it("logout clears token, user, isOwner from state and localStorage", async () => {
    mockGetUser.mockResolvedValue({ login: "ash", avatar_url: "" });

    let authState: any;
    render(
      <AuthProvider>
        <AuthConsumer onAuth={(a) => { authState = a; }} />
      </AuthProvider>,
    );

    await act(async () => {
      await authState.saveToken("token");
    });
    expect(authState.user).toBeTruthy();

    act(() => {
      authState.logout();
    });

    expect(authState.token).toBeNull();
    expect(authState.user).toBeNull();
    expect(authState.isOwner).toBe(false);
    expect(localStorage.getItem("github_pat")).toBeNull();
  });

  it("isOwner true when no repo detected (local dev) and valid token", async () => {
    mockGetUser.mockResolvedValue({ login: "ash", avatar_url: "" });

    let authState: any;
    render(
      <AuthProvider>
        <AuthConsumer onAuth={(a) => { authState = a; }} />
      </AuthProvider>,
    );

    await act(async () => {
      await authState.saveToken("token");
    });

    expect(authState.isOwner).toBe(true);
  });
});

describe("useAuth", () => {
  it("throws outside provider", () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BadComponent() {
      useAuth();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow("useAuth must be used within AuthProvider");
    spy.mockRestore();
  });
});
