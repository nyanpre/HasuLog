// src/components/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { User } from 'lucide-react'; // 🌟 Settingsを削除
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfileData } from '../../types';

import ProfileCard from '../profile/ProfileCard';
import PointDashboard from '../profile/PointDashboard';
import FriendList from '../profile/FriendList';

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

  // 🌟 引数に newPhotoUrl を追加し、表示名と写真を両方更新できるように変更
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

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-extrabold flex items-center text-gray-800">
          <User className="mr-2 text-gray-600" size={24} />
          マイページ
        </h2>
      </div>

      <ProfileCard 
        profileData={profileData}
        meetsOptions={meetsOptions}
        onSave={handleSaveProfile}
        onLogout={handleLogout}
      />

      <PointDashboard />

      <FriendList friendId={friendId} />
    </div>
  );
}