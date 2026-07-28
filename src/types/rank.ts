// ランク定義
export type RankGrade = 'NONE' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface RankConfig {
  grade: RankGrade;
  name: string;
  minPoints: number;
  badgeBg: string;       // エンブレム背景色
  cardBg: string;        // カード全体の背景色
  textColor: string;     // 文字色
}

// 視聴ログの1件
export interface WatchHistory {
  id: string;
  contentTitle: string; // コンテンツ名（例: With×MEETS #12）
  pointsEarned: number; // 獲得ポイント（基本100pt）
  createdAt: Date;
}

// 月次アーカイブのログ
export interface MonthlyLog {
  yearMonth: string;    // 例: "2026-07"
  monthlyPoints: number;
  finalRank: RankGrade;
  updatedAt: Date;
}

// ユーザーのポイント・ランク関連ステータス
export interface UserRankStats {
  monthlyPoints: number;  // 今月のポイント
  totalPoints: number;    // 累計ポイント
  currentRank: RankGrade; // 現在のランク
  lastUpdatedMonth: string; // 最終更新月（"2026-07"）
}