// src/components/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react'; // 🌟 LogOutアイコンを追加
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfileData } from '../../types';

import ProfileCard from '../profile/ProfileCard';
import FriendList from '../profile/FriendList';
import { RankCard } from '../profile/RankCard';
import { PointDashboard } from '../profile/PointDashboard';
import { FriendRankComparison } from '../profile/FriendRankComparison';

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

  const isAnonymous = currentUser?.isAnonymous || false;

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

      {/* 🌟 変更: ゲストユーザーには警告メッセージと専用のログアウトボタンを表示 */}
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

      {/* ゲストの時はProfileCard自体を触れないようにガード */}
      <div className={isAnonymous ? "opacity-60 pointer-events-none select-none" : ""}>
        <ProfileCard 
          profileData={profileData}
          meetsOptions={meetsOptions}
          onSave={handleSaveProfile}
          onLogout={handleLogout}
        />
      </div>

      <RankCard onOpenDashboard={() => setShowDashboard(true)} />

      {/* ゲストの時はフレンド機能などを隠す（半透明にしてガード） */}
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