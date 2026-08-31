// src/components/profile/dashboard/PointsChartSection.tsx
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

type Props = {
  chartData: any[];
};

export const PointsChartSection = ({ chartData }: Props) => {
  return (
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
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} iconType="circle" />
              <Bar dataKey="with_meets" name="With×MEETS" stackId="points" fill="#ec4899" />
              <Bar dataKey="with_station" name="With×STATION" stackId="points" fill="#3b82f6" />
              <Bar dataKey="fes_live" name="Fes×LIVE" stackId="points" fill="#10b981" />
              <Bar dataKey="story" name="活動記録" stackId="points" fill="#f59e0b" />
              {/* 🌟 修正: 以下の「メモボーナス」の行を削除しました */}
              <Bar dataKey="recommended_bonus" name="おすすめ視聴ボーナス" stackId="points" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            データがありません
          </div>
        )}
      </div>
    </div>
  );
};