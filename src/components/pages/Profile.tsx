// src/components/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { User, ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfileData } from '../../types';

import ProfileCard from '../profile/ProfileCard';
import FriendList from '../profile/FriendList';
import { RankCard } from '../profile/RankCard';
import { HistoryLogs } from '../profile/HistoryLogs';
import { FriendRankComparison } from '../profile/FriendRankComparison';
import type { FriendStat } from '../profile/FriendRankComparison';
import type { WatchHistory, MonthlyLog } from '../../types/rank';

// --- ダミーデータ ---
const DUMMY_HISTORY: WatchHistory[] = [
  { id: '1', userId: 'user1', contentId: 'c1', contentTitle: 'With×MEETS: 夏の特別編', pointsEarned: 100, createdAt: new Date().toISOString() },
  { id: '2', userId: 'user1', contentId: 'c2', contentTitle: 'STATION: ゲスト回', pointsEarned: 100, createdAt: new Date(Date.now() - 86400000).toISOString() },
];
const DUMMY_MONTHLY_LOGS: MonthlyLog[] = [
  { yearMonth: '2026-06', monthlyPoints: 3200, finalRank: 'A' },
  { yearMonth: '2026-05', monthlyPoints: 1800, finalRank: 'B' },
  { yearMonth: '2026-04', monthlyPoints: 500, finalRank: 'C' },
];
const DUMMY_FRIENDS: FriendStat[] = [
  { id: 'f1', name: '蓮ノ空ファンA', monthlyPoints: 5200, rank: 'S' },
  { id: 'f2', name: 'あなた（自分）', monthlyPoints: 3200, rank: 'A' },
  { id: 'f3', name: 'めぐみー', monthlyPoints: 1400, rank: 'C' },
  { id: 'f4', name: '初心者ユーザー', monthlyPoints: 50, rank: 'Unranked' },
];
// ---------------------------------

export default function Profile() {
  const { currentUser } = useAuth();
  
  const [meetsOptions, setMeetsOptions] = useState<string[]>(["未設定"]);
  const [profileData, setProfileData] = useState<UserProfileData>({
    oshiMember: "未設定",
    oshiMeets: "未設定",
    oshiRecord: "未設定",
    oshiFesLive: "未設定",
  });
  const [friendId, setFriendId] = useState<string>("");
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let currentData = userDocSnap.exists() ? userDocSnap.data() : {};
          let updates: any = {};
          let needsUpdate = false;

          setProfileData({
            oshiMember: currentData.oshiMember || "未設定",
            oshiMeets: currentData.oshiMeets || "未設定",
            oshiRecord: currentData.oshiRecord || "未設定",
            oshiFesLive: currentData.oshiFesLive || "未設定",
          });

          if (currentData.friendId) {
            setFriendId(currentData.friendId);
          } else {
            const newFriendId = Math.floor(10000000 + Math.random() * 90000000).toString();
            updates.friendId = newFriendId;
            needsUpdate = true;
            setFriendId(newFriendId);
            
            if (!currentData.displayName) {
              updates.displayName = currentUser.displayName || "名無しさん";
            }
            if (currentUser.photoURL && !currentData.photoURL) {
              updates.photoURL = currentUser.photoURL;
            }
          }

          if (needsUpdate) {
            await setDoc(userDocRef, updates, { merge: true });
          }

        } catch (error) {
          console.error("プロフィール取得エラー:", error);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchMeetsTitles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'streams'));
        const meetsList = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            if (!data.title) return null;
            return data.date ? `${data.title} ${data.date}` : data.title;
          })
          .filter(Boolean) as string[];
        
        setMeetsOptions(["未設定", ...new Set(meetsList)]);
      } catch (error) {
        console.error("With×MEETSデータ取得エラー:", error);
      }
    };
    fetchMeetsTitles();
  }, []);

  const handleSaveProfile = async (newName: string, newProfileData: UserProfileData, newPhotoUrl?: string) => {
    try {
      if (!currentUser) return;
      const authUpdates: any = {};
      if (newName !== currentUser.displayName) authUpdates.displayName = newName;
      if (newPhotoUrl !== undefined && newPhotoUrl !== currentUser.photoURL) authUpdates.photoURL = newPhotoUrl;
      
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(currentUser, authUpdates);
      }
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docData: any = {
        displayName: newName,
        ...newProfileData,
        updatedAt: new Date()
      };
      if (newPhotoUrl !== undefined) {
        docData.photoURL = newPhotoUrl;
      }

      await setDoc(userDocRef, docData, { merge: true });
      setProfileData(newProfileData);
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  if (showDashboard) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 space-y-6">
        <button 
          onClick={() => setShowDashboard(false)}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm w-fit"
        >
          <ArrowLeft size={16} className="mr-2" />
          プロフィールに戻る
        </button>
        
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-gray-600" size={28} />
          <h2 className="text-2xl font-extrabold text-gray-800">HasuLog ダッシュボード</h2>
        </div>

        <HistoryLogs historyList={DUMMY_HISTORY} monthlyLogs={DUMMY_MONTHLY_LOGS} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold flex items-center text-gray-800">
          <User className="mr-2 text-gray-600" size={24} />
          マイページ
        </h2>
      </div>

      {/* 🌟 1. 推し設定（プロフィール）を一番上に！ */}
      <ProfileCard 
        profileData={profileData}
        meetsOptions={meetsOptions}
        onSave={handleSaveProfile}
        onLogout={handleLogout}
      />

      {/* 🌟 2. ランクカード */}
      <RankCard 
        monthlyPoints={3200} 
        totalPoints={15400} 
        onOpenDashboard={() => setShowDashboard(true)} 
      />

      {/* 🌟 3. フレンド周りをまとめる */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FriendRankComparison friends={DUMMY_FRIENDS} />
        <FriendList friendId={friendId} />
      </div>
    </div>
  );
}