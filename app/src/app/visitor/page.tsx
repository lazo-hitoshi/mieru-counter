"use client";

import { useState, useEffect } from "react";
import VisitorSession from "./session";
import { HelpGuide } from "@/components/help-guide";
import { HomeButton } from "@/components/home-button";

const VISITOR_JOIN_HELP_STEPS = [
  {
    icon: "👂",
    title: "利用者画面の使い方",
    description:
      "この画面から窓口セッションに参加できます。\nスタッフの言葉がリアルタイムで表示されます。",
  },
  {
    icon: "🔢",
    title: "接続コードを入力",
    description:
      "窓口のスタッフから8桁の接続コード\n（例: A1B2C3D4）を受け取り、\n上の入力欄に入力してください。",
  },
  {
    icon: "📱",
    title: "セッションに参加",
    description:
      "コードを入力したら「参加する」ボタンを\nタップしてください。\nスタッフの会話がリアルタイムで\n字幕表示されます。",
  },
  {
    icon: "✏️",
    title: "文字で伝える",
    description:
      "話すことが難しい方は\n「✏️ 文字で伝える」ボタンから\n文字を入力してスタッフに伝えられます。",
  },
  {
    icon: "👆",
    title: "確認ボタン",
    description:
      "「理解しました」「もう一度」「ゆっくり」など\nボタンを押すだけでスタッフに伝わります。\n声を出さなくても大丈夫です。",
  },
];

export default function VisitorPage() {
  const [sessionCode, setSessionCode] = useState("");
  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    facilityName: string;
    counterName: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setSessionCode(code.toUpperCase());
    }
  }, []);

  async function joinSession() {
    if (!sessionCode.trim()) return;
    setError("");

    const res = await fetch(
      `/api/sessions/join/${encodeURIComponent(sessionCode.trim().toUpperCase())}`
    );
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "セッションに接続できません");
      return;
    }

    const data = await res.json();
    setJoinedSessionId(data.sessionId);
    setSessionInfo({
      facilityName: data.facilityName,
      counterName: data.counterName,
    });

    await fetch(`/api/sessions/${data.sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
  }

  if (joinedSessionId && sessionInfo) {
    return (
      <VisitorSession
        sessionId={joinedSessionId}
        facilityName={sessionInfo.facilityName}
        counterName={sessionInfo.counterName}
      />
    );
  }

  return (
    <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-4 left-4">
        <HomeButton color="green" />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-900">Mieru Counter</h1>
          <p className="text-green-700 mt-2">窓口セッションに参加</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              接続コード
            </span>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinSession()}
              placeholder="例: A1B2C3D4"
              className="mt-1 block w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={8}
            />
          </label>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            onClick={joinSession}
            className="w-full py-3 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            参加する
          </button>
        </div>

        <p className="text-xs text-center text-green-600">
          窓口のスタッフから接続コードを受け取ってください
        </p>
      </div>
      <HelpGuide steps={VISITOR_JOIN_HELP_STEPS} buttonColor="emerald" />
    </main>
  );
}
