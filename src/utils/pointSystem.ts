// src/utils/pointSystem.ts
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const POINT_PER_WATCH = 100;

// ランク判定ロジック (White/Gray/Amber/Copper/Silver/Gold)
export const getRankInfo = (points: number) => {
  if (points >= 5000) return { rank: "S", label: "Gold", color: "text-yellow-500", bg: "bg-yellow-100", nextAt: null };
  if (points >= 3000) return { rank: "A", label: "Silver", color: "text-slate-400", bg: "bg-slate-100", nextAt: 5000 };
  if (points >= 1500) return { rank: "B", label: "Copper", color: "text-orange-700", bg: "bg-orange-100", nextAt: 3000 };
  if (points >= 400) return { rank: "C", label: "Amber", color: "text-amber-500", bg: "bg-amber-50", nextAt: 1500 };
  if (points >= 100) return { rank: "D", label: "Gray", color: "text-gray-500", bg: "bg-gray-100", nextAt: 400 };
  
  return { rank: "Unranked", label: "White", color: "text-gray-400", bg: "bg-white", border: "border border-gray-200", nextAt: 100 };
};

// 視聴記録の追加 ＆ ポイント付与
export const addWatchRecord = async (userId: string, streamId: string, streamTitle: string) => {
  if (!userId || !streamId) return;

  const userRef = doc(db, "users", userId);
  const recordRef = doc(db, `users/${userId}/watchHistory`, streamId);

  // 1. 現在の年月を取得 (例: "2024-03")
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 2. ユーザーデータの取得と月次リセット判定
  const userSnap = await getDoc(userRef);
  let isNewMonth = false;
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    if (userData.lastResetMonth !== currentMonth) {
      isNewMonth = true; // 月が変わっていたらリセットフラグを立てる
    }
  }

  // 3. ユーザーポイントの更新
  if (!userSnap.exists() || isNewMonth) {
    // 新規ユーザー、または月が変わった最初の視聴の場合
    await setDoc(userRef, {
      monthlyPoints: POINT_PER_WATCH, // 今月のポイントを100からリスタート
      totalPoints: increment(POINT_PER_WATCH), // 累計はそのまま足す
      lastResetMonth: currentMonth,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else {
    // 同月内の視聴の場合
    await updateDoc(userRef, {
      monthlyPoints: increment(POINT_PER_WATCH),
      totalPoints: increment(POINT_PER_WATCH),
      updatedAt: serverTimestamp()
    });
  }

  // 4. 視聴履歴（サブコレクション）の更新
  const recordSnap = await getDoc(recordRef);
  if (recordSnap.exists()) {
    await updateDoc(recordRef, {
      viewCount: increment(1),
      lastViewedAt: now.toISOString(),
      updatedAt: serverTimestamp()
    });
  } else {
    // 初回視聴の場合
    await setDoc(recordRef, {
      streamId,
      streamTitle, // デバッグ用にタイトルも入れておく
      viewCount: 1,
      isFavorite: false,
      memo: "",
      lastViewedAt: now.toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
};