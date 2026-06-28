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
  sortOrder: number;
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [sessRes, templRes] = await Promise.all([
      fetch("/api/sessions"),
      fetch("/api/templates?includeInactive=1"),
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

  async function loadTemplates() {
    const res = await fetch("/api/templates?includeInactive=1");
    if (res.ok) setTemplates(await res.json());
  }

  function resetForm() {
    setFormCategory("");
    setFormTitle("");
    setFormBody("");
    setShowAddForm(false);
    setEditingId(null);
  }

  function startEdit(t: Template) {
    setEditingId(t.id);
    setFormCategory(t.category);
    setFormTitle(t.title);
    setFormBody(t.body);
    setShowAddForm(false);
  }

  async function handleSave() {
    if (!formCategory.trim() || !formTitle.trim() || !formBody.trim()) return;
    setSaving(true);

    if (editingId) {
      await fetch(`/api/templates/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          title: formTitle,
          bodyText: formBody,
        }),
      });
    } else {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          title: formTitle,
          bodyText: formBody,
        }),
      });
    }

    setSaving(false);
    resetForm();
    await loadTemplates();
  }

  async function toggleActive(t: Template) {
    await fetch(`/api/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    await loadTemplates();
  }

  async function handleDelete(t: Template) {
    if (!confirm(`「${t.title}」を削除しますか？`)) return;
    await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
    await loadTemplates();
  }

  async function moveOrder(t: Template, direction: "up" | "down") {
    const sameCategory = templates
      .filter((x) => x.category === t.category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sameCategory.findIndex((x) => x.id === t.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sameCategory.length) return;

    const other = sameCategory[swapIdx];
    await Promise.all([
      fetch(`/api/templates/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/templates/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: t.sortOrder }),
      }),
    ]);
    await loadTemplates();
  }

  const categories = [...new Set(templates.map((t) => t.category))];

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">定型文管理</h2>
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                ＋ 新規追加
              </button>
            </div>

            {(showAddForm || editingId) && (
              <div className="bg-white rounded-lg border border-blue-200 p-5 space-y-4">
                <h3 className="font-medium text-sm text-blue-800">
                  {editingId ? "定型文を編集" : "新しい定型文を追加"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ</label>
                    <input
                      list="category-list"
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="例: 挨拶、説明、確認"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="category-list">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">タイトル</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="例: お薬の説明"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">本文</label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="定型文の内容を入力してください"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formCategory.trim() || !formTitle.trim() || !formBody.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "保存中..." : editingId ? "更新する" : "追加する"}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
              {templates.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  定型文がありません。「＋ 新規追加」から登録してください。
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {templates.map((t, idx) => {
                    const sameCategory = templates.filter((x) => x.category === t.category);
                    const catIdx = sameCategory.findIndex((x) => x.id === t.id);
                    const isFirst = catIdx === 0;
                    const isLast = catIdx === sameCategory.length - 1;

                    return (
                      <div
                        key={t.id}
                        className={`p-4 flex items-start gap-3 ${!t.isActive ? "opacity-50" : ""} ${editingId === t.id ? "bg-blue-50" : "hover:bg-gray-50"} transition-colors`}
                      >
                        <div className="flex flex-col gap-0.5 pt-1">
                          <button
                            onClick={() => moveOrder(t, "up")}
                            disabled={isFirst}
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none"
                            title="上に移動"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveOrder(t, "down")}
                            disabled={isLast}
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none"
                            title="下に移動"
                          >
                            ▼
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {t.category}
                            </span>
                            <span className="font-medium text-sm">{t.title}</span>
                            {!t.isActive && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                無効
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{t.body}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleActive(t)}
                            className={`px-2 py-1 text-xs rounded ${t.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"} transition-colors`}
                            title={t.isActive ? "無効にする" : "有効にする"}
                          >
                            {t.isActive ? "無効化" : "有効化"}
                          </button>
                          <button
                            onClick={() => startEdit(t)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            title="編集"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            title="削除"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
