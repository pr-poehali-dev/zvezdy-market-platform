const API_URL = 'https://functions.poehali.dev/243a37ce-9933-4e76-a713-fe60061b34ba';

export interface User {
  id: number;
  username: string;
  email?: string;
  telegram_id?: number;
  telegram_username?: string;
  balance: number;
  is_admin?: boolean;
  role?: string;
  created_at: string;
}

export const authApi = {
  async register(username: string, email?: string, telegram_username?: string): Promise<User> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, email, telegram_username })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(username: string): Promise<User> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getUser(userId: number): Promise<User> {
    const response = await fetch(`${API_URL}?user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  }
};

export const saveUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearUser = () => {
  localStorage.removeItem('user');
};