// Impostazioni salvate nel browser (localStorage): solo l'indirizzo del
// server. Di default usiamo la stessa origine da cui è stata caricata la
// pagina (funziona da subito quando il server serve anche il frontend).
// Se sul telefono l'app è stata aperta diversamente, o si vuole puntare a un
// indirizzo diverso, si può incollare l'ip qui una volta sola.

import { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "4zone:serverUrl";

function defaultServerUrl() {
  return window.location.origin;
}

function normalizza(url) {
  if (!url) return defaultServerUrl();
  return url.trim().replace(/\/+$/, "");
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [serverUrl, setServerUrlState] = useState(() => {
    const salvato = localStorage.getItem(STORAGE_KEY);
    return normalizza(salvato || defaultServerUrl());
  });

  const setServerUrl = useCallback((url) => {
    const pulito = normalizza(url);
    localStorage.setItem(STORAGE_KEY, pulito);
    setServerUrlState(pulito);
  }, []);

  const resetServerUrl = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setServerUrlState(defaultServerUrl());
  }, []);

  return (
    <SettingsContext.Provider
      value={{ serverUrl, setServerUrl, resetServerUrl, defaultServerUrl: defaultServerUrl() }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings va usato dentro <SettingsProvider>");
  return ctx;
}
