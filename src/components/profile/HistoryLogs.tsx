import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WatchHistory, MonthlyLog } from '../../types/rank';

interface HistoryLogsProps {
  historyList: WatchHistory[];
  monthlyLogs: MonthlyLog[];
}

// グラフ用のダミーデータ（後でFirebaseのデータから動的に生成します）
const DUMMY_DAILY_TREND = [
  { date: '7/23', points: 100 }, { date: '7/24', points: 0 }, { date: '7/25', points: 300 },
  { date: '7/26', points: 100 }, { date: '7/27', points: 400 }, { date: '7/28', points: 100 },
  { date: '7/29', points: 200 }
];

export const HistoryLogs = ({ historyList, monthlyLogs }: HistoryLogsProps) => {
  const [activeTab, setActiveTab] = useState<'history' | 'monthly'>('history');

  // 月別アーカイブのグラフ用データ
  const monthlyChartData = useMemo(() => {
    return [...monthlyLogs].reverse().map(log => ({
      name: log.yearMonth.split('-')[1] + '月',
      points: log.monthlyPoints
    }));
  }, [monthlyLogs]);

  // 草（ヒートマップ）のダミーデータ生成（過去約半年分）
  const grassData = useMemo(() => {
    const data = [];
    for (let i = 182; i >= 0; i--) {
      const count = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
      data.push(count);
    }
    return data;
  }, []);

  // 草の色を決定する関数
  const getGrassColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-emerald-200';
    if (count === 2) return 'bg-emerald-400';
    if (count === 3) return 'bg-emerald-600';
    return 'bg-emerald-800';
  };

  return (
    <div className="space-y-6">
      
      {/* 🌟 GitHub風の「草」（ヒートマップ） */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-gray-500 mb-4">HasuLog Activity</h3>
        <div className="overflow-x-auto pb-2">
          {/* CSS Gridで縦7マスのカレンダーを構築 */}
          <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
            {grassData.map((count, i) => (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-sm ${getGrassColor(count)}`} 
                title={`${count} 回の視聴`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-gray-400 font-bold">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-800" />
          <span>More</span>
        </div>
      </div>

      {/* 詳細データ領域 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex gap-4 border-b border-gray-100 mb-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 text-sm font-bold transition-all ${
              activeTab === 'history' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            最近の獲得履歴
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-3 px-2 text-sm font-bold transition-all ${
              activeTab === 'monthly' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            月別アーカイブ
          </button>
        </div>

        {/* 獲得履歴タブ */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            {/* 折れ線グラフ */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DUMMY_DAILY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="points" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* リスト */}
            <ul className="space-y-3">
              {historyList.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">まだ履歴がありません</p>
              ) : (
                historyList.map((item) => (
                  <li key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div>
                      <div className="font-bold text-gray-700">{item.contentTitle}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString('ja-JP')}</div>
                    </div>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm">+{item.pointsEarned} pt</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {/* 月別アーカイブタブ */}
        {activeTab === 'monthly' && (
          <div className="space-y-8">
            {/* 折れ線グラフ */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="points" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* リスト */}
            <ul className="space-y-3">
              {monthlyLogs.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">アーカイブがありません</p>
              ) : (
                monthlyLogs.map((log) => (
                  <li key={log.yearMonth} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-baseline gap-3">
                      <span className="font-black text-gray-800">{log.yearMonth}</span>
                      <span className="text-sm font-bold text-gray-500">{log.monthlyPoints.toLocaleString()} pt</span>
                    </div>
                    <span className="font-black px-4 py-1.5 rounded-full text-sm bg-white shadow-sm border border-gray-200 text-gray-700">RANK {log.finalRank}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};