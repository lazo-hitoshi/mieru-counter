"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSessionPolling } from "@/hooks/use-session-polling";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { HelpGuide } from "@/components/help-guide";
import { SessionCodeShare } from "@/components/session-code-share";
import { HomeButton } from "@/components/home-button";

const STAFF_HELP_STEPS = [
  {
    icon: "🏥",
    title: "スタッフ画面の使い方",
    description:
      "この画面では窓口セッションを管理し、\n利用者へメッセージを送信できます。",
  },
  {
    icon: "➕",
    title: "セッションの作成",
    description:
      "左サイドバーの「+ 新しいセッション」ボタンで\nセッションを作成します。\n表示される接続コード（8桁）を利用者にお伝えください。",
  },
  {
    icon: "💬",
    title: "メッセージの送信",
    description:
      "画面下部の入力欄にテキストを入力して送信します。\n🎙️ボタンで音声入力も可能です。\n📋ボタンで定型文を選択できます。",
  },
  {
    icon: "👂",
    title: "利用者からの反応",
    description:
      "利用者が「理解しました」「もう一度」などの\nボタンを押すと、画面に通知が表示されます。\n利用者からのテキストメッセージも表示されます。",
  },
  {
    icon: "📋",
    title: "重要事項カード",
    description:
      "会話の中から重要な情報（薬の名前、\n予約日時、支払い金額など）が\n自動で抽出されます。\n確認して利用者に送信できます。",
  },
  {
    icon: "📢",
    title: "呼び出し機能",
    description:
      "「📢 呼び出し」ボタンで利用者の端末に\n呼び出し番号を大きく表示できます。\n待合室にいる利用者を呼ぶ時に便利です。",
  },
];

type Session = {
  id: string;
  sessionCode: string;
  status: string;
  visitorLabel: string | null;
  counter: { name: string };
  staffUser: { id: string; name: string } | null;
  createdAt: string;
};

type TranscriptEntry = {
  id: string;
  speakerType: string;
  speakerName: string | null;
  originalText: string;
  displayText: string;
  source: string;
  createdAt: string;
};

type ImportantItem = {
  id: string;
  itemType: string;
  title: string;
  body: string;
  priority: string;
  reviewStatus: string;
  extractionSource: string;
  sessionId: string;
};

type ConfirmationAction = {
  id: string;
  actionType: string;
  message: string | null;
  createdAt: string;
};

type Template = {
  id: string;
  category: string;
  title: string;
  body: string;
};

const ACTION_LABELS: Record<string, string> = {
  understood: "理解しました",
  repeat: "もう一度お願いします",
  slower: "ゆっくりお願いします",
  write_text: "文字でください",
  sign_language: "手話通訳が必要です",
  help: "助けが必要です",
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  medicine: "💊 薬",
  appointment: "📅 予約",
  payment: "💰 支払い",
  place: "📍 場所",
  document: "📄 書類",
  warning: "⚠️ 注意",
  next_action: "➡️ 次の行動",
  other: "📌 その他",
};

const PRIORITY_STYLES: Record<string, string> = {
  normal: "bg-slate-100 text-slate-600 border-slate-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  reception: "🏥 受付",
  medicine: "💊 服薬",
  payment: "💰 会計",
  guidance: "📋 案内",
  document: "📄 書類",
};

export default function StaffPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [importantItems, setImportantItems] = useState<ImportantItem[]>([]);
  const [confirmations, setConfirmations] = useState<ConfirmationAction[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [inputText, setInputText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [newConfirmations, setNewConfirmations] = useState<string[]>([]);
  const [callNumber, setCallNumber] = useState("");
  const [showCallInput, setShowCallInput] = useState(false);
  const [showCodeShare, setShowCodeShare] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState("");
  const [staffDisplayName, setStaffDisplayName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mieru-staff-name") || "";
    }
    return "";
  });
  const [showStaffNameEdit, setShowStaffNameEdit] = useState(false);
  const [staffNameInput, setStaffNameInput] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Polling for real-time updates
  useSessionPolling(activeSession?.id || null, {
    onTranscripts: useCallback((items: unknown[]) => {
      setTranscripts((prev) => [...prev, ...(items as TranscriptEntry[])]);
    }, []),
    onConfirmations: useCallback((items: unknown[]) => {
      const actions = items as ConfirmationAction[];
      setConfirmations((prev) => [...actions, ...prev]);
      setNewConfirmations((prev) => [...prev, ...actions.map((a) => a.id)]);
      for (const action of actions) {
        setTimeout(() => {
          setNewConfirmations((prev) => prev.filter((id) => id !== action.id));
        }, 8000);
      }
    }, []),
    onImportantItems: useCallback((items: unknown[]) => {
      setImportantItems(items as ImportantItem[]);
    }, []),
    onSessionEnded: useCallback(() => {
      setActiveSession((prev) => prev ? { ...prev, status: "ended" } : null);
      loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  });

  // Speech recognition
  const speech = useSpeechRecognition({
    lang: "ja-JP",
    onResult: useCallback(
      (text: string, isFinal: boolean) => {
        if (isFinal) {
          setInputText((prev) => (prev ? prev + " " + text : text));
        }
      },
      []
    ),
  });

  useEffect(() => {
    loadSessions();
    loadTemplates();
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  async function loadSessions() {
    const res = await fetch("/api/sessions");
    if (res.ok) setSessions(await res.json());
  }

  async function loadTemplates() {
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
  }

  function openNewSessionModal() {
    setNewVisitorName("");
    setShowNewSessionModal(true);
  }

  async function createSession() {
    const facilitiesRes = await fetch("/api/facilities");
    if (!facilitiesRes.ok) return;

    const facilities = await facilitiesRes.json();
    if (facilities.length === 0 || facilities[0].counters.length === 0) {
      alert("窓口が見つかりません。シードデータを作成してください。");
      return;
    }

    const payload: Record<string, unknown> = {
      counterId: facilities[0].counters[0].id,
    };
    if (newVisitorName.trim()) {
      payload.visitorLabel = newVisitorName.trim();
    }
    if (staffDisplayName) {
      payload.staffDisplayName = staffDisplayName;
    }

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const newSession = await res.json();
      setShowNewSessionModal(false);
      await loadSessions();
      selectSession(newSession);
    }
  }

  function saveStaffName() {
    const name = staffNameInput.trim();
    setStaffDisplayName(name);
    localStorage.setItem("mieru-staff-name", name);
    setShowStaffNameEdit(false);
  }

  async function selectSession(session: Session) {
    setActiveSession(session);
    setNewConfirmations([]);
    const res = await fetch(`/api/sessions/${session.id}`);
    if (res.ok) {
      const data = await res.json();
      setTranscripts(data.transcriptEntries || []);
      setImportantItems(data.importantItems || []);
      setConfirmations(data.confirmationActions || []);
    }
  }

  async function sendText(text: string) {
    if (!activeSession || !text.trim() || sending) return;
    setSending(true);

    try {
      const [transcriptRes] = await Promise.all([
        fetch(`/api/sessions/${activeSession.id}/transcripts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), speakerType: "staff", source: "manual" }),
        }),
        fetch(`/api/sessions/${activeSession.id}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        }),
      ]);

      if (transcriptRes.ok) setInputText("");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function sendCall() {
    if (!activeSession || !callNumber.trim()) return;
    await fetch(`/api/sessions/${activeSession.id}/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callNumber: callNumber.trim() }),
    });
    setCallNumber("");
    setShowCallInput(false);
  }

  async function sendImportantItem(itemId: string) {
    await fetch(`/api/important-items/${itemId}/send`, { method: "POST" });
  }

  async function confirmItem(itemId: string) {
    const res = await fetch(`/api/important-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus: "staff_confirmed" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setImportantItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
    }
  }

  async function dismissItem(itemId: string) {
    const res = await fetch(`/api/important-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus: "dismissed" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setImportantItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
    }
  }

  async function endSession() {
    if (!activeSession) return;
    if (!confirm("セッションを終了しますか？")) return;
    await fetch(`/api/sessions/${activeSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" }),
    });
    setActiveSession(null);
    setTranscripts([]);
    setImportantItems([]);
    setConfirmations([]);
    loadSessions();
  }

  const templatesByCategory = templates.reduce<Record<string, Template[]>>(
    (acc, t) => {
      (acc[t.category] = acc[t.category] || []).push(t);
      return acc;
    },
    {}
  );

  const activeItems = importantItems.filter((i) => i.reviewStatus !== "dismissed");
  const candidateCount = activeItems.filter((i) => i.reviewStatus === "candidate").length;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">MC</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Mieru Counter</h1>
              <p className="text-xs text-slate-400">スタッフ画面</p>
            </div>
          </div>
          <div className="mt-3">
            <HomeButton color="slate" />
          </div>
        </div>

        <div className="p-3 space-y-2">
          <button
            onClick={openNewSessionModal}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all text-sm font-medium shadow-sm"
          >
            + 新しいセッション
          </button>
          <button
            onClick={() => { setStaffNameInput(staffDisplayName); setShowStaffNameEdit(true); }}
            className="w-full py-2 px-4 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-xs"
          >
            {staffDisplayName ? `担当: ${staffDisplayName}` : "担当者名を設定"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-blue-50/50 transition-colors ${
                activeSession?.id === s.id
                  ? "bg-blue-50 border-l-[3px] border-l-blue-600"
                  : "border-l-[3px] border-l-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-slate-700">
                  {s.sessionCode}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    s.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : s.status === "waiting"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.status === "active" ? "対応中" : s.status === "waiting" ? "待機中" : "終了"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {s.counter?.name} · {s.visitorLabel || "利用者"}
              </p>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-slate-400">セッションがありません</p>
              <p className="text-xs text-slate-300 mt-1">
                上のボタンから作成できます
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeSession ? (
          <>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-800">
                      {activeSession.sessionCode}
                    </h2>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        activeSession.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : activeSession.status === "ended"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {activeSession.status === "active" ? "対応中" : activeSession.status === "ended" ? "終了" : "待機中"}
                    </span>
                  </div>
                  {activeSession.visitorLabel && (
                    <p className="text-sm text-slate-700 font-medium mt-0.5">
                      患者: {activeSession.visitorLabel}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    接続コード:{" "}
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                      {activeSession.sessionCode}
                    </code>
                    <button
                      onClick={() => setShowCodeShare(true)}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium hover:bg-blue-200 transition-colors"
                    >
                      📲 共有
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {newConfirmations.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full animate-pulse font-medium shadow-sm">
                    利用者から反応あり
                  </span>
                )}
                <button
                  onClick={() => setShowCallInput(!showCallInput)}
                  className="text-sm px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  📢 呼び出し
                </button>
                <button
                  onClick={endSession}
                  className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  終了
                </button>
              </div>
            </header>

            {/* Call number input */}
            {showCallInput && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
                <span className="text-sm text-amber-800 font-medium">呼び出し番号:</span>
                <input
                  type="text"
                  value={callNumber}
                  onChange={(e) => setCallNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCall()}
                  placeholder="例: 15"
                  className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={sendCall}
                  className="text-sm px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  送信
                </button>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Transcript area */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Transcript messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {transcripts.length === 0 && (
                    <div className="text-center py-16 text-slate-300">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-sm">メッセージを送信して会話を始めましょう</p>
                    </div>
                  )}
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      className={`flex ${t.speakerType === "staff" ? "justify-end" : "justify-start"} animate-[fadeIn_0.2s_ease-out]`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl px-4 py-2.5 shadow-sm ${
                          t.speakerType === "staff"
                            ? "bg-blue-600 text-white rounded-br-md"
                            : t.speakerType === "system"
                              ? "bg-slate-100 text-slate-500 text-sm italic"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <p className={`text-[10px] mb-0.5 ${t.speakerType === "staff" ? "text-blue-200" : "text-slate-400"}`}>
                          {t.speakerType === "staff" ? "スタッフ" : t.speakerType === "system" ? "システム" : "利用者"}
                          {t.source === "template" && " · 定型文"}
                          {t.source === "speech_to_text" && " · 音声入力"}
                        </p>
                        <p className="text-[15px] leading-relaxed">{t.originalText}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>

                {/* Confirmation actions */}
                {confirmations.length > 0 && (
                  <div className="px-6 py-2.5 border-t border-slate-100 bg-slate-50/80">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      利用者の反応
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {confirmations.slice(0, 8).map((c) => (
                        <span
                          key={c.id}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                            c.actionType === "understood"
                              ? "bg-emerald-100 text-emerald-700"
                              : c.actionType === "repeat" || c.actionType === "slower"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-purple-100 text-purple-700"
                          } ${newConfirmations.includes(c.id) ? "ring-2 ring-offset-1 ring-orange-400 scale-105" : ""}`}
                        >
                          {ACTION_LABELS[c.actionType] || c.actionType}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="border-t border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={`shrink-0 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                        showTemplates
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      📋
                    </button>

                    {speech.isSupported && (
                      <button
                        onClick={speech.toggleListening}
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          speech.isListening
                            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                            : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                        title={speech.isListening ? "音声入力を停止" : "音声入力を開始"}
                      >
                        🎙️
                      </button>
                    )}

                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            sendText(inputText);
                          }
                        }}
                        placeholder={
                          speech.isListening
                            ? "音声を認識中..."
                            : "メッセージを入力..."
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-slate-300"
                        disabled={activeSession.status === "ended"}
                      />
                      {speech.isListening && speech.interimText && (
                        <p className="absolute -top-6 left-0 text-xs text-red-400 italic truncate max-w-full">
                          {speech.interimText}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => sendText(inputText)}
                      disabled={!inputText.trim() || sending || activeSession.status === "ended"}
                      className="shrink-0 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      {sending ? "..." : "送信"}
                    </button>
                  </div>

                  {/* Templates panel */}
                  {showTemplates && (
                    <div className="mt-3 border border-slate-200 rounded-xl p-3 max-h-52 overflow-y-auto bg-slate-50/50">
                      {Object.entries(templatesByCategory).map(([cat, temps]) => (
                        <div key={cat} className="mb-3 last:mb-0">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            {CATEGORY_LABELS[cat] || cat}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {temps.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => {
                                  sendText(t.body);
                                  setShowTemplates(false);
                                }}
                                className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
                                title={t.body}
                              >
                                {t.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar - Important items */}
              <aside className="w-80 border-l border-slate-200 bg-white overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-slate-700">重要事項カード</h3>
                    {candidateCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                        {candidateCount}件の候補
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {activeItems.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-xl p-3.5 transition-all ${
                          item.reviewStatus === "sent"
                            ? "border-emerald-200 bg-emerald-50/50"
                            : item.reviewStatus === "staff_confirmed"
                              ? "border-blue-200 bg-blue-50/50"
                              : "border-amber-200 bg-amber-50/50 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-slate-500">
                            {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[item.priority]}`}
                          >
                            {item.priority === "urgent" ? "緊急" : item.priority === "high" ? "重要" : "通常"}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-slate-800">{item.title}</p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.body}</p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <span className={`text-[10px] font-medium ${
                            item.reviewStatus === "sent"
                              ? "text-emerald-600"
                              : item.reviewStatus === "staff_confirmed"
                                ? "text-blue-600"
                                : "text-amber-600"
                          }`}>
                            {item.reviewStatus === "sent"
                              ? "✓ 送信済み"
                              : item.reviewStatus === "staff_confirmed"
                                ? "✓ 確認済み"
                                : "AI候補"}
                          </span>

                          {item.reviewStatus === "candidate" && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => dismissItem(item.id)}
                                className="text-xs px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                却下
                              </button>
                              <button
                                onClick={() => confirmItem(item.id)}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                              >
                                確認
                              </button>
                            </div>
                          )}
                          {item.reviewStatus === "staff_confirmed" && (
                            <button
                              onClick={() => sendImportantItem(item.id)}
                              className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm"
                            >
                              利用者へ送信
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {activeItems.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm text-slate-400">重要事項はまだありません</p>
                        <p className="text-xs text-slate-300 mt-1">
                          会話から自動抽出されます
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🏥</div>
              <p className="text-lg text-slate-500 font-medium">
                セッションを選択してください
              </p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">
                左のサイドバーからセッションを選択するか、
                新しいセッションを作成してください
              </p>
            </div>
          </div>
        )}
      </main>
      <HelpGuide steps={STAFF_HELP_STEPS} buttonColor="blue" />
      {showCodeShare && activeSession && (
        <SessionCodeShare
          sessionCode={activeSession.sessionCode}
          onClose={() => setShowCodeShare(false)}
        />
      )}

      {/* New session modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">新しいセッション</h3>
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-700">患者名（利用者名）</span>
              <input
                type="text"
                value={newVisitorName}
                onChange={(e) => setNewVisitorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createSession()}
                placeholder="例: 山田太郎"
                className="mt-1 block w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">
                処方箋の患者名と番号を照合するために入力してください
              </p>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={createSession}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff name edit modal */}
      {showStaffNameEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">担当者名の設定</h3>
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-700">表示名</span>
              <input
                type="text"
                value={staffNameInput}
                onChange={(e) => setStaffNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveStaffName()}
                placeholder="例: 田中"
                className="mt-1 block w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">
                利用者画面に「担当: ○○」と表示されます。空欄で非表示にできます。
              </p>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStaffNameEdit(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={saveStaffName}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
