import { Outlet, Link } from "react-router-dom";
import { Home, History, User } from "lucide-react";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10 pt-safe-top">
        <div className="px-4 py-3 text-center">
          <h1 className="text-xl font-bold text-pink-500 tracking-wider">HasuLog</h1>
        </div>
      </header>

      {/* メインコンテンツ（各画面がここに入ります） */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* ボトムナビゲーション */}
      <nav className="bg-white border-t fixed bottom-0 w-full pb-safe-bottom z-10">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <Home size={24} />
            <span className="text-[10px] mt-1">ホーム</span>
          </Link>
          <Link to="/history" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <History size={24} />
            <span className="text-[10px] mt-1">履歴</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <User size={24} />
            <span className="text-[10px] mt-1">マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}