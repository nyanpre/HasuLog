// src/components/profile/PointDashboard.tsx
import { useState } from 'react';
import { X, Activity, Loader2 } from 'lucide-react'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { StreamDetailModal } from '../stream/StreamDetailModal'; 
import { FriendSocialModal } from './FriendSocialModal';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { StreamData } from '../../types';
import type { DayData } from '../../hooks/useDashboardData';

// 分割したコンポーネントのインポート
import { DashboardStats } from './dashboard/DashboardStats';
import { HeatmapSection } from './dashboard/HeatmapSection';
import { PointsChartSection } from './dashboard/PointsChartSection';
import { RecentActivitySection } from './dashboard/RecentActivitySection';
import { DayHistoryModal } from './dashboard/DayHistoryModal';

type Props = {
  onClose: () => void;
  targetUserId?: string; 
  targetUserName?: string; 
};

export const PointDashboard = ({ onClose, targetUserId, targetUserName }: Props) => {
  const { 
    userData, 
    myRecords, 
    myUpdateRecord, 
    heatMapData, 
    chartData, 
    recentHistory, 
    isLoading 
  } = useDashboardData(targetUserId);

  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);

  const handleOpenStreamDetail = async (streamId: string) => {
    try {
      const streamDoc = await getDoc(doc(db, "streams", streamId));
      if (streamDoc.exists()) {
        setSelectedStream({ id: streamDoc.id, ...streamDoc.data() } as StreamData);
      } else {
        alert("動画データが見つかりませんでした。");
      }
    } catch (e) {
      console.error(e);
      alert("動画データの取得に失敗しました。");
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center text-sm">
              <Activity className="w-4 h-4 mr-2 text-gray-800" />
              {targetUserName ? `${targetUserName} さんのアクティビティ` : 'アクティビティ'}
            </h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar space-y-8">
            <DashboardStats 
              totalPoints={userData?.totalPoints || 0}
              hasTargetUser={!!targetUserId}
              onOpenSocial={() => setShowSocialModal(true)}
            />

            <HeatmapSection 
              heatMapData={heatMapData} 
              onDayClick={setSelectedDayData} 
            />

            <PointsChartSection 
              chartData={chartData} 
            />

            <RecentActivitySection 
              recentHistory={recentHistory} 
              onStreamClick={handleOpenStreamDetail} 
            />
          </div>
        </div>
      </div>

      {/* --- モーダル群 --- */}
      {selectedDayData && (
        <DayHistoryModal 
          dayData={selectedDayData} 
          onClose={() => setSelectedDayData(null)} 
          onStreamClick={handleOpenStreamDetail} 
        />
      )}

      {selectedStream && (
        <StreamDetailModal 
          stream={selectedStream} 
          record={myRecords[selectedStream.id] || null}
          onClose={() => setSelectedStream(null)} 
          onUpdateRecord={myUpdateRecord}
        />
      )}

      {showSocialModal && targetUserId && (
        <FriendSocialModal 
          targetUserId={targetUserId} 
          targetUserName={targetUserName || userData?.displayName || 'ユーザー'} 
          onClose={() => setShowSocialModal(false)} 
        />
      )}
    </>
  );
};