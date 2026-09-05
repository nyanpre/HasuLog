// src/components/pages/Related.tsx
import { useState, useMemo } from 'react';
import { 
  Archive, 
  ArrowUpDown, 
  Filter, 
  AlignJustify, 
  Columns2, 
  ArrowLeft, 
  Tv, 
  Crown,
  UserCheck,
  Newspaper, 
  ChevronRight 
} from 'lucide-react';

import articlesData from '../related/data/articles.json';
import sehasuData from '../related/data/sehasu_videos.json';
import membershipData from '../related/data/membership.json';
import introData from '../related/data/introduction_videos.json';
import { ArticleCard } from '../related/ArticleCard';
import { ArticleViewerModal } from '../related/ArticleViewerModal';
import { VideoList } from '../related/VideoList';
import type { ContentItem } from '../related/types';

type SectionType = 'media' | 'sehasu' | 'membership' | 'intro';
type LayoutType = 1 | 2;

export default function Related() {
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(null);
  const [selectedContent, setSelectedContent] = useState<{ title: string; url: string } | null>(null);
  const [activeSource, setActiveSource] = useState<string>('すべて');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutType>(1);

  const mediaContents = articlesData as ContentItem[];
  
  const sehasuContents = useMemo(() => {
    return ((sehasuData as any[]) || []).map(v => ({
      id: v.id,
      season: v.season,
      title: v.title,
      description: v.description,
      publishedDate: v.date,
      category: "せーので！はすのそら！",
      source: "YouTube",
      thumbnailUrl: v.thumbnailUrl,
      youtubeUrl: v.youtubeUrl
    })) as ContentItem[];
  }, []);

  const membershipContents = useMemo(() => {
    return ((membershipData as any[]) || []).map(v => ({
      id: v.id,
      season: v.season,
      title: v.title,
      description: v.description,
      publishedDate: v.date,
      category: "メンバーシップ限定動画",
      source: "YouTube",
      thumbnailUrl: v.thumbnailUrl,
      youtubeUrl: v.youtubeUrl
    })) as ContentItem[];
  }, []);

  const introContents = useMemo(() => {
    return ((introData as any[]) || []).map(v => ({
      id: v.id,
      season: v.season,
      title: v.title,
      description: v.description,
      publishedDate: v.date,
      category: "自己紹介",
      source: "YouTube",
      thumbnailUrl: v.thumbnailUrl,
      youtubeUrl: v.youtubeUrl
    })) as ContentItem[];
  }, []);

  const sectionContents = useMemo(() => {
    if (selectedSection !== 'media') return [];
    return mediaContents;
  }, [mediaContents, selectedSection]);

  const sources = useMemo(() => {
    const list = new Set<string>();
    sectionContents.forEach(item => {
      if (item.source) list.add(item.source);
    });
    return ['すべて', ...Array.from(list)];
  }, [sectionContents]);

  const processedContents = useMemo(() => {
    return sectionContents
      .filter(item => activeSource === 'すべて' || item.source === activeSource)
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate).getTime() || 0;
        const dateB = new Date(b.publishedDate).getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [sectionContents, activeSource, sortOrder]);

  const gridClass = layout === 1 ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-3';

  const mediaCount = mediaContents.length;
  const sehasuCount = sehasuContents.length;
  const membershipCount = membershipContents.length;
  const introCount = introContents.length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {!selectedSection ? (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-gray-800 flex items-center">
              <Archive className="w-6 h-6 mr-2 text-gray-600" />
              関連コンテンツ
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              インタビュー記事や公式関連動画のアーカイブです。
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* メディア */}
            <button
              onClick={() => {
                setSelectedSection('media');
                setActiveSource('すべて');
                setIsFilterOpen(false);
              }}
              className="w-full bg-white border border-gray-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0 text-pink-500 group-hover:scale-105 transition-transform">
                  <Newspaper size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                      メディア
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                      {mediaCount}件
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    WEBメディア・雑誌インタビューなどの保存記事
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" size={20} />
            </button>

            {/* せーので！はすのそら！ */}
            <button
              onClick={() => {
                setSelectedSection('sehasu');
                setActiveSource('すべて');
                setIsFilterOpen(false);
              }}
              className="w-full bg-white border border-gray-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 text-purple-500 group-hover:scale-105 transition-transform">
                  <Tv size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                      せーので！はすのそら！
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                      {sehasuCount}件
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    公式YouTube番組アーカイブ
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" size={20} />
            </button>

            {/* メンバーシップ限定動画 */}
            <button
              onClick={() => {
                setSelectedSection('membership');
                setActiveSource('すべて');
                setIsFilterOpen(false);
              }}
              className="w-full bg-white border border-gray-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-amber-500 group-hover:scale-105 transition-transform">
                  <Crown size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                      メンバーシップ限定動画
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                      {membershipCount}件
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    公式YouTubeメンバーシップ限定動画アーカイブ
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" size={20} />
            </button>

            {/* 自己紹介動画 */}
            <button
              onClick={() => {
                setSelectedSection('intro');
                setActiveSource('すべて');
                setIsFilterOpen(false);
              }}
              className="w-full bg-white border border-gray-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600 group-hover:scale-105 transition-transform">
                  <UserCheck size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                      自己紹介動画
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                      {introCount}件
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    メンバー・キャストの自己紹介アーカイブ
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" size={20} />
            </button>
          </div>
        </div>
      ) : selectedSection === 'sehasu' ? (
        <VideoList 
          title="せーので！はすのそら！一覧"
          items={sehasuContents} 
          onBack={() => setSelectedSection(null)} 
        />
      ) : selectedSection === 'membership' ? (
        <VideoList 
          title="メンバーシップ限定動画一覧"
          items={membershipContents} 
          onBack={() => setSelectedSection(null)} 
        />
      ) : selectedSection === 'intro' ? (
        <VideoList 
          title="自己紹介動画一覧"
          items={introContents} 
          onBack={() => setSelectedSection(null)} 
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <button 
                onClick={() => setSelectedSection(null)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-pink-600 hover:border-pink-200 shadow-sm transition-colors flex-shrink-0"
                title="セクション一覧に戻る"
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 truncate flex items-center">
                メディア一覧
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
                <button 
                  onClick={() => setLayout(1)} 
                  className={`p-1.5 rounded-md transition-all duration-200 ${layout === 1 ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <AlignJustify size={18} />
                </button>
                <button 
                  onClick={() => setLayout(2)} 
                  className={`p-1.5 rounded-md transition-all duration-200 ${layout === 2 ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Columns2 size={18} />
                </button>
              </div>

              {sources.length > 2 && (
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-bold transition-colors shadow-sm ${
                    isFilterOpen 
                      ? 'bg-pink-50 border-pink-200 text-pink-600' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-pink-200 hover:text-pink-600'
                  }`}
                >
                  <Filter size={14} />
                  <span className="hidden sm:inline">媒体絞り込み</span>
                </button>
              )}
              
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] sm:text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors shadow-sm"
              >
                <ArrowUpDown size={14} />
                {sortOrder === 'desc' ? '新しい順' : '古い順'}
              </button>
            </div>
          </div>

          {isFilterOpen && sources.length > 2 && (
            <div className="flex items-center gap-2 mb-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
              <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap w-10">媒体:</span>
              <div className="flex overflow-x-auto custom-scrollbar gap-1.5 flex-1 pb-0.5">
                {sources.map((src) => (
                  <button
                    key={src}
                    onClick={() => setActiveSource(src)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-colors border shadow-xs ${
                      activeSource === src
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
          )}

          {processedContents.length > 0 ? (
            <div className={`grid ${gridClass}`}>
              {processedContents.map((item) => (
                <ArticleCard 
                  key={item.id} 
                  item={item} 
                  columns={layout}
                  onSelectContent={(title: string, url: string) => setSelectedContent({ title, url })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 text-sm font-bold">該当するコンテンツがありません。</p>
            </div>
          )}
        </div>
      )}

      {/* ビューアモーダル */}
      <ArticleViewerModal 
        content={selectedContent} 
        onClose={() => setSelectedContent(null)} 
      />
    </div>
  );
}