// src/components/common/Layout.tsx
import { useState, type ReactNode } from "react";
import { Outlet, Link } from "react-router-dom";
import { Home, History, Clock, User, Star, Archive } from "lucide-react"; 
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
        {/* 🌟 flex-1 で全アイテムの横幅を均一化し、左右端は余計に広げない設定 */}
        <div className="flex items-center h-[72px] pb-2 w-full px-1">
          <Link to="/" className="flex-1 min-w-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Home size={22} />
            <span className="text-[10px] mt-1 truncate">ホーム</span>
          </Link>

          <Link to="/recommendation" className="flex-1 min-w-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Star size={22} />
            <span className="text-[10px] mt-1 truncate">おすすめ</span>
          </Link>

          <Link to="/related" className="flex-1 min-w-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Archive size={22} />
            <span className="text-[10px] mt-1 truncate">関連</span>
          </Link>

          <Link to="/history" className="flex-1 min-w-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <History size={22} />
            <span className="text-[10px] mt-1 truncate">履歴</span>
          </Link>
          
          <Link to="/timeline" className="flex-1 min-w-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <Clock size={22} />
            <span className="text-[10px] mt-1 truncate">タイムライン</span>
          </Link>
          
          <Link to="/profile" className="flex-1 min-w-0 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
            <User size={22} />
            <span className="text-[10px] mt-1 truncate">マイページ</span>
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