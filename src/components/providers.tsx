"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";
import { store } from "@/lib/store";

function ClientToaster() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return null;
  return <Toaster richColors position="top-right" />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <LanguageProvider>
        {children}
        <ClientToaster />
      </LanguageProvider>
    </Provider>
  );
}
