// src/components/related/types.ts

export type Category = 
  | 'すべて' 
  | '雑誌' 
  | 'メディア' 
  | '特設サイト' 
  | 'せーので！はすのそら！' 
  | 'メンバーシップ限定動画' 
  | '自己紹介';

export interface ContentPart {
  label: string;
  url: string;
}

export interface ContentItem {
  id: string;
  season?: string;       // 🌟 103, 104, 105期の判定用
  originalUrl?: string;
  thumbnailUrl?: string;
  title: string;
  source?: string;       // 媒体名（Febri, リスアニ！, YouTube など）
  description: string;
  publishedDate: string;
  category: string;
  contentUrl?: string;   // StorageパスまたはHTMLパス
  storageUrl?: string;   // Firebase Storage 公開URL
  youtubeUrl?: string;
  archiveType?: 'media' | 'sehasu' | 'membership' | 'intro' | string;
  parts?: ContentPart[];
}