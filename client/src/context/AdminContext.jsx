import { createContext, useContext, useState } from "react";
import { api } from "../lib/api";

const AdminContext = createContext(null);
const STORAGE_KEY = "velour_admin_token";

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [username, setUsername] = useState(() => localStorage.getItem("velour_admin_user") || "");

  async function login(u, p) {
    const data = await api.admin.login({ username: u, password: p });
    setToken(data.token);
    setUsername(data.username);
    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem("velour_admin_user", data.username);
  }

  function logout() {
    setToken(null);
    setUsername("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("velour_admin_user");
  }

  return (
    <AdminContext.Provider value={{ token, username, isAuthed: !!token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
