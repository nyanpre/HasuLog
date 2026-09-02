// src/components/related/types.ts

export type Category = 'すべて' | '雑誌' | 'メディア' | '特設サイト';

export interface ContentPart {
  label: string;
  url: string;
}

export interface ContentItem {
  id: string;
  originalUrl?: string;
  title: string;
  source?: string;       // 🌟 媒体名（Febri, リスアニ！など）
  description: string;
  publishedDate: string;
  category: string;
  contentUrl?: string;
  parts?: ContentPart[];
}