// src/components/profile/PointDashboard.tsx
import { useMemo, useEffect, useRef, useState } from 'react';
import { X, Trophy, Calendar, Activity, Clock, Loader2, Users } from 'lucide-react'; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { useUserData } from '../../hooks/useUserData';
import { useUserRecords } from '../../hooks/useUserRecords';
import { StreamDetailModal } from '../stream/StreamDetailModal'; 
import { FriendSocialModal } from './FriendSocialModal';
import type { StreamData } from '../../types';
import type { StreamRecord } from '../../hooks/useUserRecords';

type Props = {
  onClose: () => void;
  targetUserId?: string; 
  targetUserName?: string; 
};

type DayData = {
  date: string;
  count: number;
  month: number;
  monthName: string;
  titles: string;
} | null;

const parseTimestamp = (val: any, fallbackStr: string | undefined) => {
  if (val) {
    if (typeof val === 'string') return new Date(val).getTime();
    if (val.toMillis) return val.toMillis();
    if (val.seconds) return val.seconds * 1000;
  }
  return fallbackStr ? new Date(fallbackStr).getTime() : 0;
};

export const PointDashboard = ({ onClose, targetUserId, targetUserName }: Props) => {
  const { userData: myData } = useUserData();
  const { records: myRecords, updateRecord: myUpdateRecord } = useUserRecords();
  
  const [targetData, setTargetData] = useState<any>(null);
  const [targetRecords, setTargetRecords] = useState<Record<string, StreamRecord>>({});
  const [isLoading, setIsLoading] = useState(!!targetUserId);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [selectedStream, setSelectedStream] = useState<StreamData | null>(null);
  const [globalStreamTitles, setGlobalStreamTitles] = useState<Record<string, string>>({});
  const [globalStreamTypes, setGlobalStreamTypes] = useState<Record<string, string>>({});

  const [showSocialModal, setShowSocialModal] = useState(false);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const snap = await getDocs(collection(db, "streams"));
        const titlesObj: Record<string, string> = {};
        const typesObj: Record<string, string> = {};
        snap.forEach(doc => {
          const data = doc.data();
          titlesObj[doc.id] = data.title;
          typesObj[doc.id] = data.type;
        });
        setGlobalStreamTitles(titlesObj);
        setGlobalStreamTypes(typesObj);
      } catch (error) {
        console.error("動画タイトルの取得に失敗しました", error);
      }
    };
    fetchStreams();
  }, []);

  useEffect(() => {
    if (!targetUserId) return;
    const fetchTargetData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        if (userDoc.exists()) setTargetData(userDoc.data());
        
        const historySnap = await getDocs(collection(db, `users/${targetUserId}/watchHistory`));
        const historyObj: Record<string, StreamRecord> = {};
        historySnap.forEach(d => {
          historyObj[d.id] = d.data() as StreamRecord;
        });
        setTargetRecords(historyObj);
      } catch (error) {
        console.error("データの取得に失敗しました", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTargetData();
  }, [targetUserId]);

  const userData = targetUserId ? targetData : myData;
  const records = targetUserId ? targetRecords : myRecords;

  const heatMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    const titlesObj: Record<string, string[]> = {}; 

    Object.entries(records).forEach(([id, record]) => {
      if (record.lastViewedAt) {
        const d = new Date(record.lastViewedAt);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        counts[dateStr] = (counts[dateStr] || 0) + record.viewCount;
        
        if (!titlesObj[dateStr]) titlesObj[dateStr] = [];
        const title = (record as any).streamTitle || (record as any).title || globalStreamTitles[id] || '視聴記録';
        titlesObj[dateStr].push(title);
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
      const dayTitles = titlesObj[dateStr] ? titlesObj[dateStr].join('\n・') : ''; 

      currentWeek.push({ 
        date: dateStr, 
        count: counts[dateStr] || 0, 
        month: d.getMonth() + 1, 
        monthName,
        titles: dayTitles
      });

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
  }, [records, globalStreamTitles]);

  useEffect(() => {
    if (scrollRef.current && !isLoading) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [heatMapData, isLoading]);

  const getGrassColor = (count: number | undefined) => {
    if (count === undefined) return 'bg-transparent';
    if (count === 0) return 'bg-gray-100';
    if (count <= 1) return 'bg-pink-200';
    if (count <= 3) return 'bg-pink-400';
    if (count <= 5) return 'bg-pink-600';
    return 'bg-pink-800';
  };

  // 🌟 種別ごとの月別獲得ポイント（積み上げ用データ）
  const chartData = useMemo(() => {
    const monthlyData: Record<string, {
      name: string;
      with_meets: number;
      with_station: number;
      fes_live: number;
      story: number;
    }> = {};

    Object.entries(records).forEach(([id, record]) => {
      if (record.lastViewedAt) {
        const date = new Date(record.lastViewedAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            name: month,
            with_meets: 0,
            with_station: 0,
            fes_live: 0,
            story: 0
          };
        }

        const type = globalStreamTypes[id] || (record as any).type || 'with_meets';
        const points = (record.viewCount || 0) * 100;

        if (type === 'fes_live') {
          monthlyData[month].fes_live += points;
        } else if (type === 'with_station') {
          monthlyData[month].with_station += points;
        } else if (type === 'story') {
          monthlyData[month].story += points;
        } else {
          monthlyData[month].with_meets += points;
        }
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name));
  }, [records, globalStreamTypes]);

  const recentHistory = useMemo(() => {
    return Object.entries(records)
      .filter(([_, record]) => (record as any).lastAction !== 'decrease' && record.viewCount > 0)
      .map(([id, record]) => {
        const anyRecord = record as any;
        const ts = parseTimestamp(anyRecord.updatedAt, anyRecord.lastViewedAt);
        const date = new Date(ts);
        
        return {
          id,
          title: anyRecord.streamTitle || anyRecord.title || globalStreamTitles[id] || '視聴記録',
          dateStr: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
          timestamp: ts,
          viewCount: record.viewCount || 0,
          lastAction: anyRecord.lastAction || 'watch'
        };
      })
      .filter(item => item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);
  }, [records, globalStreamTitles]);

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
            
            <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center gap-4">
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
              
              {targetUserId && (
                <button
                  onClick={() => setShowSocialModal(true)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 text-pink-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
                >
                  <Users size={14} />
                  フレンド
                </button>
              )}
            </div>

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
                              className={`w-[12px] h-[12px] rounded-[2px] ${getGrassColor(day?.count)} transition-all hover:ring-1 ring-gray-400 cursor-help`}
                              title={day ? `${day.date}: ${day.count}回視聴\n${day.titles ? '・' + day.titles : ''}` : ''}
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

            {/* 🌟 積み上げ棒グラフ表示エリア */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-4 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
                月別獲得ポイント推移（種別別）
              </h4>
              <div className="p-4 rounded-lg border border-gray-100 bg-white h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                        formatter={(value: any, name: any) => [`${value} pt`, name]}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                        iconType="circle"
                      />
                      <Bar dataKey="with_meets" name="With×MEETS" stackId="points" fill="#ec4899" />
                      <Bar dataKey="with_station" name="With×STATION" stackId="points" fill="#3b82f6" />
                      <Bar dataKey="fes_live" name="Fes×LIVE" stackId="points" fill="#10b981" />
                      <Bar dataKey="story" name="活動記録" stackId="points" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    データがありません
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-4 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
                最近のアクティビティ 
              </h4>
              <div className="p-4 rounded-lg border border-gray-100 bg-white">
                {recentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {recentHistory.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleOpenStreamDetail(item.id)}
                        className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors group"
                      >
                        <div className="truncate pr-4">
                          <p className="text-sm font-bold text-gray-800 truncate mb-0.5 group-hover:text-pink-600 transition-colors">{item.title}</p>
                          <p className="text-[10px] text-gray-400">{item.dateStr}</p>
                        </div>
                        <div className="flex-shrink-0 text-right bg-pink-50 px-2 py-1 rounded-md">
                          <span className="text-xs font-bold text-pink-600">
                            {item.lastAction === 'memo' ? 'メモ更新' : 
                             item.lastAction === 'favorite' ? 'お気に入り' : 
                             `+${item.viewCount * 100} pt`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-gray-400">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs">まだアクティビティがありません</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

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