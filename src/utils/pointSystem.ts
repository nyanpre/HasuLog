// src/utils/pointSystem.ts
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getRankInfo = (points: number) => {
  if (points >= 3000) return { rank: "S", label: "Gold", color: "text-yellow-500", bg: "bg-yellow-100", nextAt: null };
  if (points >= 2000) return { rank: "A", label: "Silver", color: "text-slate-400", bg: "bg-slate-100", nextAt: 5000 };
  if (points >= 1000) return { rank: "B", label: "Copper", color: "text-orange-700", bg: "bg-orange-100", nextAt: 3000 };
  if (points >= 400) return { rank: "C", label: "Amber", color: "text-amber-500", bg: "bg-amber-50", nextAt: 1500 };
  if (points >= 100) return { rank: "D", label: "Gray", color: "text-gray-500", bg: "bg-gray-100", nextAt: 400 };
  
  return { rank: "Unranked", label: "White", color: "text-gray-400", bg: "bg-white", border: "border border-gray-200", nextAt: 100 };
};

export const getStreamPoints = (streamType: string, isRecommended: boolean = false) => {
  if (streamType === "story") return 500;
  if (streamType === "fes_live") return 300;
  return isRecommended ? 200 : 100;
};

export const addWatchRecord = async (
  userId: string, 
  streamId: string, 
  streamTitle: string,
  isRecommended: boolean = false,
  streamType: string = "with_meets"
) => {
  if (!userId || !streamId) return;

  const earnedPoints = getStreamPoints(streamType, isRecommended);
  const actionMessage = isRecommended 
    ? `【今日のおすすめ】「${streamTitle}」を視聴して ${earnedPoints}pt 獲得しました！` 
    : `「${streamTitle}」を視聴して ${earnedPoints}pt 獲得しました！`;

  const actionType = isRecommended ? 'recommended_watch' : 'watch';

  const userRef = doc(db, "users", userId);
  const recordRef = doc(db, `users/${userId}/watchHistory`, streamId);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const userSnap = await getDoc(userRef);
  let isNewMonth = false;
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    if (userData.lastResetMonth !== currentMonth) {
      isNewMonth = true;
    }
  }

  // 🌟 新仕様: pointsBreakdown（月別内訳）を一緒に記録する
  if (!userSnap.exists() || isNewMonth) {
    await setDoc(userRef, {
      monthlyPoints: earnedPoints,
      totalPoints: increment(earnedPoints),
      lastResetMonth: currentMonth,
      [`pointsBreakdown.${currentMonth}.${streamType}`]: increment(earnedPoints),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } else {
    await updateDoc(userRef, {
      monthlyPoints: increment(earnedPoints),
      totalPoints: increment(earnedPoints),
      [`pointsBreakdown.${currentMonth}.${streamType}`]: increment(earnedPoints),
      updatedAt: serverTimestamp()
    });
  }

  const recordSnap = await getDoc(recordRef);
  if (recordSnap.exists()) {
    await updateDoc(recordRef, {
      viewCount: increment(1),
      lastViewedAt: now.toISOString(),
      lastAction: actionType,
      updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(recordRef, {
      streamId,
      streamTitle,
      viewCount: 1,
      isFavorite: false,
      memo: "",
      memoVisibility: "private",
      lastViewedAt: now.toISOString(),
      lastAction: actionType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  const timelineRef = collection(db, "timeline");
  await addDoc(timelineRef, {
    userId,
    message: actionMessage,
    type: isRecommended ? "recommended_watch" : "watch",
    createdAt: serverTimestamp()
  });
};

export const removeWatchRecord = async (
  userId: string, 
  streamId: string, 
  streamTitle: string,
  streamType: string = "with_meets"
) => {
  if (!userId || !streamId) return;

  const deductPoints = getStreamPoints(streamType, false);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const userRef = doc(db, "users", userId);
  const recordRef = doc(db, `users/${userId}/watchHistory`, streamId);

  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, {
      monthlyPoints: increment(-deductPoints),
      totalPoints: increment(-deductPoints),
      [`pointsBreakdown.${currentMonth}.${streamType}`]: increment(-deductPoints),
      updatedAt: serverTimestamp()
    });
  }

  const recordSnap = await getDoc(recordRef);
  if (recordSnap.exists()) {
    const currentCount = recordSnap.data().viewCount || 0;
    if (currentCount > 0) {
      await updateDoc(recordRef, {
        viewCount: increment(-1),
        lastAction: 'decrease',
        updatedAt: serverTimestamp()
      });
    }
  }

  const timelineRef = collection(db, "timeline");
  await addDoc(timelineRef, {
    userId,
    message: `「${streamTitle}」の視聴記録を1回分取り消しました`,
    type: "remove_watch",
    createdAt: serverTimestamp()
  });
};