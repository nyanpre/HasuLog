// src/components/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { signOut, updateProfile } from 'firebase/auth';
// 🌟 collection, getDocs は不要になったためインポートから削除
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import type { UserProfileData } from '../../types';

import ProfileCard from '../profile/ProfileCard';
import FriendList from '../profile/FriendList';
import { RankCard } from '../profile/RankCard';
import { PointDashboard } from '../profile/PointDashboard';
import { FriendRankComparison } from '../profile/FriendRankComparison';

// 🌟 追加: 4つの JSON データをすべてインポート
import fesLiveRecords from '../../data/feslive_wiki_data.json';
import activityRecords from '../../data/story_wiki_data.json';
import withMeetsRecords from '../../data/withmeets_wiki_data.json';
import withStationRecords from '../../data/withstation_wiki_data.json';

export default function Profile() {
  const { currentUser } = useAuth();
  
  // 選択肢を保持するステート
  const [meetsOptions, setMeetsOptions] = useState<string[]>(["未設定"]);
  const [recordOptions, setRecordOptions] = useState<string[]>(["未設定"]);
  const [fesLiveOptions, setFesLiveOptions] = useState<string[]>(["未設定"]);

  const [profileData, setProfileData] = useState<UserProfileData>({
    oshiMember: "未設定",
    oshiMeets: "未設定",
    oshiRecord: "未設定",
    oshiFesLive: "未設定",
  });
  const [friendId, setFriendId] = useState<string>("");
  const [showDashboard, setShowDashboard] = useState<boolean>(false);

  const isAnonymous = currentUser?.isAnonymous || false;

  // 🌟 統合: JSONファイルからすべての選択肢リストを生成（Firebase通信なし）
  useEffect(() => {
    // 1. 活動記録のタイトル一覧を抽出
    const records = activityRecords.map(item => {
      const season = item.season || "";
      const title = item.title || "";
      if (title.includes(season)) {
        return title;
      }
      return `${season} ${title}`.trim();
    });
    setRecordOptions(["未設定", ...new Set(records)]);

    // 2. Fes×LIVEのタイトル一覧を抽出
    const fesLives = fesLiveRecords.map(item => item.title || "");
    setFesLiveOptions(["未設定", ...new Set(fesLives)]);

    // 3. With×MEETS と みらくらぱーく！ラジオ(STATION) を結合して抽出
    const allMeets = [...withMeetsRecords, ...withStationRecords];
    const meetsList = allMeets
      .map(item => {
        if (!item.title) return null;
        return item.date ? `${item.title} ${item.date}` : item.title;
      })
      .filter(Boolean) as string[];
    
    // 日付順やタイトル順など必要に応じて .sort() を挟むことも可能です
    setMeetsOptions(["未設定", ...new Set(meetsList)]);
  }, []);

  // Firebase からユーザー自身のプロフィールだけを取得する
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
            if (!isAnonymous) {
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
            } else {
              setFriendId("未登録(ゲスト)");
            }
          }

          if (needsUpdate && !isAnonymous) {
            await setDoc(userDocRef, updates, { merge: true });
          }
        } catch (error) {
          console.error("プロフィール取得エラー:", error);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser, isAnonymous]);

  const handleSaveProfile = async (newName: string, newProfileData: UserProfileData, newPhotoUrl?: string) => {
    if (!currentUser || isAnonymous) return;
    
    try {
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

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold flex items-center text-gray-800">
          <User className="mr-2 text-gray-600" size={24} />
          マイページ
        </h2>
      </div>

      {isAnonymous && (
        <div className="bg-gray-100 p-5 rounded-xl text-center text-sm text-gray-600 font-bold border border-gray-200 shadow-sm flex flex-col items-center gap-4">
          <p className="leading-relaxed">
            🔒 プロフィールの編集やフレンド機能を利用するには、<br />
            Googleアカウントでのログインが必要です。
          </p>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors pointer-events-auto"
          >
            <LogOut size={16} />
            ログアウトしてログイン画面に戻る
          </button>
        </div>
      )}

      <div className={isAnonymous ? "opacity-60 pointer-events-none select-none" : ""}>
        <ProfileCard 
          profileData={profileData}
          meetsOptions={meetsOptions}
          recordOptions={recordOptions}
          fesLiveOptions={fesLiveOptions}
          onSave={handleSaveProfile}
          onLogout={handleLogout}
        />
      </div>

      <RankCard onOpenDashboard={() => setShowDashboard(true)} />

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-start ${isAnonymous ? "opacity-60 pointer-events-none select-none" : ""}`}>
        <FriendRankComparison />
        <FriendList friendId={friendId} />
      </div>

      {showDashboard && (
        <PointDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}