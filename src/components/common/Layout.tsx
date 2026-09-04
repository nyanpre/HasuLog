// src/components/common/Layout.tsx
import { useState, useEffect, type ReactNode } from "react";
import { Outlet, Link } from "react-router-dom";
import { Home, History, Rows3, User, Star, Archive } from "lucide-react"; 
import { HowToUseModal } from "./HowToUseModal";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { currentUser } = useAuth();
  
  // 🌟 初期値を localStorage から同期的に取得（画面リロード時のアイコンのチラつきを防止）
  const [isExMode, setIsExMode] = useState(() => {
    return localStorage.getItem('hasulog_isExMode') === 'true';
  });

  useEffect(() => {
    const checkExMode = async () => {
      // ゲストや未ログイン時は false にしてキャッシュも削除
      if (!currentUser || currentUser.isAnonymous) {
        setIsExMode(false);
        localStorage.removeItem('hasulog_isExMode');
        return;
      }

      // 🌟 すでにキャッシュがあればFirestore通信を完全にカット（サーバー負荷軽減）
      if (localStorage.getItem('hasulog_isExMode') !== null) {
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const enabled = !!userDoc.data().exMode;
          setIsExMode(enabled);
          localStorage.setItem('hasulog_isExMode', String(enabled));
        }
      } catch (error) {
        console.error("exMode取得エラー:", error);
      }
    };

    checkExMode();
  }, [currentUser]);

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
        <div className={`grid ${isExMode ? 'grid-cols-6' : 'grid-cols-5'} items-center h-[72px] pb-2 w-full px-[14px]`}>
          <Link to="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors min-w-0">
            <Home size={22} className="flex-shrink-0" />
            <span className="text-[10px] mt-1 truncate">ホーム</span>
          </Link>

          <Link to="/recommendation" className="flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors min-w-0">
            <Star size={22} className="flex-shrink-0" />
            <span className="text-[10px] mt-1 truncate">おすすめ</span>
          </Link>

          {isExMode && (
            <Link to="/related" className="flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors min-w-0">
              <Archive size={22} className="flex-shrink-0" />
              <span className="text-[10px] mt-1 truncate">関連</span>
            </Link>
          )}

          <Link to="/history" className="flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors min-w-0">
            <History size={22} className="flex-shrink-0" />
            <span className="text-[10px] mt-1 truncate">履歴</span>
          </Link>
          
          <Link to="/timeline" className="flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors min-w-0">
            <Rows3 size={22} className="flex-shrink-0" />
            <span className="text-[10px] mt-1 truncate">タイムライン</span>
          </Link>
          
          <Link to="/profile" className="flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors min-w-0">
            <User size={22} className="flex-shrink-0" />
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