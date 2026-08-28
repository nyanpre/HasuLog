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

  const getGrassColor = (count: number | undefined) => {
    if (count === undefined) return 'bg-transparent';
    if (count === 0) return 'bg-gray-100';
    if (count <= 1) return 'bg-pink-200';
    if (count <= 3) return 'bg-pink-400';
    if (count <= 5) return 'bg-pink-600';
    return 'bg-pink-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-gray-700 flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-700" />
          過去1年間の視聴履歴
        </h4>
        <span className="text-[10px] text-gray-400">マスを押すと該当動画を表示</span>
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
                    const tooltipText = day 
                      ? `${day.date}\n・視聴回数: ${day.count}回\n・獲得ポイント: ${day.totalPoints} pt${hasItems ? '\n\n（クリックで一覧表示）' : ''}`
                      : '';

                    return (
                      <div 
                        key={dayIdx} 
                        onClick={() => { if (hasItems && day) onDayClick(day); }}
                        className={`w-[12px] h-[12px] rounded-[2px] ${getGrassColor(day?.count)} transition-all ${
                          hasItems ? 'hover:ring-2 hover:ring-pink-500 cursor-pointer active:scale-95' : 'cursor-default'
                        }`}
                        title={tooltipText}
                      />
                    );
                  })}
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
  );
};