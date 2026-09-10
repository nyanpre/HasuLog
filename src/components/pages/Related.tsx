// src/components/pages/Related.tsx
import { useState, useMemo } from 'react';
import { 
  Archive, 
  Tv, 
  Crown,
  UserCheck,
  Newspaper,
  Radio
} from 'lucide-react';

import articlesData from '../related/data/articles.json';
import sehasuData from '../related/data/sehasu_videos.json';
import membershipData from '../related/data/membership.json';
import introData from '../related/data/introduction_videos.json';
import mirapaData from '../related/data/mirapa_radio.json'; // 🌟 みらぱラジオデータを追加
import { ArticleViewerModal } from '../related/ArticleViewerModal';
import { VideoList } from '../related/VideoList';
import { RelatedCategoryCard } from '../related/RelatedCategoryCard';
import { MediaSectionView } from '../related/MediaSectionView';
import type { ContentItem } from '../related/types';
import { useUserData } from '../../hooks/useUserData';
import { useAuth } from '../../contexts/AuthContext';

type SectionType = 'media' | 'sehasu' | 'membership' | 'intro' | 'mirapa';

export default function Related() {
  const { currentUser } = useAuth();
  const { userData } = useUserData();

  // 未ログインまたはゲストの場合は確実に false
  const isEx = Boolean(
    currentUser && 
    !currentUser.isAnonymous && 
    (localStorage.getItem('hasulog_isExMode') === 'true' || userData?.exMode === true)
  );

  const [selectedSection, setSelectedSection] = useState<SectionType | null>(null);
  const [selectedContent, setSelectedContent] = useState<{ title: string; url: string } | null>(null);

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

  // 🌟 みらぱラジオデータのマッピング（subCategory を保持）
  const mirapaContents = useMemo(() => {
    return ((mirapaData as any[]) || []).map(v => ({
      id: v.id,
      season: v.season,
      title: v.title,
      description: v.description,
      publishedDate: v.date,
      category: "みらぱラジオ",
      subCategory: v.subCategory,
      source: "YouTube",
      thumbnailUrl: v.thumbnailUrl,
      youtubeUrl: v.youtubeUrl
    })) as ContentItem[];
  }, []);

  // 🌟 カテゴリ定義と権限ステータス
  const allCategories = [
    {
      id: 'media' as SectionType,
      title: 'メディア',
      description: 'WEBメディア・雑誌インタビューなどの保存記事',
      count: mediaContents.length,
      icon: <Newspaper size={24} />,
      iconBgClass: 'bg-pink-50 border-pink-100 text-pink-500',
      requiresEx: true, // 🌟 EXユーザー限定
    },
    {
      id: 'intro' as SectionType,
      title: '自己紹介動画',
      description: 'メンバー・キャストの自己紹介アーカイブ',
      count: introContents.length,
      icon: <UserCheck size={24} />,
      iconBgClass: 'bg-teal-50 border-teal-100 text-teal-600',
      requiresEx: false, // 🌟 誰でも閲覧可能
    },
    {
      id: 'mirapa' as SectionType,
      title: 'みらぱラジオ',
      description: '待機室・補習室・進路相談室など公式ラジオ番組アーカイブ',
      count: mirapaContents.length,
      icon: <Radio size={24} />,
      iconBgClass: 'bg-orange-50 border-orange-100 text-orange-500',
      requiresEx: false, // 🌟 誰でも閲覧可能
    },
    {
      id: 'sehasu' as SectionType,
      title: 'せーので！はすのそら！',
      description: '公式YouTube番組アーカイブ',
      count: sehasuContents.length,
      icon: <Tv size={24} />,
      iconBgClass: 'bg-purple-50 border-purple-100 text-purple-500',
      requiresEx: false, // 🌟 誰でも閲覧可能
    },
    {
      id: 'membership' as SectionType,
      title: 'メンバーシップ限定動画',
      description: '公式YouTubeメンバーシップ限定動画アーカイブ',
      count: membershipContents.length,
      icon: <Crown size={24} />,
      iconBgClass: 'bg-amber-50 border-amber-100 text-amber-500',
      requiresEx: false, // 🌟 誰でも閲覧可能
    },
  ];

  // 🌟 EXユーザーは全件表示、通常ユーザーは requiresEx: false のものだけ表示
  const visibleCategories = useMemo(() => {
    return allCategories.filter(cat => isEx || !cat.requiresEx);
  }, [allCategories, isEx]);

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
              蓮ノ空に関連するコンテンツのアーカイブです。
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {visibleCategories.map((cat) => (
              <RelatedCategoryCard
                key={cat.id}
                title={cat.title}
                description={cat.description}
                count={cat.count}
                icon={cat.icon}
                iconBgClass={cat.iconBgClass}
                onClick={() => setSelectedSection(cat.id)}
              />
            ))}
          </div>
        </div>
      ) : selectedSection === 'mirapa' ? (
        /* 🌟 みらぱラジオ一覧画面（サブカテゴリフィルター対応） */
        <VideoList 
          title="みらぱラジオ一覧"
          items={mirapaContents} 
          onBack={() => setSelectedSection(null)} 
        />
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
      ) : selectedSection === 'media' && isEx ? (
        <MediaSectionView
          contents={mediaContents}
          onBack={() => setSelectedSection(null)}
          onSelectContent={(title, url) => setSelectedContent({ title, url })}
        />
      ) : null}

      {/* 記事ビューアモーダル */}
      <ArticleViewerModal 
        content={selectedContent} 
        onClose={() => setSelectedContent(null)} 
      />
    </div>
  );
}