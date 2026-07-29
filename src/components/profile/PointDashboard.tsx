// src/components/profile/PointDashboard.tsx
import { useMemo, useEffect, useRef } from 'react';
import { X, Trophy, Calendar, Activity, Clock } from 'lucide-react'; // 🌟 Clockを追加
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useUserData } from '../../hooks/useUserData';
import { useUserRecords } from '../../hooks/useUserRecords';

type Props = {
  onClose: () => void;
};

// 草データ用の型定義
type DayData = {
  date: string;
  count: number;
  month: number;
  monthName: string;
} | null;

export const PointDashboard = ({ onClose }: Props) => {
  const { userData } = useUserData();
  const { records } = useUserRecords();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🌟 草（ヒートマップ）のデータ生成（過去1年分 / 365日）
  const heatMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(records).forEach(record => {
      if (record.lastViewedAt) {
        const d = new Date(record.lastViewedAt);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        counts[dateStr] = (counts[dateStr] || 0) + record.viewCount;
      }
    });

    const days = 365;
    const today = new Date();
    
    const grid: DayData[][] = [];
    let currentWeek: DayData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      
      currentWeek.push({ date: dateStr, count: counts[dateStr] || 0, month: d.getMonth() + 1, monthName });

      if (d.getDay() === 6 || i === 0) {
        if (grid.length === 0 && currentWeek.length < 7) {
          const pad = 7 - currentWeek.length;
          currentWeek = [...Array(pad).fill(null), ...currentWeek];
        } else if (i === 0 && currentWeek.length < 7) {
          const pad = 7 - currentWeek.length;
          currentWeek = [...currentWeek, ...Array(pad).fill(null)];
        }
        grid.push(currentWeek);
        currentWeek = [];
      }
    }
    return grid;
  }, [records]);

  // モーダルが開いた時に一番右までスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [heatMapData]);

  // ピンクベースのカラー定義
  const getGrassColor = (count: number | undefined) => {
    if (count === undefined) return 'bg-transparent';
    if (count === 0) return 'bg-gray-100';
    if (count <= 1) return 'bg-pink-200';
    if (count <= 3) return 'bg-pink-400';
    if (count <= 5) return 'bg-pink-600';
    return 'bg-pink-800';
  };

  // グラフのデータ生成
  const chartData = useMemo(() => {
    const monthlyPoints: Record<string, number> = {};
    Object.values(records).forEach(record => {
      if (record.lastViewedAt) {
        const date = new Date(record.lastViewedAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyPoints[month] = (monthlyPoints[month] || 0) + (record.viewCount * 100);
      }
    });

    return Object.entries(monthlyPoints)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, points]) => ({ name, points }));
  }, [records]);

  // 🌟 最近の視聴履歴のデータ生成（復活！）
  const recentHistory = useMemo(() => {
    return Object.entries(records)
      .filter(([_, record]) => record.lastViewedAt)
      .map(([id, record]) => {
        const date = new Date(record.lastViewedAt);
        return {
          id,
          // データベースに streamTitle または title として保存されているものを取得
          title: (record as any).streamTitle || (record as any).title || '視聴記録',
          dateStr: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
          timestamp: date.getTime(),
          viewCount: record.viewCount || 0,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp) // 新しい順に並び替え
      .slice(0, 15); // 直近15件を表示
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center text-sm">
            <Activity className="w-4 h-4 mr-2 text-gray-800" />
            アクティビティ
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* 累計ポイント情報 */}
          <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
            <div className="p-2 border border-gray-200 rounded-md bg-white">
              <Trophy className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 mb-0.5">HasuLog 累計獲得ポイント</p>
              <p className="text-xl font-bold text-gray-800">
                {userData?.totalPoints?.toLocaleString() || 0} <span className="text-xs font-normal text-gray-500">pt</span>
              </p>
            </div>
          </div>

          {/* GitHub風 草（ヒートマップ） */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-4 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
              過去1年間の視聴履歴
            </h4>
            
            <div className="p-4 rounded-lg border border-gray-100 bg-white">
              <div className="flex">
                <div className="flex flex-col gap-[3px] pr-2 pt-[18px] text-[9px] text-gray-400 font-medium">
                  <div className="h-[12px]"></div>
                  <div className="h-[12px] leading-3">Mon</div>
                  <div className="h-[12px]"></div>
                  <div className="h-[12px] leading-3">Wed</div>
                  <div className="h-[12px]"></div>
                  <div className="h-[12px] leading-3">Fri</div>
                  <div className="h-[12px]"></div>
                </div>
                
                <div ref={scrollRef} className="flex gap-[3px] overflow-x-auto pb-2 custom-scrollbar flex-grow scroll-smooth">
                  {heatMapData.map((week, weekIdx) => {
                    const currentMonth = week.find(d => d !== null)?.month;
                    const prevMonth = weekIdx > 0 ? heatMapData[weekIdx - 1].find(d => d !== null)?.month : null;
                    const isNewMonth = currentMonth !== prevMonth;

                    return (
                      <div key={weekIdx} className="flex flex-col gap-[3px] flex-shrink-0">
                        <div className="h-[15px] text-[9px] text-gray-400 relative">
                          {isNewMonth && <span className="absolute left-0">{week.find(d => d !== null)?.monthName}</span>}
                        </div>
                        {week.map((day, dayIdx) => (
                          <div 
                            key={dayIdx} 
                            className={`w-[12px] h-[12px] rounded-[2px] ${getGrassColor(day?.count)} transition-all hover:ring-1 ring-gray-400`}
                            title={day ? `${day.date}: ${day.count}回` : ''}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-gray-500">
                <span>少ない</span>
                <div className="w-[12px] h-[12px] rounded-[2px] bg-gray-100" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-200" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-400" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-600" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-800" />
                <span>多い</span>
              </div>
            </div>
          </div>

          {/* 月別推移グラフ */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-4 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
              月別獲得ポイント推移
            </h4>
            <div className="p-4 rounded-lg border border-gray-100 bg-white h-56">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                      formatter={(value: any) => [`${value} pt`, 'ポイント']}
                    />
                    <Line type="monotone" dataKey="points" stroke="#ec4899" strokeWidth={2} dot={{ r: 3, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  データがありません
                </div>
              )}
            </div>
          </div>

          {/* 🌟 最近の視聴履歴リスト（復活！） */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 mb-4 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
              最近の視聴履歴
            </h4>
            <div className="p-4 rounded-lg border border-gray-100 bg-white">
              {recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {recentHistory.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div className="truncate pr-4">
                        <p className="text-sm font-bold text-gray-800 truncate mb-0.5">{item.title}</p>
                        <p className="text-[10px] text-gray-400">{item.dateStr}</p>
                      </div>
                      <div className="flex-shrink-0 text-right bg-pink-50 px-2 py-1 rounded-md">
                        <span className="text-xs font-bold text-pink-600">+{item.viewCount * 100} pt</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-gray-400">
                  <Clock className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">まだ視聴履歴がありません</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};