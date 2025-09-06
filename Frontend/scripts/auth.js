import { BASE_URL } from "../config.js";

export class Auth {
  static async login(email, password) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      const parseJson = () => response.json();
      const parseText = () => response.text();

      if (response.ok) {
        const data = contentType.includes("application/json")
          ? await parseJson()
          : await parseText();
        return { success: true, data };
      } else {
        const errorData = contentType.includes("application/json")
          ? await parseJson()
          : await parseText();
        const message =
          (typeof errorData === "object" && errorData && errorData.msg) ||
          (typeof errorData === "string" && errorData) ||
          "Login failed";
        throw new Error(message);
      }
    } catch (error) {
      throw error;
    }
  }

  static async logout() {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      // Redirect to home after logout
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "index.html";
    }
  }

  static async signup(username, email, password) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok) {
        const data = contentType.includes("application/json")
          ? await response.json()
          : await response.text();
        return { success: true, data };
      } else {
        const errorData = contentType.includes("application/json")
          ? await response.json()
          : await response.text();
        const message =
          (typeof errorData === "object" && errorData && errorData.msg) ||
          (typeof errorData === "string" && errorData) ||
          "Signup failed";
        throw new Error(message);
      }
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok) {
        const data = contentType.includes("application/json")
          ? await response.json()
          : await response.text();
        return (data && data.user) || null;
      }
      return null;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }

  static async refreshToken() {
    try {
      const response = await fetch(`${BASE_URL}/api/refresh`, {
        method: "POST",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }

  static async getUser() {
    // Get user from backend API
    const user = await this.getCurrentUser();
    return user || { name: "Demo User", email: "demo@example.com" };
  }

  static async requireAuth() {
    // Check if user is authenticated
    const user = await this.getCurrentUser();
    if (!user) {
      // Try to refresh token first
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        window.location.href = "index.html#login-required";
        return false;
      }
    }
    return true;
  }

  // Show login modal or redirect to login section
  static showLogin() {
    window.location.href = "index.html#login-required";
  }
}
