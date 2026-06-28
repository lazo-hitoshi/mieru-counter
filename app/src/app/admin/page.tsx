"use client";

import { useState, useEffect } from "react";
import { HomeButton } from "@/components/home-button";

type Organization = {
  id: string;
  name: string;
  organizationType: string;
  status: string;
};

type Facility = {
  id: string;
  name: string;
  facilityType: string;
  address: string | null;
  status: string;
};

type Counter = {
  id: string;
  name: string;
  counterCode: string | null;
  qrToken: string;
  status: string;
};

type Template = {
  id: string;
  category: string;
  title: string;
  body: string;
  isActive: boolean;
};

type Session = {
  id: string;
  sessionCode: string;
  status: string;
  visitorLabel: string | null;
  counter: { name: string };
  createdAt: string;
  endedAt: string | null;
};

export default function AdminPage() {
  const [tab, setTab] = useState<"org" | "sessions" | "templates">("org");
  const [orgData, setOrgData] = useState<{
    organizations: Organization[];
    facilities: Facility[];
    counters: Counter[];
  }>({ organizations: [], facilities: [], counters: [] });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [sessRes, templRes] = await Promise.all([
      fetch("/api/sessions"),
      fetch("/api/templates"),
    ]);

    if (sessRes.ok) {
      const s = await sessRes.json();
      setSessions(s);

      if (s.length > 0 && s[0].counter) {
        const facilityId =
          s[0].facilityId || s[0].counter?.facilityId;
        if (facilityId) {
          const countersRes = await fetch(
            `/api/counters?facilityId=${facilityId}`
          );
          if (countersRes.ok) {
            const counters = await countersRes.json();
            setOrgData((prev) => ({ ...prev, counters }));
          }
        }
      }
    }
    if (templRes.ok) setTemplates(await templRes.json());
  }

  const tabs = [
    { id: "org" as const, label: "施設管理" },
    { id: "sessions" as const, label: "セッション履歴" },
    { id: "templates" as const, label: "定型文管理" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Mieru Counter 管理画面
        </h1>
        <HomeButton color="slate" />
      </header>

      <div className="flex border-b border-gray-200 bg-white px-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto p-6">
        {tab === "org" && (
          <div className="space-y-6">
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-semibold text-lg mb-4">窓口一覧</h2>
              <div className="space-y-3">
                {orgData.counters.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        コード: {c.counterCode || "なし"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          c.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.status === "active" ? "有効" : "無効"}
                      </span>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        QR: {c.qrToken.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
                {orgData.counters.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    窓口データがありません
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "sessions" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-lg">セッション履歴</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-3">コード</th>
                  <th className="px-6 py-3">窓口</th>
                  <th className="px-6 py-3">状態</th>
                  <th className="px-6 py-3">利用者</th>
                  <th className="px-6 py-3">開始</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="px-6 py-3 font-mono text-sm">
                      {s.sessionCode}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {s.counter?.name || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          s.status === "active"
                            ? "bg-green-100 text-green-700"
                            : s.status === "waiting"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status === "active"
                          ? "対応中"
                          : s.status === "waiting"
                            ? "待機中"
                            : "終了"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {s.visitorLabel || "-"}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">
                セッション履歴がありません
              </p>
            )}
          </div>
        )}

        {tab === "templates" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">定型文一覧</h2>
            <div className="space-y-3">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {t.category}
                      </span>
                      <span className="font-medium text-sm">{t.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{t.body}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      t.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.isActive ? "有効" : "無効"}
                  </span>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-gray-400 text-sm">
                  定型文がありません
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
