"use client";

import { useState, useCallback, useRef } from "react";
import { useSessionPolling } from "@/hooks/use-session-polling";
import { HomeButton } from "@/components/home-button";

type LensDisplay = {
  mode: "caption" | "important" | "call" | "idle";
  title?: string;
  body: string;
  priority: "normal" | "high" | "urgent";
};

export default function LensPreview() {
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [display, setDisplay] = useState<LensDisplay>({
    mode: "idle",
    body: "",
    priority: "normal",
  });
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<LensDisplay[]>([]);

  const lastTranscriptCount = useRef(0);

  // Polling for real-time updates
  useSessionPolling(connected ? sessionId : null, {
    onTranscripts: useCallback((items: unknown[]) => {
      const entries = items as { originalText: string; displayText: string }[];
      if (entries.length > 0) {
        const entry = entries[entries.length - 1];
        const d: LensDisplay = {
          mode: "caption",
          body: entry.displayText || entry.originalText,
          priority: "normal",
        };
        setDisplay(d);
        setHistory((prev) => [...prev.slice(-19), d]);
      }
    }, []),
    onImportantItems: useCallback((items: unknown[]) => {
      const allItems = items as { title: string; body: string; priority: string; reviewStatus: string }[];
      const sent = allItems.filter((i) => i.reviewStatus === "sent");
      if (sent.length > 0) {
        const item = sent[sent.length - 1];
        const d: LensDisplay = {
          mode: "important",
          title: item.title,
          body: item.body,
          priority: item.priority as LensDisplay["priority"],
        };
        setDisplay(d);
        setHistory((prev) => [...prev.slice(-19), d]);
      }
    }, []),
    onSessionEnded: useCallback(() => {
      setDisplay({ mode: "idle", body: "セッション終了", priority: "normal" });
    }, []),
  });

  async function connect() {
    if (!sessionCode.trim()) return;
    const res = await fetch(
      `/api/sessions/join/${encodeURIComponent(sessionCode.trim().toUpperCase())}`
    );
    if (!res.ok) {
      alert("接続コードが見つかりません");
      return;
    }
    const data = await res.json();
    setSessionId(data.sessionId);
    setConnected(true);
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/40 rounded-full border border-purple-700/50">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-300 font-medium">Even G2</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Lens Preview</h1>
            <p className="text-gray-500 text-sm">
              スマートグラス表示プレビュー
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && connect()}
              placeholder="接続コードを入力"
              className="w-full text-center text-2xl font-mono tracking-[0.3em] bg-gray-900/80 text-white border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-base"
              maxLength={8}
            />
            <button
              onClick={connect}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all font-medium shadow-lg shadow-purple-900/30"
            >
              接続する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
      <div className="absolute top-4 left-4">
        <HomeButton color="white" />
      </div>
      <div className="w-full max-w-md">
        {/* Lens viewport */}
        <div className="border border-gray-800 rounded-3xl overflow-hidden bg-gradient-to-b from-gray-900/80 to-black shadow-2xl shadow-purple-900/10">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-800/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              <span className="text-[11px] text-gray-400 font-medium tracking-wider">MIERU</span>
            </div>
            <span className="text-[11px] text-gray-600 font-mono tracking-wider">
              {sessionCode}
            </span>
            <div className="flex items-center gap-1.5">
              {(["caption", "important", "call"] as const).map((m) => (
                <div
                  key={m}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    display.mode === m ? "bg-purple-400" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Display area */}
          <div className="min-h-[220px] flex items-center justify-center p-8">
            {display.mode === "idle" ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full border border-gray-700 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-700 animate-pulse" />
                </div>
                <p className="text-gray-600 text-sm">
                  {display.body || "待機中..."}
                </p>
              </div>
            ) : display.mode === "caption" ? (
              <p className="text-white text-2xl leading-relaxed font-medium text-center tracking-wide">
                {display.body}
              </p>
            ) : display.mode === "important" ? (
              <div className="text-center space-y-3 w-full">
                <div
                  className={`inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider ${
                    display.priority === "urgent"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : display.priority === "high"
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                        : "bg-blue-500 text-white"
                  }`}
                >
                  {display.priority === "urgent" ? "重要" : display.priority === "high" ? "確認" : "情報"}
                </div>
                {display.title && (
                  <p className="text-purple-300 text-sm font-semibold tracking-wide">
                    {display.title}
                  </p>
                )}
                <p className="text-white text-2xl font-bold leading-relaxed">
                  {display.body}
                </p>
              </div>
            ) : display.mode === "call" ? (
              <div className="text-center space-y-3">
                <p className="text-amber-400 text-sm font-semibold tracking-wider uppercase">
                  呼び出し
                </p>
                <p className="text-white text-5xl font-bold tabular-nums">
                  {display.body}
                </p>
              </div>
            ) : null}
          </div>

          {/* History bar */}
          {history.length > 1 && (
            <div className="px-5 py-2.5 border-t border-gray-800/60">
              <p className="text-[10px] text-gray-600 mb-1.5">履歴</p>
              <div className="flex gap-1.5 overflow-x-auto">
                {history.slice(-5, -1).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setDisplay(h)}
                    className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-gray-800/80 text-gray-400 hover:bg-gray-700 transition-colors max-w-[120px] truncate"
                  >
                    {h.mode === "caption" ? "💬" : h.mode === "important" ? "📌" : "📢"}{" "}
                    {h.body.slice(0, 12)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-4 tracking-wide">
          Even G2 Lens Preview · 実際のスマートグラス表示をシミュレート
        </p>
      </div>
    </div>
  );
}
