// src/components/pages/GamesHub.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, HelpCircle, ChevronRight, Lock } from 'lucide-react';

interface GameInfo {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: typeof Clock;
  badge?: string;
  isReady: boolean;
}

const GAMES_LIST: GameInfo[] = [
  {
    id: 'timeline',
    title: '蓮ノ空 時系列ソート',
    description: 'ランダムに選ばれた4本の配信・活動記録を古い順に並べ替えるタイムラインクイズ。',
    path: '/games/timeline',
    icon: Clock,
    badge: 'NEW',
    isReady: true,
  },
  {
    id: 'quiz',
    title: '配信当てクイズ',
    description: 'タイトルの一部やサムネイルのヒントから、どの配信か当てる4択クイズ。',
    path: '/games/quiz',
    icon: HelpCircle,
    badge: '準備中',
    isReady: false,
  },
];

export const GamesHub = () => {
  const navigate = useNavigate();
  const [isConfirmBackOpen, setIsConfirmBackOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 上部ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setIsConfirmBackOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>HasuLogに戻る</span>
        </button>

        <span className="text-xs font-bold text-gray-400">
          ミニゲーム
        </span>
      </div>

      {/* タイトルエリア */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
          ゲーム・クイズ
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          スキマ時間に遊べる蓮ノ空のミニゲームコーナーです。
        </p>
      </div>

      {/* ゲームカード一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAMES_LIST.map((game) => {
          const Icon = game.icon;
          return (
            <div
              key={game.id}
              onClick={() => {
                if (game.isReady) {
                  navigate(game.path);
                }
              }}
              className={`bg-white rounded-xl border p-4 transition-all flex flex-col justify-between ${
                game.isReady
                  ? 'border-gray-200 hover:border-pink-300 hover:shadow-sm cursor-pointer'
                  : 'border-gray-200/60 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                {/* 上部：アイコン & バッジ */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                    <Icon size={20} />
                  </div>
                  {game.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        game.isReady
                          ? 'bg-pink-50 text-pink-600 border border-pink-100'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {game.badge}
                    </span>
                  )}
                </div>

                {/* タイトル & 説明 */}
                <h3 className="text-base font-bold text-gray-800 mb-1.5">
                  {game.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              {/* 下部：矢印のみ（あそぶ文言は削除） */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end text-gray-400">
                {game.isReady ? (
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-pink-500" />
                ) : (
                  <Lock size={13} className="text-gray-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ホームへ戻る確認モーダル */}
      {isConfirmBackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl border border-gray-100 text-center">
            <h4 className="text-base font-bold text-gray-800 mb-1">
              HasuLogに戻りますか？
            </h4>
            <p className="text-xs text-gray-500 mb-5">
              動画一覧画面（ホーム）に戻ります。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmBackOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmBackOpen(false);
                  navigate('/');
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors cursor-pointer"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};