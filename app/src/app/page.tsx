import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Mieru Counter</h1>
        <p className="text-lg text-gray-600 max-w-lg">
          聴覚障害者・難聴者・高齢者が窓口で会話内容を理解しやすくするサービス
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <Link
          href="/staff"
          className="block p-6 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <h2 className="text-xl font-semibold text-blue-900">スタッフ画面</h2>
          <p className="text-sm text-blue-700 mt-2">
            セッション管理・字幕送信・重要事項カード
          </p>
        </Link>

        <Link
          href="/visitor"
          className="block p-6 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
        >
          <h2 className="text-xl font-semibold text-green-900">利用者画面</h2>
          <p className="text-sm text-green-700 mt-2">
            字幕表示・重要事項確認・確認ボタン
          </p>
        </Link>

        <Link
          href="/lens"
          className="block p-6 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
        >
          <h2 className="text-xl font-semibold text-purple-900">
            Lens Preview
          </h2>
          <p className="text-sm text-purple-700 mt-2">
            Even G2相当のスマートグラス表示
          </p>
        </Link>

        <Link
          href="/admin"
          className="block p-6 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-900">管理画面</h2>
          <p className="text-sm text-gray-700 mt-2">
            施設・スタッフ・定型文管理
          </p>
        </Link>
      </div>
    </main>
  );
}
