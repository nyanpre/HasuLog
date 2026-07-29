// src/utils/pointSystem.ts
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase'; // firebase.tsのパスに合わせて調整してください

/**
 * 動画視聴時のポイント（100pt）と履歴を保存する関数
 */
export const addWatchRecord = async (userId: string, videoId: string, videoTitle: string) => {
  if (!userId) return;

  try {
    // 1. ユーザーのポイントを加算（累計と今月の両方）
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      monthlyPoints: increment(100),
      totalPoints: increment(100),
    });

    // 2. 視聴履歴コレクションにログを追加
    // users/{userId}/watchHistory/{historyId} の階層に保存します
    const historyRef = collection(db, 'users', userId, 'watchHistory');
    await addDoc(historyRef, {
      contentId: videoId,
      contentTitle: videoTitle,
      pointsEarned: 100,
      createdAt: new Date().toISOString(),
    });

    console.log('ポイントと履歴の保存が完了しました');
  } catch (error) {
    console.error('ポイント保存エラー:', error);
    throw error;
  }
};