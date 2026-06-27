"use client";

import { useState } from "react";
import VisitorSession from "./session";

export default function VisitorPage() {
  const [sessionCode, setSessionCode] = useState("");
  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    facilityName: string;
    counterName: string;
  } | null>(null);
  const [error, setError] = useState("");

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
    <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
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
    </main>
  );
}
