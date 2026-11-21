import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TER_MODULES } from '../data/terModules.js';
import { fetchModules, saveModules } from '../services/api.js';

// Module context holds the documentation cards.
// When the portal server is running, cards are loaded from and saved to the
// shared SQLite database, so every visitor sees the same content.
// If the server cannot be reached (static demo), it falls back to localStorage.

export const MODULES_STORAGE_KEY = 'ter-portal-modules-v2';

const ModuleContext = createContext(null);

function buildSections(data) {
  return [
    {
      title: 'Overview',
      paragraphs: [data.summary || data.shortDescription || ''],
      bullets: [],
      imagePlaceholder: null,
    },
    {
      title: 'Purpose',
      paragraphs: [data.purpose || ''],
      bullets: [],
      imagePlaceholder: null,
    },
    {
      title: 'Step-by-step process',
      paragraphs: [],
      bullets: data.steps || [],
      imagePlaceholder: null,
    },
    {
      title: 'Business rules',
      paragraphs: [],
      bullets: data.rules || [],
      imagePlaceholder: null,
    },
  ];
}

function slugify(value) {
  return (value || 'module')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadModules() {
  try {
    const raw = window.localStorage.getItem(MODULES_STORAGE_KEY);
    if (!raw) {
      return TER_MODULES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : TER_MODULES;
  } catch {
    return TER_MODULES;
  }
}

export function ModuleProvider({ children }) {
  const [modules, setModules] = useState(loadModules);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const serverModeRef = useRef(false);
  const hydratingRef = useRef(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // Load the shared cards from the portal server (falls back to local demo data).
  useEffect(() => {
    let cancelled = false;
    fetchModules()
      .then((remoteModules) => {
        if (cancelled) {
          return;
        }
        serverModeRef.current = true;
        hydratingRef.current = true;
        setModules(remoteModules);
        setReady(true);
      })
      .catch(() => {
        // Server unavailable: keep working with the local demo data.
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (serverModeRef.current) {
      if (hydratingRef.current) {
        hydratingRef.current = false;
        return;
      }
      const timer = setTimeout(() => {
        saveModules(modules)
          .then((savedModules) => {
            hydratingRef.current = true;
            setModules(savedModules);
          })
          .catch((error) => {
            if (error.status === 401) {
              showToast('Admin session expired - sign in again to save changes.', 'error');
            } else if (error.status === 0) {
              showToast('Portal server not reachable - changes were not saved.', 'error');
            } else {
              showToast(error.message || 'Could not save changes to the portal server.', 'error');
            }
          });
      }, 400);
      return () => clearTimeout(timer);
    }

    try {
      window.localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
    } catch {
      // Changes stay in memory for this session when the browser storage is full.
      showToast('Browser storage is full - the change was not saved permanently.', 'error');
    }
  }, [modules, showToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const addModule = useCallback((data) => {
    const id = `module-${Date.now()}`;
    const newModule = {
      ...data,
      id,
      slug: slugify(data.title),
      status: data.status || 'Available',
      liveUrl: data.liveUrl || null,
      // An explicit sections array (even empty) wins; otherwise generate the
      // standard sections from the summary / purpose / steps / rules fields.
      sections: Array.isArray(data.sections) ? data.sections : buildSections(data),
      relatedModuleIds: data.relatedModuleIds || [],
    };
    setModules((previous) => [newModule, ...previous]);
    return newModule;
  }, []);

  const updateModule = useCallback((id, data) => {
    setModules((previous) =>
      previous.map((module) =>
        module.id === id
          ? {
              ...module,
              ...data,
              id,
              slug: slugify(data.title || module.title),
              sections: Array.isArray(data.sections)
                ? data.sections
                : buildSections({ ...module, ...data }),
            }
          : module
      )
    );
  }, []);

  const deleteModule = useCallback((id) => {
    setModules((previous) => previous.filter((module) => module.id !== id));
  }, []);

  const resetModules = useCallback(() => setModules(TER_MODULES), []);

  // Reload the cards from the server (used after edits made in the Database page).
  const refreshModules = useCallback(async () => {
    const remoteModules = await fetchModules();
    serverModeRef.current = true;
    hydratingRef.current = true;
    setModules(remoteModules);
    return remoteModules;
  }, []);

  const value = useMemo(
    () => ({
      modules,
      ready,
      addModule,
      updateModule,
      deleteModule,
      resetModules,
      refreshModules,
      toast,
      showToast,
    }),
    [
      modules,
      ready,
      addModule,
      updateModule,
      deleteModule,
      resetModules,
      refreshModules,
      toast,
      showToast,
    ]
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
}
