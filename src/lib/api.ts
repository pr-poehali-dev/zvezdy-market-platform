const AUTH_URL = 'https://functions.poehali.dev/243a37ce-9933-4e76-a713-fe60061b34ba';
const TASKS_URL = 'https://functions.poehali.dev/7143a55e-e579-4039-b98e-fdcac36f5f72';
const MARKETPLACE_URL = 'https://functions.poehali.dev/86554048-1434-46fd-8aff-9dc6b8e47047';
const EXCHANGE_URL = 'https://functions.poehali.dev/6945e635-5f6d-442d-a81c-ac7758d7653b';
const ADMIN_URL = 'https://functions.poehali.dev/027633ed-b57e-4954-8451-d768fb2cfa4c';

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
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, email, telegram_username })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(username: string): Promise<User> {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getUser(userId: number): Promise<User> {
    const response = await fetch(`${AUTH_URL}?user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  }
};

export const tasksApi = {
  async getTasks(userId: number) {
    const response = await fetch(`${TASKS_URL}?user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.tasks;
  },

  async verifyTask(userId: number, taskId: number, telegramUserId?: number) {
    const response = await fetch(TASKS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', user_id: userId, task_id: taskId, telegram_user_id: telegramUserId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
};

export const marketplaceApi = {
  async getP2PItems() {
    const response = await fetch(`${MARKETPLACE_URL}?action=list`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.items;
  },

  async getMyGifts(userId: number) {
    const response = await fetch(`${MARKETPLACE_URL}?action=my_gifts&user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.gifts;
  },

  async getHistory(giftId: number) {
    const response = await fetch(`${MARKETPLACE_URL}?action=history&gift_id=${giftId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.history;
  },

  async buyFromStore(userId: number, giftId: number) {
    const response = await fetch(MARKETPLACE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy_from_store', user_id: userId, gift_id: giftId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async buyFromUser(buyerId: number, userGiftId: number) {
    const response = await fetch(MARKETPLACE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy_from_user', buyer_id: buyerId, user_gift_id: userGiftId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async listForSale(userGiftId: number, salePrice: number) {
    const response = await fetch(MARKETPLACE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list_for_sale', user_gift_id: userGiftId, sale_price: salePrice })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
};

export const exchangeApi = {
  async getCompanies() {
    const response = await fetch(`${EXCHANGE_URL}?action=companies`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.companies;
  },

  async getPortfolio(userId: number) {
    const response = await fetch(`${EXCHANGE_URL}?action=portfolio&user_id=${userId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.portfolio;
  },

  async getPriceHistory(companyId: number) {
    const response = await fetch(`${EXCHANGE_URL}?action=price_history&company_id=${companyId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.history;
  },

  async buyShares(userId: number, companyId: number, shares: number) {
    const response = await fetch(EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy', user_id: userId, company_id: companyId, shares })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async sellShares(userId: number, companyId: number, shares: number) {
    const response = await fetch(EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sell', user_id: userId, company_id: companyId, shares })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
};

export const adminApi = {
  async getStats(adminId: number) {
    const response = await fetch(`${ADMIN_URL}?action=stats&admin_id=${adminId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.stats;
  },

  async getWithdrawals(adminId: number) {
    const response = await fetch(`${ADMIN_URL}?action=withdrawals&admin_id=${adminId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.withdrawals;
  },

  async getUsers(adminId: number) {
    const response = await fetch(`${ADMIN_URL}?action=users&admin_id=${adminId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.users;
  },

  async addBalance(adminId: number, userId: number, amount: number, reason: string) {
    const response = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_balance', admin_id: adminId, user_id: userId, amount, reason })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async addTask(adminId: number, title: string, description: string, reward: number, taskType: string) {
    const response = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_task', admin_id: adminId, title, description, reward, task_type: taskType })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
};

export const saveUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const user = localStorage.setItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearUser = () => {
  localStorage.removeItem('user');
};