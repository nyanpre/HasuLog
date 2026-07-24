// src/components/pages/Profile.tsx
import { User, Settings } from 'lucide-react';

export default function Profile() {
  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold flex items-center text-gray-800">
          <User className="mr-2 text-pink-500" size={24} />
          マイページ
        </h2>
        <button className="text-gray-400 p-1 active:scale-95">
          <Settings size={22} />
        </button>
      </div>

      {/* ユーザープロフィール（ダミー） */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 border-t-4 border-pink-400">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-2xl shadow-inner">
            A
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">Arai</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: 105-0000-0000</p>
          </div>
        </div>
        
        <div className="bg-pink-50 p-3 rounded-lg text-sm text-gray-700">
          <span className="font-bold text-pink-600 mr-2">推しメンバー:</span>
          藤島 慈
        </div>
      </div>

      {/* フレンド一覧（ダミー） */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-sm text-gray-700 mb-3 border-b border-gray-100 pb-2">交流リスト</h3>
        <ul className="space-y-4">
          {['にゃんぷれ', 'ゆゆきち', 'さく'].map((friend, i) => (
            <li key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full border border-gray-200"></div>
                <span className="text-sm font-medium text-gray-700">{friend}</span>
              </div>
              <button className="text-[10px] bg-pink-500 text-white px-2 py-1 rounded font-bold">
                詳細
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}