// src/components/pages/Timeline.tsx
import { FriendTimeline } from '../profile/FriendTimeline'; // 🌟 ここを正しいパスに修正しました！

export default function Timeline() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 h-[calc(100vh-80px)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">タイムライン</h2>
        <p className="text-sm text-gray-500 mt-1">
          フレンドの最近の視聴アクティビティをチェックしよう
        </p>
      </div>
      
      {/* コンポーネントが画面の高さいっぱいに広がるように設定 */}
      <div className="h-[calc(100%-90px)]">
        <FriendTimeline />
      </div>
    </div>
  );
}