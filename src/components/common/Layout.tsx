// src/components/common/Layout.tsx
import { useState, type ReactNode } from "react";
import { Outlet, Link } from "react-router-dom";
// 🌟 修正: Clock を Rows3 (スレッド/行が流れるアイコン) に変更
import { Home, History, Rows3, User, Star, Archive } from "lucide-react"; 
import { HowToUseModal } from "./HowToUseModal";

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 pt-safe-top">
        <div className="relative px-4 py-3 flex justify-center items-center">
          <h1 className="text-xl font-bold text-pink-500 tracking-wider">HasuLog</h1>
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="absolute right-4 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
          >
            使い方
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {children || <Outlet />}
      </main>

      <nav className="bg-white border-t fixed bottom-0 w-full pb-safe-bottom z-10">
        {/* 🌟 px-[14px] で左右 padding を正確に 14px に指定 */}
        <div className="flex justify-between items-center h-[72px] pb-2 w-full px-[14px]">
          <Link to="/" className="flex-shrink-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Home size={22} />
            <span className="text-[10px] mt-1 whitespace-nowrap">ホーム</span>
          </Link>

          <Link to="/recommendation" className="flex-shrink-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Star size={22} />
            <span className="text-[10px] mt-1 whitespace-nowrap">おすすめ</span>
          </Link>

          <Link to="/related" className="flex-shrink-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Archive size={22} />
            <span className="text-[10px] mt-1 whitespace-nowrap">関連</span>
          </Link>

          <Link to="/history" className="flex-shrink-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <History size={22} />
            <span className="text-[10px] mt-1 whitespace-nowrap">履歴</span>
          </Link>
          
          {/* 🌟 -mx-1.5 で文字幅による間隔の広がりを約10%相殺 */}
          <Link to="/timeline" className="flex-shrink-0 -mx-1.5 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Rows3 size={22} />
            <span className="text-[10px] mt-1 whitespace-nowrap">タイムライン</span>
          </Link>
          
          <Link to="/profile" className="flex-shrink-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <User size={22} />
            <span className="text-[10px] mt-1 whitespace-nowrap">マイページ</span>
          </Link>
        </div>
      </nav>

      <HowToUseModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </div>
  );
}