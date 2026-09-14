// src/components/pages/games/TimelineGamePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  GripVertical, 
  Settings2, 
  ChevronDown, 
  ChevronUp,
  EyeOff,
  Eye,
  Type
} from 'lucide-react';
import { useStreams } from '../../../contexts/StreamContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserData } from '../../../hooks/useUserData';

interface GameItem {
  id: string;
  title: string;
  date: string;
  thumbnailUrl?: string;
  type: string;
}

type EraFilter = 'all' | '103' | '104' | '105';
type CategoryFilter = 'all' | 'story' | 'with_meets' | 'fes_live';

export const TimelineGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { streams } = useStreams();
  const { currentUser } = useAuth();
  const { userData } = useUserData();

  // exMode認証判定
  const isExUser = Boolean(currentUser && userData?.exMode === true);

  // オプション・フィルター状態
  const [selectedEra, setSelectedEra] = useState<EraFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [hideNumbers, setHideNumbers] = useState(false);
  const [hideTitles, setHideTitles] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const [cards, setCards] = useState<GameItem[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isConfirmBackOpen, setIsConfirmBackOpen] = useState(false);

  // 対象プール（非認証ユーザーは公式動画のみに厳密制限）
  const allPool = useMemo<GameItem[]>(() => {
    const targetTypes = ['story', 'with_meets', 'fes_live'];

    return streams
      .filter((s: any) => {
        if (!s.date || !s.title || !s.thumbnailUrl || !targetTypes.includes(s.type)) {
          return false;
        }

        const isOfficialStream = s.is_official !== false && (s.is_official as any) !== 'false';
        if (!isExUser && !isOfficialStream) {
          return false;
        }

        return true;
      })
      .map((s) => ({
        id: s.id,
        title: s.title,
        date: s.date,
        thumbnailUrl: s.thumbnailUrl,
        type: s.type,
      }));
  }, [streams, isExUser]);

  // 期の判定（4月始まりの学年ベース）
  const getEra = (dateStr: string): '103' | '104' | '105' | null => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    if ((year === 2023 && month >= 4) || (year === 2024 && month <= 3)) return '103';
    if ((year === 2024 && month >= 4) || (year === 2025 && month <= 3)) return '104';
    if ((year === 2025 && month >= 4) || (year === 2026 && month <= 3)) return '105';

    return null;
  };

  // フィルター適用後の候補プール
  const filteredStreams = useMemo(() => {
    return allPool.filter((item) => {
      if (selectedEra !== 'all') {
        const era = getEra(item.date);
        if (era !== selectedEra) return false;
      }
      if (selectedCategory !== 'all') {
        if (item.type !== selectedCategory) return false;
      }
      return true;
    });
  }, [allPool, selectedEra, selectedCategory]);

  // 半角・全角数字を「？」に置換
  const maskNumbersWithQuestion = (text: string) => {
    return text.replace(/[0-9０-９]/g, '？');
  };

  const getDisplayTitle = (title: string) => {
    if (isAnswered) return title;
    if (hideTitles) return '？？？？？？？？';
    if (hideNumbers) return maskNumbersWithQuestion(title);
    return title;
  };

  // 重複しない日付の動画を5件抽出し、未ソートの状態で生成
  const generateGame = () => {
    if (filteredStreams.length < 5) {
      setCards([]);
      return;
    }

    const picked: GameItem[] = [];
    const usedDates = new Set<string>();
    const shuffledPool = [...filteredStreams].sort(() => Math.random() - 0.5);

    for (const item of shuffledPool) {
      if (!usedDates.has(item.date)) {
        picked.push(item);
        usedDates.add(item.date);
      }
      if (picked.length === 5) break;
    }

    if (picked.length < 5) {
      setCards([]);
      return;
    }

    const formattedCards = [...picked];

    const isAlreadySorted = formattedCards.every((card, i) => {
      if (i === formattedCards.length - 1) return true;
      return new Date(card.date).getTime() <= new Date(formattedCards[i + 1].date).getTime();
    });

    if (isAlreadySorted && formattedCards.length >= 2) {
      const temp = formattedCards[0];
      formattedCards[0] = formattedCards[1];
      formattedCards[1] = temp;
    }

    setCards(formattedCards);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  useEffect(() => {
    if (filteredStreams.length >= 5) {
      generateGame();
    } else {
      setCards([]);
    }
  }, [filteredStreams.length, selectedEra, selectedCategory]);

  // ドラッグ終了時
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination || isAnswered) return;

    const items = Array.from(cards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCards(items);
  };

  // 上下ボタン移動
  const moveCard = (index: number, direction: 'up' | 'down') => {
    if (isAnswered) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    const newCards = [...cards];
    const temp = newCards[index];
    newCards[index] = newCards[targetIndex];
    newCards[targetIndex] = temp;
    setCards(newCards);
  };

  // 回答判定
  const checkAnswer = () => {
    let correct = true;
    for (let i = 0; i < cards.length - 1; i++) {
      if (new Date(cards[i].date).getTime() > new Date(cards[i + 1].date).getTime()) {
        correct = false;
        break;
      }
    }
    setIsCorrect(correct);
    setIsAnswered(true);
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'story':
        return '活動記録';
      case 'with_meets':
        return 'With×MEETS';
      case 'fes_live':
        return 'Fes×LIVE';
      default:
        return '配信';
    }
  };

  const isOptionsActive = selectedEra !== 'all' || selectedCategory !== 'all' || hideNumbers || hideTitles;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 最上部：戻るボタン & タイトル・オプションボタン */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsConfirmBackOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>ゲーム一覧に戻る</span>
        </button>

        {/* 右寄せ：時系列ソートラベル & オプショントグル */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">時系列ソート</span>
          <button
            type="button"
            onClick={() => setIsOptionsOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
              isOptionsActive
                ? 'bg-pink-50 text-pink-600 border-pink-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Settings2 size={12} />
            <span>オプション</span>
            {isOptionsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* 4カラム構成のオプション展開エリア */}
      {isOptionsOpen && (
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 mb-4 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
          <div>
            <label className="block text-[9px] font-bold text-gray-400 mb-0.5">
              期を選択
            </label>
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value as EraFilter)}
              className="w-full text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-pink-400 cursor-pointer"
            >
              <option value="all">すべての期</option>
              <option value="103">103期</option>
              <option value="104">104期</option>
              <option value="105">105期</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-gray-400 mb-0.5">
              種別を選択
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)}
              className="w-full text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-pink-400 cursor-pointer"
            >
              <option value="all">すべての種別</option>
              <option value="story">活動記録</option>
              <option value="with_meets">With×MEETS</option>
              <option value="fes_live">Fes×LIVE</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-gray-400 mb-0.5">
              数字マスク
            </label>
            <button
              type="button"
              disabled={hideTitles}
              onClick={() => setHideNumbers((prev) => !prev)}
              className={`w-full text-[11px] font-bold rounded-md px-2 py-1 border transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                hideNumbers
                  ? 'bg-pink-50 text-pink-600 border-pink-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {hideNumbers ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{hideNumbers ? '数字: ON' : '数字を隠す'}</span>
            </button>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-gray-400 mb-0.5">
              タイトル非表示
            </label>
            <button
              type="button"
              onClick={() => setHideTitles((prev) => !prev)}
              className={`w-full text-[11px] font-bold rounded-md px-2 py-1 border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                hideTitles
                  ? 'bg-pink-50 text-pink-600 border-pink-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Type size={12} />
              <span>{hideTitles ? 'タイトル: ON' : 'タイトル隠す'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ガイドテキスト */}
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          5本の出来事を【古い順（上→下）】に並べ替えてください。
        </p>
      </div>

      {/* 候補件数不足の警告 */}
      {filteredStreams.length < 5 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center my-6">
          <Settings2 size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">条件に合う動画が足りません</p>
          <p className="text-xs text-gray-400 mt-1">
            出題には5本以上のデータが必要です。オプション条件を変更してください。
          </p>
        </div>
      ) : (
        <>
          {/* ガイドバー & リセットボタン */}
          <div className="flex justify-between items-end text-[11px] font-bold text-gray-400 px-1 mb-2">
            <span>▲ 過去（古い）</span>
            
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={generateGame}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-pink-600 bg-white border border-gray-200 hover:border-pink-200 px-2 py-0.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                title="別の問題を引き直す"
              >
                <RotateCcw size={10} />
                <span>リセット</span>
              </button>
              <span>▼ 未来（新しい）</span>
            </div>
          </div>

          {/* ドラッグ＆ドロップ領域 */}
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="timeline-cards" isDropDisabled={isAnswered}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2.5"
                >
                  {cards.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                      isDragDisabled={isAnswered}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-xl border p-3 flex items-center gap-2.5 transition-shadow select-none ${
                            snapshot.isDragging
                              ? 'shadow-lg border-pink-300 ring-2 ring-pink-100 z-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* ドラッグハンドル */}
                          <div
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-1 p-1 -ml-1 text-gray-400 touch-none ${
                              isAnswered ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                            }`}
                            title="ドラッグして並べ替え"
                          >
                            {!isAnswered && (
                              <GripVertical size={16} className="text-gray-400" />
                            )}
                            <span className="text-xs font-bold w-4 text-center">
                              {index + 1}
                            </span>
                          </div>

                          {/* サムネイル */}
                          {item.thumbnailUrl && (
                            <div className="w-20 h-12 sm:w-24 sm:h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center">
                              <img
                                src={item.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            </div>
                          )}

                          {/* タイトル & 情報 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                                {getTypeName(item.type)}
                              </span>
                              {isAnswered && (
                                <span className="text-xs font-bold text-pink-600 font-mono">
                                  {item.date}
                                </span>
                              )}
                            </div>
                            <h4 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${
                              hideTitles && !isAnswered ? 'text-gray-400 tracking-widest' : 'text-gray-800'
                            }`}>
                              {getDisplayTitle(item.title)}
                            </h4>
                          </div>

                          {/* 上下移動ボタン */}
                          {!isAnswered && (
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => moveCard(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 disabled:opacity-20 disabled:pointer-events-none cursor-pointer border border-gray-100 transition-colors"
                                title="上へ"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveCard(index, 'down')}
                                disabled={index === cards.length - 1}
                                className="p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 disabled:opacity-20 disabled:pointer-events-none cursor-pointer border border-gray-100 transition-colors"
                                title="下へ"
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* 🌟 判定・アクションボタン（枠やアイコンなし・文字のみ） */}
          <div className="mt-6">
            {isAnswered ? (
              <div className="space-y-4">
                {/* 🌟 文字のみの表示エリア */}
                <div className="py-2 text-center select-none animate-in zoom-in-95 duration-200">
                  <span
                    className={`text-2xl font-black tracking-widest ${
                      isCorrect ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {isCorrect ? '正解！' : '不正解'}
                  </span>
                </div>

                {/* もう一度あそぶ */}
                <button
                  type="button"
                  onClick={generateGame}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <RotateCcw size={16} />
                  <span>もう一度あそぶ</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={checkAnswer}
                disabled={cards.length < 5}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                この並びで決定
              </button>
            )}
          </div>
        </>
      )}

      {/* 戻る確認モーダル */}
      {isConfirmBackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl border border-gray-100 text-center">
            <h4 className="text-base font-bold text-gray-800 mb-1">
              ゲームを終了しますか？
            </h4>
            <p className="text-xs text-gray-500 mb-5">
              現在の並び順は保存されません。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmBackOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                続ける
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmBackOpen(false);
                  navigate('/games');
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors cursor-pointer"
              >
                終了する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};