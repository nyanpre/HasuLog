// src/types/index.ts

export type VideoType = 'with_meets' | 'activity_record';

export interface VideoData {
  id: string;
  title: string;
  thumbnailUrl: string;
  date: string;
  type: VideoType;
  isWatched: boolean;
}