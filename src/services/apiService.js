const API_BASE_URL = "http://localhost:8000";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getToken() {
    return this.token || localStorage.getItem("token");
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async login(username, password) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(username, password, stellarPublicKey) {
    return await this.request("/register", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        stellar_public_key: stellarPublicKey,
      }),
    });
  }

  async getCurrentUser() {
    return await this.request("/users/me");
  }

  async getUser(userId) {
    return await this.request(`/users/${userId}`);
  }

  async createGame(betAmount) {
    return await this.request("/games/", {
      method: "POST",
      body: JSON.stringify({ bet_amount: betAmount }),
    });
  }

  async matchmake(betAmount) {
    return await this.request(`/games/matchmake?bet_amount=${betAmount}`, {
      method: "POST",
    });
  }

  async getGame(gameId) {
    return await this.request(`/games/${gameId}`);
  }

  async listGames() {
    return await this.request("/games/");
  }

  async joinGame(gameId) {
    return await this.request("/games/join", {
      method: "POST",
      body: JSON.stringify({ game_id: gameId }),
    });
  }

  async getTokenBalance() {
    try {
      return await this.request("/users/me/balance");
    } catch (error) {
      console.warn("Balance endpoint yok, 0 döndürülüyor");
      return { balance: 0 };
    }
  }
}

// ⚠️ ÖNEMLİ: Bu satır EN SONDA olmalı!
export const apiService = new ApiService();
