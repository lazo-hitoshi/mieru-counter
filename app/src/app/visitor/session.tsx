"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSessionEvents } from "@/hooks/use-session-events";
import { HelpGuide } from "@/components/help-guide";

const VISITOR_SESSION_HELP_STEPS = [
  {
    icon: "📺",
    title: "字幕エリア",
    description:
      "画面の上部にスタッフの言葉が\nリアルタイムで大きく表示されます。\nA+/A-ボタンで文字サイズを変えられます。",
  },
  {
    icon: "✏️",
    title: "文字で伝える",
    description:
      "「✏️ 文字で伝える」ボタンを押すと\nテキスト入力欄が現れます。\n話せなくても文字でスタッフに伝えられます。",
  },
  {
    icon: "👆",
    title: "確認ボタン",
    description:
      "「✓ 理解しました」→ わかった時\n「🔄 もう一度」→ 聞き直したい時\n「🐢 ゆっくり」→ ゆっくり話してほしい時\nボタンを押すだけでスタッフに伝わります。",
  },
  {
    icon: "📝",
    title: "会話メモ",
    description:
      "右上の「会話メモ」ボタンで\n今までの会話履歴と重要事項を\nまとめて確認できます。",
  },
];

type TranscriptEntry = {
  id: string;
  speakerType: string;
  originalText: string;
  displayText: string;
  createdAt: string;
};

type ImportantItem = {
  id: string;
  itemType: string;
  title: string;
  body: string;
  priority: string;
  reviewStatus: string;
};

type CallNotification = {
  id: string;
  callNumber: string | null;
  title: string;
  body: string;
  priority: string;
};

const ITEM_TYPE_ICONS: Record<string, string> = {
  medicine: "💊",
  appointment: "📅",
  payment: "💰",
  place: "📍",
  document: "📄",
  warning: "⚠️",
  next_action: "➡️",
};

const CONFIRMATION_BUTTONS = [
  { type: "understood", label: "理解しました", icon: "✓", color: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800" },
  { type: "repeat", label: "もう一度", icon: "🔄", color: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700" },
  { type: "slower", label: "ゆっくり", icon: "🐢", color: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700" },
  { type: "write_text", label: "文字で", icon: "✏️", color: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700" },
  { type: "sign_language", label: "手話通訳", icon: "🤟", color: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800" },
];

export default function VisitorSession({
  sessionId,
  facilityName,
  counterName,
}: {
  sessionId: string;
  facilityName: string;
  counterName: string;
}) {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [importantItems, setImportantItems] = useState<ImportantItem[]>([]);
  const [callNotification, setCallNotification] = useState<CallNotification | null>(null);
  const [fontSize, setFontSize] = useState(20);
  const [showMemo, setShowMemo] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [latestCaption, setLatestCaption] = useState<TranscriptEntry | null>(null);
  const [captionFade, setCaptionFade] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // SSE real-time events
  useSessionEvents(sessionId, {
    "transcript.created": useCallback((data: unknown) => {
      const entry = data as TranscriptEntry;
      setTranscripts((prev) => [...prev, entry]);
      setCaptionFade(false);
      setLatestCaption(entry);
      setTimeout(() => setCaptionFade(true), 50);
    }, []),
    "important_item.sent": useCallback((data: unknown) => {
      const item = data as ImportantItem;
      setImportantItems((prev) => {
        if (prev.some((i) => i.id === item.id)) {
          return prev.map((i) => (i.id === item.id ? item : i));
        }
        return [...prev, item];
      });
    }, []),
    "call.sent": useCallback((data: unknown) => {
      setCallNotification(data as CallNotification);
      setTimeout(() => setCallNotification(null), 15000);
    }, []),
    "session.ended": useCallback(() => {
      setSessionEnded(true);
    }, []),
  });

  // Initial data load
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setTranscripts(data.transcriptEntries || []);
      const sent = (data.importantItems || []).filter(
        (i: ImportantItem) => i.reviewStatus === "sent"
      );
      setImportantItems(sent);
      if (data.transcriptEntries?.length > 0) {
        setLatestCaption(data.transcriptEntries[data.transcriptEntries.length - 1]);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  async function sendConfirmation(actionType: string) {
    await fetch(`/api/sessions/${sessionId}/confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType }),
    });
    setLastAction(actionType);
    setTimeout(() => setLastAction(null), 2500);
  }

  async function sendMessage() {
    const text = messageInput.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await fetch(`/api/sessions/${sessionId}/transcripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          speakerType: "visitor",
          source: "manual",
        }),
      });
      setMessageInput("");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // Call notification overlay
  if (callNotification) {
    return (
      <div className="min-h-screen bg-amber-500 flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="text-center text-white space-y-4">
          <p className="text-lg font-medium">📢 呼び出し</p>
          {callNotification.callNumber && (
            <p className="text-7xl font-bold">{callNotification.callNumber}</p>
          )}
          <p className="text-xl">{callNotification.body}</p>
        </div>
        <button
          onClick={() => setCallNotification(null)}
          className="mt-8 px-6 py-2 bg-white/20 text-white rounded-full text-sm"
        >
          閉じる
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between safe-area-top shadow-lg">
        <div>
          <p className="font-semibold text-sm">{facilityName}</p>
          <p className="text-[10px] text-emerald-200">{counterName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFontSize((s) => Math.min(s + 3, 36))}
            className="w-8 h-8 rounded-full bg-emerald-700/50 text-xs font-bold flex items-center justify-center active:bg-emerald-800"
            aria-label="文字を大きく"
          >
            A+
          </button>
          <button
            onClick={() => setFontSize((s) => Math.max(s - 3, 14))}
            className="w-8 h-8 rounded-full bg-emerald-700/50 text-xs flex items-center justify-center active:bg-emerald-800"
            aria-label="文字を小さく"
          >
            A-
          </button>
          <button
            onClick={() => setShowMemo(!showMemo)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              showMemo ? "bg-white text-emerald-700" : "bg-emerald-700/50"
            }`}
          >
            {showMemo ? "字幕に戻る" : "会話メモ"}
          </button>
        </div>
      </header>

      {sessionEnded && (
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-center">
          <p className="text-sm text-slate-600 font-medium">
            このセッションは終了しました
          </p>
        </div>
      )}

      {!showMemo ? (
        <>
          {/* Live caption */}
          <div className="bg-slate-50 border-b-2 border-emerald-200 px-6 py-8 min-h-[140px] flex items-center justify-center">
            {latestCaption ? (
              <div className="text-center max-w-lg">
                {latestCaption.speakerType === "visitor" && (
                  <p className="text-xs text-emerald-500 font-medium mb-1">あなたのメッセージ</p>
                )}
                <p
                  className={`font-medium leading-relaxed text-slate-800 transition-opacity duration-300 ${
                    captionFade ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {latestCaption.originalText}
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <div className="text-3xl mb-2">👂</div>
                <p className="text-base">スタッフのメッセージを待っています...</p>
              </div>
            )}
          </div>

          {/* Important items */}
          {importantItems.length > 0 && (
            <div className="px-4 py-3 space-y-2.5 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                重要事項
              </p>
              {importantItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 shadow-sm ${
                    item.priority === "urgent"
                      ? "bg-red-50 border-2 border-red-300"
                      : item.priority === "high"
                        ? "bg-amber-50 border-2 border-amber-300"
                        : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {ITEM_TYPE_ICONS[item.itemType] || "📌"}
                    </span>
                    <span
                      className="font-bold text-slate-800"
                      style={{ fontSize: `${fontSize - 2}px` }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    className="text-slate-700 leading-relaxed"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Message input & Confirmation buttons */}
          <div className="mt-auto px-4 py-4 bg-slate-50 border-t border-slate-200 safe-area-bottom">
            {lastAction && (
              <div className="text-center mb-2">
                <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-4 py-1 rounded-full">
                  ✓ スタッフに伝えました
                </span>
              </div>
            )}

            {/* Text input area */}
            {showInput ? (
              <div className="mb-3">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="メッセージを入力..."
                    disabled={sessionEnded || sending}
                    rows={2}
                    className="flex-1 border-2 border-emerald-300 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-40"
                    style={{ fontSize: `${Math.max(fontSize - 4, 14)}px` }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || sessionEnded || sending}
                    className="self-end px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-base hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm"
                  >
                    送信
                  </button>
                </div>
              </div>
            ) : null}

            {/* Toggle input button + confirmation buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setShowInput(!showInput);
                  if (!showInput) setTimeout(() => inputRef.current?.focus(), 100);
                }}
                disabled={sessionEnded}
                className={`py-3.5 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-40 shadow-sm ${
                  showInput
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-600 hover:bg-slate-700 text-white"
                }`}
                style={{ fontSize: `${Math.max(fontSize - 6, 12)}px` }}
              >
                <span className="block text-lg mb-0.5">✏️</span>
                {showInput ? "閉じる" : "文字で伝える"}
              </button>
              {CONFIRMATION_BUTTONS.slice(0, 2).map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => sendConfirmation(btn.type)}
                  disabled={sessionEnded}
                  className={`${btn.color} text-white py-3.5 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-40 shadow-sm`}
                  style={{ fontSize: `${Math.max(fontSize - 6, 12)}px` }}
                >
                  <span className="block text-lg mb-0.5">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {CONFIRMATION_BUTTONS.slice(2).map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => sendConfirmation(btn.type)}
                  disabled={sessionEnded}
                  className={`${btn.color} text-white py-3 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-40 shadow-sm`}
                  style={{ fontSize: `${Math.max(fontSize - 6, 12)}px` }}
                >
                  <span className="block text-lg mb-0.5">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Memo view */
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {importantItems.length > 0 && (
            <section>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                重要事項まとめ
              </p>
              <div className="space-y-2">
                {importantItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-3"
                  >
                    <p className="font-semibold text-sm text-slate-800">
                      {ITEM_TYPE_ICONS[item.itemType] || "📌"} {item.title}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              会話履歴
            </p>
            <div className="space-y-2">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-lg p-3 ${
                    t.speakerType === "visitor"
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-slate-50"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t.speakerType === "staff"
                      ? "スタッフ"
                      : t.speakerType === "visitor"
                        ? "あなた"
                        : "システム"}
                  </span>
                  <p className="text-sm text-slate-700 mt-0.5">{t.originalText}</p>
                </div>
              ))}
            </div>
          </section>
          <div ref={transcriptEndRef} />
        </div>
      )}
      <HelpGuide steps={VISITOR_SESSION_HELP_STEPS} buttonColor="emerald" />
    </div>
  );
}
