// src/components/stream/StreamDetailModal.tsx
import { useState, useEffect } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from "../../contexts/AuthContext";
import { addWatchRecord, removeWatchRecord } from "../../utils/pointSystem";
import { WatchConfirmModal } from "../common/WatchConfirmModal";
import { usePublicMemos } from "../../hooks/usePublicMemos";
import { useUserData } from "../../hooks/useUserData";
import type { StreamData } from "../../types";
import type { StreamRecord } from "../../hooks/useUserRecords";

type Props = {
  stream: StreamData | null;
  record: StreamRecord | null;
  onClose: () => void;
  onUpdateRecord: (id: string, data: Partial<StreamRecord> & Record<string, any>) => Promise<void>;
  isRecommended?: boolean;
};

export const StreamDetailModal = ({ stream, record, onClose, onUpdateRecord, isRecommended = false }: Props) => {
  const { currentUser } = useAuth();
  const { userData } = useUserData();
  const [localMemo, setLocalMemo] = useState("");
  const [visibility, setVisibility] = useState<'private' | 'public_anonymous' | 'public_named'>('private');
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'youtube' | 'increase' | 'decrease'>('youtube');
  const [targetUrl, setTargetUrl] = useState<string>("");

  const { memos: publicMemos, loading: memosLoading, refetch: refetchMemos } = usePublicMemos(stream?.id);
  
  useEffect(() => {
    setLocalMemo(record?.memo || "");
    setVisibility(record?.memoVisibility || 'private');
    setSaveStatus("idle");
  }, [record, stream]);

  const handleSaveMemo = async () => {
    if (typeof onUpdateRecord !== 'function' || !stream) return;
    
    setSaveStatus("saving");
    try {
      await onUpdateRecord(stream.id, { 
        streamId: stream.id,
        memo: localMemo,
        memoVisibility: visibility,
        userName: currentUser?.displayName || '名無しユーザー',
        lastAction: 'memo',
        updatedAt: new Date().toISOString()
      });
      setSaveStatus("success");
      
      refetchMemos(); 
      
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。");
      setSaveStatus("idle");
    }
  };

  const toggleFavorite = () => {
    if (typeof onUpdateRecord !== 'function' || !stream) return;
    const currentFav = record?.isFavorite || false;
    onUpdateRecord(stream.id, { 
      isFavorite: !currentFav,
      lastAction: 'favorite',
      updatedAt: new Date().toISOString()
    });
  };

  const handleOpenYoutubeConfirm = (url: string) => {
    setTargetUrl(url);
    setActionMode('youtube');
    setIsConfirmOpen(true);
  };

  const handleOpenIncreaseConfirm = () => {
    setActionMode('increase');
    setIsConfirmOpen(true);
  };

  const handleOpenDecreaseConfirm = () => {
    if ((record?.viewCount || 0) > 0) {
      setActionMode('decrease');
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmWatch = () => {
    setIsConfirmOpen(false);

    if (currentUser && !currentUser.isAnonymous && stream) {
      if (actionMode === 'decrease') {
        removeWatchRecord(currentUser.uid, stream.id, stream.title).catch(console.error);
      } else {
        addWatchRecord(currentUser.uid, stream.id, stream.title, isRecommended).catch(console.error);
      }
    }

    if (actionMode === 'youtube' && targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSkipWatch = () => {
    setIsConfirmOpen(false);
    if (actionMode === 'youtube' && targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } 
  };

  // 🌟 公式・非公式とexModeの判定
  const isOfficialStream = stream ? (stream.is_official !== false && (stream.is_official as any) !== "false") : false;
  const isExUser = Boolean(currentUser && userData?.exMode === true);
  const isRestrictedType = stream ? (stream.type === "fes_live" || stream.type === "story") : false;

  // 🌟 サムネイル表示の判定 (非公式かつ制限されたタイプならexModeのみ表示)
  const shouldShowThumbnail = Boolean(stream?.thumbnailUrl) &&
    (!(isRestrictedType && !isOfficialStream) || isExUser);

  const canShowYoutubeLink = () => {
    if (!stream) return false;
    if (isOfficialStream) return true;
    return userData?.exMode === true;
  };

  // extraYoutubeUrls の正規化
  const getNormalizedExtraUrls = (): { label: string; url: string }[] => {
    if (!stream || !stream.extraYoutubeUrls) return [];
    
    if (typeof stream.extraYoutubeUrls === 'string') {
      const url = (stream.extraYoutubeUrls as string).trim();
      return url ? [{ label: '第二部', url }] : [];
    }

    if (Array.isArray(stream.extraYoutubeUrls)) {
      return stream.extraYoutubeUrls.map((item: any) => {
        if (typeof item === 'string') {
          return { label: '第二部', url: item };
        }
        return {
          label: item.label || '第二部',
          url: item.url || ''
        };
      }).filter(item => item.url);
    }

    return [];
  };

  const extraUrls = getNormalizedExtraUrls();
  const hasMultipleUrls = extraUrls.length > 0;

  return (
    <>
      <Dialog.Root open={!!stream} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" />
          
          <Dialog.Content 
            className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[85vh] overflow-hidden animate-slide-up sm:animate-fade-in outline-none mx-auto"
            aria-describedby={undefined}
          >
            {stream && (
              <>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <Dialog.Title className="font-bold text-gray-800 text-sm truncate flex items-center">
                    {isRecommended && (
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] px-2 py-0.5 rounded mr-2">
                        今日のおすすめ
                      </span>
                    )}
                    【 動画詳細 】
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg transition-colors">
                      ✕
                    </button>
                  </Dialog.Close>
                </div>

                <div className="overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                  
                  <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                    {shouldShowThumbnail ? (
                      <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words flex-grow">
                      {stream.title}
                    </h2>
                    <button 
                      onClick={toggleFavorite}
                      className={`flex-shrink-0 text-2xl transition-transform hover:scale-110 ${record?.isFavorite ? "text-yellow-400" : "text-gray-300"} ${currentUser?.isAnonymous ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={currentUser?.isAnonymous}
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

                  {stream.youtubeUrl && stream.youtubeUrl !== "" && canShowYoutubeLink() && (
                    <div className="flex flex-col gap-2 mb-6">
                      <button 
                        onClick={() => handleOpenYoutubeConfirm(stream.youtubeUrl)}
                        className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm text-sm transition-colors active:scale-[0.98]"
                      >
                        {hasMultipleUrls ? "YouTubeで開く【第一部】" : "YouTubeで開く"}
                        <span className="ml-2 text-xs font-normal text-white/70">
                          {isOfficialStream ? "(公式)" : "(非公式)"}
                        </span>
                      </button>

                      {hasMultipleUrls && (
                        extraUrls.map((extra, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleOpenYoutubeConfirm(extra.url)}
                            className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm text-sm transition-colors active:scale-[0.98]"
                          >
                            YouTubeで開く【第二部】
                            <span className="ml-2 text-xs font-normal text-white/70">
                              {isOfficialStream ? "(公式)" : "(非公式)"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {currentUser?.isAnonymous ? (
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      <div className="bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-500 font-bold border border-gray-200">
                        🔒 視聴記録やメモを保存するには、<br />Googleアカウントでのログインが必要です。
                      </div>
                    </div>
                  ) : (
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
                          <button onClick={handleOpenDecreaseConfirm} className="px-3 py-1 text-gray-600 hover:bg-gray-200">−</button>
                          <span className="px-3 py-1 text-xs text-gray-700 border-x border-gray-300 min-w-[6rem] text-center font-medium bg-white">
                            視聴回数：{record?.viewCount || 0}
                          </span>
                          <button onClick={handleOpenIncreaseConfirm} className="px-3 py-1 text-gray-600 hover:bg-gray-200">+</button>
                        </div>
                      </div>
                      
                      <textarea 
                        value={localMemo}
                        onChange={(e) => setLocalMemo(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-xs sm:text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 min-h-[100px] mb-2 shadow-sm bg-gray-50"
                        placeholder="感想や推しポイントを入力..."
                      ></textarea>

                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-3">
                        <select
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as 'private' | 'public_anonymous' | 'public_named')}
                          className="text-xs sm:text-sm py-2 pl-3 pr-8 border border-gray-300 rounded-lg shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white text-gray-700"
                        >
                          <option value="private">非公開（自分のみ）</option>
                          <option value="public_anonymous">公開（匿名）</option>
                          <option value="public_named">公開（名前を表示）</option>
                        </select>

                        <button 
                          onClick={handleSaveMemo}
                          disabled={saveStatus !== "idle"}
                          className={`w-full sm:w-auto px-5 py-2 font-bold rounded-lg text-xs sm:text-sm shadow-sm transition-colors ${
                            saveStatus === "success" ? "bg-green-500 text-white" :
                            saveStatus === "saving" ? "bg-blue-400 text-white cursor-not-allowed" :
                            "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {saveStatus === "success" ? "保存しました" : saveStatus === "saving" ? "保存中..." : "保存する"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-4">みんなのメモ</h4>
                    
                    {memosLoading ? (
                      <p className="text-xs text-gray-500">読み込み中...</p>
                    ) : publicMemos.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {publicMemos.map((m, index) => (
                          <div key={`${m.id}-${index}`} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-gray-700">
                                {m.visibility === 'public_named' ? (m.userName || '名無し') : '匿名ユーザー'}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(m.updatedAt).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.memo}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-4">まだ公開されたメモはありません。</p>
                    )}
                  </div>
                  
                </div>
                <div className="h-safe-bottom bg-white rounded-b-xl"></div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <WatchConfirmModal
        isOpen={isConfirmOpen}
        videoTitle={stream?.title || ""}
        actionType={actionMode}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmWatch}
        onSkip={handleSkipWatch}
      />
    </>
  );
};