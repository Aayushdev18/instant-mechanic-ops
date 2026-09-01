"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Booking } from "@/lib/types";

type LiveContextValue = {
  connected: boolean;
  lastBooking: Booking | null;
  version: number;
};

const LiveContext = createContext<LiveContextValue>({
  connected: false,
  lastBooking: null,
  version: 0,
});

export function useLive() {
  return useContext(LiveContext);
}

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onBooking = (event: Event) => {
      const detail = (event as CustomEvent).detail as { payload?: Booking } | undefined;
      if (detail?.payload) setLastBooking(detail.payload);
      setConnected(true);
      setVersion((v) => v + 1);
    };
    const onNotice = (event: Event) => {
      const n = (event as CustomEvent).detail as { title?: string; body?: string };
      if (n?.title) toast(n.title, { description: n.body });
    };
    window.addEventListener("im:booking-updated", onBooking);
    window.addEventListener("im:notice", onNotice);
    return () => {
      window.removeEventListener("im:booking-updated", onBooking);
      window.removeEventListener("im:notice", onNotice);
    };
  }, []);

  const value = useMemo(
    () => ({ connected, lastBooking, version }),
    [connected, lastBooking, version]
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
