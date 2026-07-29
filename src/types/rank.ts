// 100pt未満の '-' を 'Unranked' として定義
export type RankGrade = 'Unranked' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface UserRankStats {
  monthlyPoints: number;
  totalPoints: number; // 称号などのために累計も保持
  currentRank: RankGrade;
  lastResetMonth: string; // 例: "2026-07"
}

export interface WatchHistory {
  id: string;
  userId: string;
  contentId: string;
  contentTitle: string;
  pointsEarned: number; // 基本100pt
  createdAt: string; // ISO形式の日時
}

export interface MonthlyLog {
  yearMonth: string; // 例: "2026-06"
  monthlyPoints: number;
  finalRank: RankGrade;
}