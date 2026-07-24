// src/components/pages/History.tsx
import { Clock } from 'lucide-react';

export default function History() {
  return (
    <div className="p-4 pb-20">
      <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
        <Clock className="mr-2 text-pink-500" size={24} />
        視聴・メモ履歴
      </h2>

      <div className="space-y-3">
        {/* ダミーの履歴アイテム */}
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white p-3 rounded-lg shadow-sm flex items-start space-x-3 cursor-pointer active:scale-95 transition-transform">
            <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0 relative overflow-hidden">
              <img src={`https://images.unsplash.com/photo-1516280440502-85f541f7e025?w=500&q=80&sig=${item}`} alt="サムネイル" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 mb-1">今日 19:30</p>
              <h3 className="text-xs font-bold line-clamp-2 mb-1 text-gray-700">【103期第1話】せーので！ はすのそら！</h3>
              <p className="text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded line-clamp-1 border border-gray-100">
                最高でした...！これからの展開が楽しみ。
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}