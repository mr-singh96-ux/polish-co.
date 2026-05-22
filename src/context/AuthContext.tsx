import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "@/lib/config";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isAdmin: false,
  signIn: async () => {},
  adminSignIn: async () => {},
  signUp: async () => {},
  signOut: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Restore session from localStorage ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role") as "admin" | "user" | null;
    const id = localStorage.getItem("userId");

    if (token && email && name && role) {
      setUser({ id: id || "current-user", email, name, role });
    }
    setLoading(false);
  }, []);

  /* ── Sign In ── */
  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.user.email);
    localStorage.setItem("name", data.user.name);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("userId", data.user.id);

    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role
    });
  };

  /* ── Admin Sign In (calls /admin/login — server rejects non-admins) ── */
  const adminSignIn = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.user.email);
    localStorage.setItem("name", data.user.name);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("userId", data.user.id);

    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role
    });
  };

  /* ── Sign Up ── */
  const signUp = async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    await signIn(email, password);
  };

  /* ── Sign Out ── */
  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, adminSignIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
