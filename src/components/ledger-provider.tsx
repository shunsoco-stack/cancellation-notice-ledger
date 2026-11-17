"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { todayJapan } from "@/lib/dates";
import { createSeed } from "@/lib/seed";
import { decodeStorage, STORAGE_KEY, validateData } from "@/lib/storage";
import type { Contract } from "@/lib/types";

type Ledger = {
  contracts: Contract[];
  today: string;
  ready: boolean;
  message: string;
  save: (contract: Contract) => void;
  remove: (id: string) => void;
  reset: () => void;
  dismiss: () => void;
};
const Context = createContext<Ledger | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [today, setToday] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const date = todayJapan();
      setToday(date);
      let loaded = { contracts: createSeed(date), recovered: false };
      try {
        loaded = decodeStorage(localStorage.getItem(STORAGE_KEY), date);
        if (loaded.recovered) setMessage("保存データが壊れていたため、既定データに戻しました。");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded.contracts));
      } catch {
        setMessage("ブラウザへの保存が利用できません。この画面を閉じると変更は失われます。");
      }
      setContracts(loaded.contracts);
      setReady(true);
    });
    const timer = window.setInterval(() => setToday(todayJapan()), 60_000);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const loaded = decodeStorage(event.newValue, todayJapan());
      setContracts(loaded.contracts);
      setMessage(
        loaded.recovered
          ? "別タブの保存データが壊れていたため既定データを表示しています。"
          : "別タブの変更を反映しました。",
      );
    };
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function persist(next: Contract[], notice: string) {
    if (!validateData(next)) {
      setMessage("入力データに不整合があります。内容と手続きの順序を確認してください。");
      return;
    }
    setContracts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMessage(notice);
    } catch {
      setMessage("保存に失敗しました。変更はこの画面内だけに保持されています。");
    }
  }

  return (
    <Context.Provider
      value={{
        contracts,
        today,
        ready,
        message,
        save: (c) =>
          persist(
            contracts.some((item) => item.id === c.id)
              ? contracts.map((item) => (item.id === c.id ? c : item))
              : [...contracts, c],
            "契約を保存しました。",
          ),
        remove: (id) =>
          persist(
            contracts.filter((c) => c.id !== id),
            "契約を削除しました。",
          ),
        reset: () => {
          const date = todayJapan();
          setToday(date);
          persist(createSeed(date), "今日を基準に既定データを再生成しました。");
        },
        dismiss: () => setMessage(""),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useLedger() {
  const context = useContext(Context);
  if (!context) throw new Error("LedgerProvider is required");
  return context;
}
