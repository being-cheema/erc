// Self-hosted API client — replaces Supabase client
// All hooks should use this instead of the old supabase client

const API_BASE = import.meta.env.VITE_SUPABASE_URL || '';

class ApiClient {
  private tokenListeners: Set<(token: string | null) => void> = new Set();

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.notifyListeners(token);
  }

  clearToken() {
    localStorage.removeItem('auth_token');
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
      // Check expiry
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.clearToken();
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

  // Core fetch method
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
      this.clearToken();
      window.location.href = '/login';
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