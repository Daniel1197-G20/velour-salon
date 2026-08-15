const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  services: {
    list: () => request("/services"),
    get: (id) => request(`/services/${id}`),
    create: (body, token) => request("/services", { method: "POST", body, token }),
    update: (id, body, token) => request(`/services/${id}`, { method: "PUT", body, token }),
    remove: (id, token) => request(`/services/${id}`, { method: "DELETE", token }),
  },
  products: {
    list: () => request("/products"),
    get: (id) => request(`/products/${id}`),
    create: (body, token) => request("/products", { method: "POST", body, token }),
    update: (id, body, token) => request(`/products/${id}`, { method: "PUT", body, token }),
    remove: (id, token) => request(`/products/${id}`, { method: "DELETE", token }),
  },
  bookings: {
    create: (body) => request("/bookings", { method: "POST", body }),
    taken: (date) => request("/bookings/taken", { params: { date } }),
    list: (token) => request("/bookings", { token }),
    update: (id, body, token) => request(`/bookings/${id}`, { method: "PUT", body, token }),
    remove: (id, token) => request(`/bookings/${id}`, { method: "DELETE", token }),
  },
  orders: {
    create: (body) => request("/orders", { method: "POST", body }),
    list: (token) => request("/orders", { token }),
    update: (id, body, token) => request(`/orders/${id}`, { method: "PUT", body, token }),
  },
  admin: {
    login: (body) => request("/admin/login", { method: "POST", body }),
    summary: (token) => request("/admin/summary", { token }),
  },
};
