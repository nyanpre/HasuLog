import type { RankGrade } from '../types/rank';

export interface RankInfo {
  name: string;
  threshold: number;
  textColor: string;
  cardBg: string;
  badgeBg: string;
}

export const RANKS: Record<RankGrade, RankInfo> = {
  Unranked: {
    name: '-',
    threshold: 0,
    textColor: 'text-gray-400',
    cardBg: 'bg-white border-gray-200',
    badgeBg: 'bg-white text-gray-400 border-2 border-gray-200', // 白 (-)
  },
  D: {
    name: 'D',
    threshold: 100,
    textColor: 'text-gray-700',
    cardBg: 'bg-gray-50 border-gray-300',
    badgeBg: 'bg-gray-300 text-gray-800 shadow-md', // 灰色 (D)
  },
  C: {
    name: 'C',
    threshold: 400,
    textColor: 'text-amber-800',
    cardBg: 'bg-amber-50/50 border-amber-200',
    badgeBg: 'bg-[#D2B48C] text-amber-950 shadow-md', // 薄茶色 (C)
  },
  B: {
    name: 'B',
    threshold: 1500,
    textColor: 'text-orange-900',
    cardBg: 'bg-orange-50/50 border-orange-300',
    badgeBg: 'bg-[#B87333] text-white shadow-md', // 銅 (B)
  },
  A: {
    name: 'A',
    threshold: 3000,
    textColor: 'text-slate-900',
    cardBg: 'bg-slate-50 border-slate-300',
    badgeBg: 'bg-[#C0C0C0] text-slate-900 shadow-lg', // 銀 (A)
  },
  S: {
    name: 'S',
    threshold: 5000,
    textColor: 'text-yellow-900',
    cardBg: 'bg-yellow-50 border-yellow-400',
    badgeBg: 'bg-[#FFD700] text-yellow-950 shadow-lg', // 金 (S)
  },
};

/**
 * 現在のポイントからランクを計算する関数
 */
export const calculateRank = (points: number): RankGrade => {
  if (points >= 5000) return 'S';
  if (points >= 3000) return 'A';
  if (points >= 1500) return 'B';
  if (points >= 400) return 'C';
  if (points >= 100) return 'D';
  return 'Unranked';
};

export interface NextRankInfo {
  name: string;
  threshold: number;
}

/**
 * 次のランクの情報（名前と必要なポイント）を取得する関数
 */
export const getNextRankInfo = (points: number): NextRankInfo | null => {
  if (points >= 5000) return null; // Sランク（上限）
  if (points >= 3000) return { name: 'S', threshold: 5000 };
  if (points >= 1500) return { name: 'A', threshold: 3000 };
  if (points >= 400) return { name: 'B', threshold: 1500 };
  if (points >= 100) return { name: 'C', threshold: 400 };
  return { name: 'D', threshold: 100 };
};