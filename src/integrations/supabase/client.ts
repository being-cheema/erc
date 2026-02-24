// Self-hosted API client — replaces Supabase client
// All hooks should use this instead of the old supabase client

const API_BASE = import.meta.env.VITE_SUPABASE_URL || '';

class ApiClient {
  private tokenListeners: Set<(token: string | null) => void> = new Set();
  private refreshPromise: Promise<boolean> | null = null;

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.notifyListeners(token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token);
  }

  clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.notifyListeners(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Parse JWT to get user info (without verification — that's server-side)
  getUser(): { user_id: string; email: string; role: string } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check expiry — try refresh if expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Don't clear immediately — let auto-refresh try first
        this.tryRefresh();
        return null;
      }
      return { user_id: payload.user_id, email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    return this.getUser()?.user_id || null;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (token: string | null) => void): () => void {
    this.tokenListeners.add(callback);
    return () => this.tokenListeners.delete(callback);
  }

  private notifyListeners(token: string | null) {
    this.tokenListeners.forEach(cb => cb(token));
  }

  // Auto-refresh JWT using refresh token
  async tryRefresh(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.clearToken();
        return false;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          this.clearToken();
          return false;
        }

        const data = await response.json();
        this.setToken(data.token);
        this.setRefreshToken(data.refresh_token);
        return true;
      } catch {
        this.clearToken();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Core fetch method with auto-refresh on 401
  async fetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try auto-refresh before giving up
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        // Retry the request with the new token
        const newHeaders = { ...headers, Authorization: `Bearer ${this.getToken()}` };
        const retryResponse = await fetch(`${API_BASE}${path}`, { ...options, headers: newHeaders });
        if (retryResponse.ok) return retryResponse.json();
      }
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    return response.json();
  }

  // Convenience methods
  get<T = any>(path: string) { return this.fetch<T>(path); }
  post<T = any>(path: string, body?: any) { return this.fetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }
  put<T = any>(path: string, body: any) { return this.fetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }); }
  delete<T = any>(path: string) { return this.fetch<T>(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();

// Legacy compatibility — some components may import 'supabase'
// This provides a minimal shim so they don't break immediately
export const supabase = {
  auth: {
    getSession: async () => ({
      data: {
        session: api.isAuthenticated() ? { access_token: api.getToken() } : null,
      },
    }),
    getUser: async () => {
      const user = api.getUser();
      return {
        data: { user: user ? { id: user.user_id, email: user.email } : null },
        error: null,
      };
    },
    onAuthStateChange: (callback: (_event: string, session: any) => void) => {
      const unsubscribe = api.onAuthStateChange((token) => {
        callback(
          token ? 'SIGNED_IN' : 'SIGNED_OUT',
          token ? { access_token: token } : null
        );
      });
      // Return compatible format
      return { data: { subscription: { unsubscribe } } };
    },
    signOut: async () => {
      api.clearToken();
      return { error: null };
    },
    verifyOtp: async () => {
      // Not used in self-hosted mode
      return { error: null };
    },
  },
};