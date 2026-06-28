"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

export function SessionCodeShare({
  sessionCode,
  onClose,
}: {
  sessionCode: string;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"both" | "qr" | "text">("both");

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/visitor?code=${sessionCode}`
      : "";

  useEffect(() => {
    if (!joinUrl) return;
    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [joinUrl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">📲 接続コード共有</h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { key: "both" as const, label: "両方表示" },
            { key: "qr" as const, label: "QRコードのみ" },
            { key: "text" as const, label: "コードのみ" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === tab.key
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-center text-sm text-slate-500 mb-4">
            利用者にこの画面を見せてください
          </p>

          {(mode === "both" || mode === "qr") && (
            <div className="flex flex-col items-center mb-4">
              <p className="text-xs text-slate-400 mb-2">
                📱 スマホのカメラで読み取り
              </p>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QRコード"
                  className="w-56 h-56 border-4 border-slate-100 rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 rounded-xl flex items-center justify-center">
                  <span className="text-slate-400 text-sm">生成中...</span>
                </div>
              )}
            </div>
          )}

          {mode === "both" && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">または</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {(mode === "both" || mode === "text") && (
            <div className="flex flex-col items-center">
              <p className="text-xs text-slate-400 mb-2">
                🔢 このコードを入力してください
              </p>
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-8 py-5">
                <p
                  className="font-mono font-bold text-slate-800 tracking-[0.3em] text-center"
                  style={{ fontSize: mode === "text" ? "56px" : "40px" }}
                >
                  {sessionCode}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                利用者画面（mieru-counter.vercel.app/visitor）で入力
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
