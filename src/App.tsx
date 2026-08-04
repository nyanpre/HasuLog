// src/App.tsx
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { Routes, Route, Navigate } from 'react-router-dom';

import { StreamProvider } from './contexts/StreamContext';
// 🌟 新しく作成した Provider をインポート
import { UserRecordsProvider } from './contexts/UserRecordsContext';

import Layout from './components/common/Layout';
import { StreamList } from './components/stream/StreamList';
import Profile from './components/pages/Profile';
import { History } from './components/pages/History';
import Timeline from './components/pages/Timeline';
import Recommendation from './components/pages/Recommendation';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (currentUser) {
    return (
      // 🌟 UserRecordsProvider と StreamProvider でアプリ全体を囲む
      <UserRecordsProvider>
        <StreamProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<StreamList />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="recommendation" element={<Recommendation />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </StreamProvider>
      </UserRecordsProvider>
    );
  }

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