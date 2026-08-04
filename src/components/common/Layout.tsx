// src/components/Layout.tsx
import { useState, type ReactNode } from "react";
import { Outlet, Link } from "react-router-dom";
import { Home, History, Clock, User, Star } from "lucide-react"; 
import { HowToUseModal } from "./HowToUseModal";

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // 🌟 追加: モーダルの開閉状態を管理するState
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 pt-safe-top">
        {/* 🌟 修正: relative を追加して中のボタンを右端に絶対配置できるようにする */}
        <div className="relative px-4 py-3 flex justify-center items-center">
          <h1 className="text-xl font-bold text-pink-500 tracking-wider">HasuLog</h1>
          
          {/* 🌟 追加: 使い方ボタン（アイコンなし・テキストのみのシンプルなデザイン） */}
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="absolute right-4 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
          >
            使い方
          </button>
        </div>
      </header>

      {/* 🌟 メニューバーが高くなる分、一番下のコンテンツが隠れないように pb-20 を pb-24 に変更 */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children || <Outlet />}
      </main>

      <nav className="bg-white border-t fixed bottom-0 w-full pb-safe-bottom z-10">
        {/* 🌟 h-16 を h-[72px] に変更して少し高くし、pb-2 (約8px) でアイコン全体を上に押し上げます */}
        <div className="flex justify-around items-center h-[72px] pb-2">
          <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-pink-500 transition-colors">
            <Home size={24} />
            <span className="text-[10px] mt-1">ホーム</span>
          </Link>

          <Link to="/recommendation" className="flex flex-col items-center text-gray-500 hover:text-pink-500 transition-colors">
            <Star size={24} />
            <span className="text-[10px] mt-1">おすすめ</span>
          </Link>

          <Link to="/history" className="flex flex-col items-center text-gray-500 hover:text-pink-500 transition-colors">
            <History size={24} />
            <span className="text-[10px] mt-1">履歴</span>
          </Link>
          
          <Link to="/timeline" className="flex flex-col items-center text-gray-500 hover:text-pink-500 transition-colors">
            <Clock size={24} />
            <span className="text-[10px] mt-1">タイムライン</span>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center text-gray-500 hover:text-pink-500 transition-colors">
            <User size={24} />
            <span className="text-[10px] mt-1">マイページ</span>
          </Link>
        </div>
      </nav>

      {/* 🌟 追加: モーダル本体（isOpenがtrueの時だけ画面の手前に表示される） */}
      <HowToUseModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </div>
  );
}