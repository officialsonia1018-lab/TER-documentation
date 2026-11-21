import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ROLES } from '../data/roles.js';
import { apiLogin, apiLogout } from '../services/api.js';

// Portal access model:
// - Reading the documentation is public. No login is required at all.
// - Only the admin account can log in (at /login) to add, edit or delete cards.
// Credentials are validated by the portal server when it is available. If the
// app runs as a static demo without the server, the local fallback below is used.
// The admin session is kept in sessionStorage so a page refresh keeps you signed in
// inside the same browser tab.

export const ADMIN_EMAIL = 'admin@ternityforworder';
export const ADMIN_PASSWORD = 'admin123';

const SESSION_KEY = 'ter-portal-admin-session';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.role === 'admin') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readStoredUser);

  useEffect(() => {
    try {
      if (currentUser) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore storage failures (private mode etc.) - session stays in memory only.
    }
  }, [currentUser]);

  const login = useCallback(async ({ email, password }) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const roleInfo = ROLES.find((item) => item.id === 'admin') || ROLES[0];

    try {
      const user = await apiLogin(normalizedEmail, password || '');
      const sessionUser = {
        ...user,
        roleLabel: roleInfo.label,
        loginAt: new Date().toISOString(),
      };
      setCurrentUser(sessionUser);
      return { ok: true, user: sessionUser };
    } catch (error) {
      if (error.status === 0) {
        // Static demo without the portal server: validate against the demo account.
        if (normalizedEmail !== ADMIN_EMAIL || (password || '') !== ADMIN_PASSWORD) {
          return { ok: false, error: 'Invalid email or password.' };
        }
        const sessionUser = {
          email: ADMIN_EMAIL,
          name: 'Administrator',
          role: 'admin',
          roleLabel: roleInfo.label,
          loginAt: new Date().toISOString(),
        };
        setCurrentUser(sessionUser);
        return { ok: true, user: sessionUser };
      }
      return {
        ok: false,
        error: error.status === 401 ? 'Invalid email or password.' : error.message,
      };
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isLoggedIn: Boolean(currentUser),
      isAdmin: Boolean(currentUser && currentUser.role === 'admin'),
      currentUser,
      currentRole: currentUser ? currentUser.role : null,
      login,
      logout,
    }),
    [currentUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
