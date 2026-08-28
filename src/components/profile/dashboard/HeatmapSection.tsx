// src/components/profile/dashboard/HeatmapSection.tsx
import { useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import type { DayData } from '../../../hooks/useDashboardData';

type Props = {
  heatMapData: DayData[][];
  onDayClick: (day: DayData) => void;
};

export const HeatmapSection = ({ heatMapData, onDayClick }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && heatMapData.length > 0) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [heatMapData]);

  // 🌟 回数ではなく「ポイント（totalPoints）」を基準に色を決定するように修正
  const getGrassColor = (points: number | undefined) => {
    if (!points || points < 100) return 'bg-gray-100'; // 0〜99pt（未視聴など）
    if (points < 300) return 'bg-pink-200';            // 100pt以上
    if (points < 600) return 'bg-pink-400';            // 400pt以上
    if (points < 1000) return 'bg-pink-600';           // 800pt以上
    if (points < 1200) return 'bg-pink-700';           // 1200pt以上
    return 'bg-pink-800';                              // 1600pt以上
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-gray-700 flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
          過去1年間の視聴履歴
        </h4>
        <span className="text-[10px] text-gray-400">マスを押すと詳細を表示</span>
      </div>
      
      <div className="p-4 rounded-lg border border-gray-100 bg-white">
        <div className="flex">
          <div className="flex flex-col gap-[3px] pr-2 pt-[18px] text-[9px] text-gray-400 font-medium">
            <div className="h-[12px]"></div><div className="h-[12px] leading-3">Mon</div><div className="h-[12px]"></div><div className="h-[12px] leading-3">Wed</div><div className="h-[12px]"></div><div className="h-[12px] leading-3">Fri</div><div className="h-[12px]"></div>
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
                  {week.map((day, dayIdx) => {
                    const hasItems = (day?.items?.length || 0) > 0;
                    
                    return (
                      <div 
                        key={dayIdx} 
                        onClick={() => { if (hasItems && day) onDayClick(day); }}
                        // 🌟 引数を day?.count から day?.totalPoints に変更
                        className={`w-[12px] h-[12px] rounded-[2px] ${getGrassColor(day?.totalPoints)} transition-all ${
                          hasItems ? 'hover:ring-2 hover:ring-pink-500 cursor-pointer active:scale-95' : 'cursor-default'
                        }`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 🌟 凡例の色も新しいポイント基準に合わせたグラデーションに修正 */}
        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-gray-500">
          <span>少ない</span>
          <div className="w-[12px] h-[12px] rounded-[2px] bg-gray-100" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-200" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-400" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-600" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-700" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-pink-800" />
          <span>多い</span>
        </div>
      </div>
    </div>
  );
};