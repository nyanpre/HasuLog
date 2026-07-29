// src/components/stream/StreamDetailModal.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { addWatchRecord } from "../../utils/pointSystem";
import { WatchConfirmModal } from "../common/WatchConfirmModal";
import type { StreamData } from "../../types";
import type { StreamRecord } from "../../hooks/useUserRecords";

type Props = {
  stream: StreamData | null;
  record: StreamRecord | null;
  onClose: () => void;
  onUpdateRecord: (id: string, data: Partial<StreamRecord>) => Promise<void>;
};

export const StreamDetailModal = ({ stream, record, onClose, onUpdateRecord }: Props) => {
  const { currentUser } = useAuth();
  const [localMemo, setLocalMemo] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  
  // 🌟 確認モーダルの開閉と、アクションの種類を管理するステート
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'youtube' | 'manual'>('youtube');

  useEffect(() => {
    setLocalMemo(record?.memo || "");
    setSaveStatus("idle");
  }, [record, stream]);

  if (!stream) return null;

  const handleSaveMemo = async () => {
    if (typeof onUpdateRecord !== 'function') return;
    
    setSaveStatus("saving");
    try {
      await onUpdateRecord(stream.id, { memo: localMemo });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。");
      setSaveStatus("idle");
    }
  };

  const handleUpdateViewCount = (delta: number) => {
    if (typeof onUpdateRecord !== 'function') return;
    const current = record?.viewCount || 0;
    onUpdateRecord(stream.id, { viewCount: Math.max(0, current + delta) });
  };

  const toggleFavorite = () => {
    if (typeof onUpdateRecord !== 'function') return;
    const currentFav = record?.isFavorite || false;
    onUpdateRecord(stream.id, { isFavorite: !currentFav });
  };

  // 🌟 YouTubeで開くボタンを押した時
  const handleOpenYoutubeConfirm = () => {
    setActionMode('youtube');
    setIsConfirmOpen(true);
  };

  // 🌟 +ボタン（手動）を押した時
  const handleOpenManualConfirm = () => {
    setActionMode('manual');
    setIsConfirmOpen(true);
  };

  // 🌟 [はい（ポイント獲得）] を押した時の処理
  const handleConfirmWatch = async () => {
    setIsConfirmOpen(false);
    if (currentUser) {
      try {
        await addWatchRecord(currentUser.uid, stream.id, stream.title);
        // addWatchRecord 内で viewCount は +1 され、onSnapshot 経由で画面に自動反映されます
      } catch (error) {
        console.error("記録に失敗しました", error);
      }
    }
    // YouTubeボタン経由だった場合のみ別タブで開く
    if (actionMode === 'youtube') {
      window.open(stream.youtubeUrl, "_blank");
    }
  };

  // 🌟 [いいえ（動画を見るだけ / 回数のみ追加）] を押した時の処理
  const handleSkipWatch = () => {
    setIsConfirmOpen(false);
    if (actionMode === 'youtube') {
      window.open(stream.youtubeUrl, "_blank");
    } else {
      // 手動追加（ポイントなし）の場合は回数のみ +1
      handleUpdateViewCount(1);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
        <div className="bg-white w-full max-w-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-fade-in">
          
          <div className="flex justify-between items-center p-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm truncate">【 動画詳細 】</h3>
            <button onClick={onClose} className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">✕</button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            
            <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              {stream.thumbnailUrl ? (
                <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
              )}
            </div>

            <div className="flex justify-between items-start gap-4 mb-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words flex-grow">
                {stream.title}
              </h2>
              <button 
                onClick={toggleFavorite}
                className={`flex-shrink-0 text-2xl transition-transform hover:scale-110 ${record?.isFavorite ? "text-yellow-400" : "text-gray-300"}`}
                title={record?.isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
              >
                {record?.isFavorite ? "★" : "☆"}
              </button>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
              <p><strong>配信日:</strong> {stream.date}</p>
              <p className="w-full mt-1"><strong>出演:</strong> {stream.participants || "不明"}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {stream.description || "公式概要やあらすじはありません。"}
              </p>
            </div>

            {/* 🌟 onClick の対象を handleOpenYoutubeConfirm に変更 */}
            {stream.youtubeUrl && (
              <button 
                onClick={handleOpenYoutubeConfirm}
                className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg mb-6 shadow-sm text-sm transition-colors active:scale-[0.98]"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTubeで開く
              </button>
            )}

            <div className="border-t border-gray-200 pt-4 pb-2 mt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-800">視聴メモ</h4>
                  {record?.updatedAt && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      (最終更新: {new Date(record.updatedAt).toLocaleDateString('ja-JP')})
                    </span>
                  )}
                </div>
                
                <div className="flex items-center border border-gray-300 rounded bg-gray-50 overflow-hidden shadow-sm">
                  <button onClick={() => handleUpdateViewCount(-1)} className="px-3 py-1 text-gray-600 hover:bg-gray-200">−</button>
                  <span className="px-3 py-1 text-xs text-gray-700 border-x border-gray-300 min-w-[6rem] text-center font-medium bg-white">
                    視聴回数：{record?.viewCount || 0}
                  </span>
                  {/* 🌟 onClick の対象を handleOpenManualConfirm に変更 */}
                  <button onClick={handleOpenManualConfirm} className="px-3 py-1 text-gray-600 hover:bg-gray-200">+</button>
                </div>
              </div>
              
              <textarea 
                value={localMemo}
                onChange={(e) => setLocalMemo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-xs sm:text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 min-h-[100px] mb-3 shadow-sm bg-gray-50"
                placeholder="感想や推しポイントを入力..."
              ></textarea>
              
              <button 
                onClick={handleSaveMemo}
                disabled={saveStatus !== "idle"}
                className={`w-full sm:w-auto px-5 py-2 font-bold rounded-lg text-xs sm:text-sm shadow-sm transition-colors ${
                  saveStatus === "success" ? "bg-green-500 text-white" :
                  saveStatus === "saving" ? "bg-blue-400 text-white cursor-not-allowed" :
                  "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                  <span className="flex items-center justify-center">
                      {saveStatus === "success" ? (
                          <><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 保存しました！</>
                      ) : saveStatus === "saving" ? (
                          <><svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> 保存中...</>
                      ) : (
                          <><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> 保存する</>
                      )}
                  </span>
              </button>
            </div>
          </div>
          <div className="h-safe-bottom bg-white rounded-b-xl"></div>
        </div>
      </div>

      {/* 🌟 確認用ポップアップ */}
      <WatchConfirmModal
        isOpen={isConfirmOpen}
        videoTitle={stream.title}
        actionType={actionMode} // 🌟 'youtube' か 'manual' かを渡す
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmWatch}
        onSkip={handleSkipWatch}
      />
    </>
  );
};