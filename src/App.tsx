// src/App.tsx
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { Routes, Route } from 'react-router-dom';

// 既存のコンポーネントを読み込む
import Layout from './components/Layout';
import { StreamList } from './components/StreamList'; // 🌟 元のデータ表示コンポーネントを復活！

export default function App() {
  const { currentUser, loading } = useAuth();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("ログインエラー:", error);
    }
  };

  // 認証状態を確認中の場合はローディング表示（チラつき防止）
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // 🌟 ログイン済みの場合：HasuLogのメイン画面とルーティングを表示
  if (currentUser) {
    return (
      <Layout>
        {/* URLに応じて表示する中身を切り替える設定 */}
        <Routes>
          {/* ホーム（/）にアクセスしたときは、元の StreamList を表示 */}
          <Route path="/" element={<StreamList />} />
          
          {/* 履歴とマイページは、とりあえずの仮置き画面（後で拡張できます） */}
          <Route path="/history" element={<div className="p-8 text-center text-gray-500">履歴ページ（準備中）</div>} />
          <Route path="/profile" element={<div className="p-8 text-center text-gray-500">マイページ（準備中）</div>} />
        </Routes>
      </Layout>
    );
  }

  // 🌟 未ログインの場合：ログイン画面を表示
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-pink-500 tracking-wider">HasuLog</h1>
        <p className="text-gray-600 mb-8 text-sm">
          活動記録やWith×MEETSのデータを<br />管理・共有しよう
        </p>
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  );
}