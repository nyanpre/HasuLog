// src/components/related/RelatedCategoryCard.tsx
import React, { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface RelatedCategoryCardProps {
  title: string;
  description: string;
  count: number;
  icon: ReactNode;
  iconBgClass: string;
  onClick: () => void;
}

export const RelatedCategoryCard: React.FC<RelatedCategoryCardProps> = ({
  title,
  description,
  count,
  icon,
  iconBgClass,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-5 flex items-center justify-between text-left transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${iconBgClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
              {title}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
              {count}件
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">{description}</p>
        </div>
      </div>

      <ChevronRight className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" size={20} />
    </button>
  );
};