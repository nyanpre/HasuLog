// src/components/Layout.tsx
import { Outlet, Link } from "react-router-dom";
import { Home, History, Clock, User, Star } from "lucide-react"; // 🌟 Starに変更
import { type ReactNode } from "react";

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 pt-safe-top">
        <div className="px-4 py-3 text-center">
          <h1 className="text-xl font-bold text-pink-500 tracking-wider">HasuLog</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children || <Outlet />}
      </main>

      <nav className="bg-white border-t fixed bottom-0 w-full pb-safe-bottom z-10">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <Home size={24} />
            <span className="text-[10px] mt-1">ホーム</span>
          </Link>

          {/* 🌟 シンプルな星アイコンに変更 */}
          <Link to="/recommendation" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <Star size={24} />
            <span className="text-[10px] mt-1">おすすめ</span>
          </Link>

          <Link to="/history" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <History size={24} />
            <span className="text-[10px] mt-1">履歴</span>
          </Link>
          <Link to="/timeline" className="flex flex-col items-center text-gray-500 hover:text-pink-500">
            <Clock size={24} />
            <span className="text-[10px] mt-1">タイムライン</span>
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