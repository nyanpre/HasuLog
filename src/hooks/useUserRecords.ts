// src/hooks/useUserRecords.ts
import { useUserRecordsContext } from '../contexts/UserRecordsContext';

export interface StreamRecord {
  streamId?: string; 
  streamTitle?: string; 
  viewCount: number;
  memo: string;
  memoVisibility?: 'private' | 'public_anonymous' | 'public_named'; 
  memoPointsAwarded?: boolean; // 🌟 50pt付与済みかどうかのフラグのみ追加
  isFavorite?: boolean;
  lastViewedAt: string;
  updatedAt: string;
}

export const useUserRecords = () => {
  return useUserRecordsContext();
};