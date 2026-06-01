// Thin fetch wrapper that attaches the JWT and unwraps JSON / errors.
const API_URL = 'https://task-manager-app-9s8z.onrender.com';
const TOKEN_KEY = 'tm_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (email, password) =>
  request('/auth/auth/register', { method: 'POST', body: { email, password }, auth: false }),
  login: (email, password) =>
  request('/auth/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  listTasks: () => request('/tasks/tasks'),
  createTask: (data) => request('/tasks/tasks', { method: 'POST', body: data }),
  updateTask: (id, data) => request(`/tasks/tasks/${id}`, { method: 'PATCH', body: data }),
  deleteTask: (id) => request(`/tasks/tasks/${id}`, { method: 'DELETE' }),
};
