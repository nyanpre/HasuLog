// src/components/profile/ProfileCard.tsx
import { useState, useEffect } from 'react';
import { Edit2, Check, X, LogOut, Heart, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// 🌟 追加: フォロー数・フォロワー数を取得するためのフック
import { useFriends } from '../../hooks/useFriends';
import type { UserProfileData } from '../../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase'; 

const MEMBERS = [
  "未設定", "日野下 花帆", "村野 さやか", "大沢 瑠璃乃", "乙宗 梢", "夕霧 綴理", 
  "藤島 慈", "百生 吟子", "徒町 小鈴", "安養寺 姫芽", "セラス 柳田 リリエンフェルト", "桂城 泉"
];

const recordOptions = ["未設定", "103期 第1話 (仮)", "104期 第1話 (仮)"];
const fesLiveOptions = ["未設定", "103期 4月度Fes×LIVE (仮)"];

interface ProfileCardProps {
  profileData: UserProfileData;
  meetsOptions: string[];
  onSave: (newName: string, newProfileData: UserProfileData, newPhotoUrl?: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function ProfileCard({ profileData, meetsOptions, onSave, onLogout }: ProfileCardProps) {
  const { currentUser } = useAuth();
  // 🌟 追加: フックからフォローリストとフォロワーリストを取得
  const { friends, followers } = useFriends();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingOshi, setIsEditingOshi] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editForm, setEditForm] = useState<UserProfileData>(profileData);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.displayName || "");
      setEditPhotoUrl(currentUser.photoURL || "");
    }
  }, [currentUser]);

  useEffect(() => {
    setEditForm(profileData);
  }, [profileData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setEditPhotoUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSaveProfileInfo = async () => {
    setIsUploading(true);
    let finalPhotoUrl = editPhotoUrl;

    try {
      if (selectedFile && currentUser) {
        const fileRef = ref(storage, `profiles/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(fileRef, selectedFile);
        finalPhotoUrl = await getDownloadURL(fileRef);
      }

      await onSave(editName, profileData, finalPhotoUrl);
      
      setIsEditingProfile(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      alert("画像のアップロードに失敗しました。");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveOshiInfo = async () => {
    await onSave(currentUser?.displayName || editName, editForm, currentUser?.photoURL || editPhotoUrl);
    setIsEditingOshi(false);
  };

  // 🌟 追加: タップ時にフレンドリストへスクロールする補助関数
  const scrollToFriendList = () => {
    const listElement = document.getElementById('friend-list-section');
    if (listElement) listElement.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
      {/* ユーザー情報 */}
      <div className="flex items-center space-x-4 mb-5">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-2xl shadow-inner overflow-hidden flex-shrink-0 relative group">
          {currentUser?.photoURL || editPhotoUrl ? (
            <img src={editPhotoUrl || currentUser?.photoURL || ""} alt="プロフィール" className="w-full h-full object-cover" />
          ) : (
            editName.charAt(0) || 'U'
          )}
          
          {isEditingProfile && (
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
              <Upload size={20} className="text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          {isEditingProfile ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="表示名"
                className="w-full border border-gray-300 rounded-md p-1.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                disabled={isUploading}
              />
              <p className="text-[10px] text-gray-400">※アイコンをタップして画像を変更</p>
              
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={handleSaveProfileInfo}
                  disabled={isUploading}
                  className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center"
                >
                  {isUploading ? "保存中..." : "保存"}
                </button>
                <button 
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditName(currentUser?.displayName || "");
                    setEditPhotoUrl(currentUser?.photoURL || "");
                    setSelectedFile(null);
                  }}
                  disabled={isUploading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-800 truncate">
                  {currentUser?.displayName || editName || '名無しさん'}
                </h2>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="プロフィールを編集"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              {/* 🌟 追加: フォロー・フォロワー数表示（タップ可能） */}
              <div className="flex gap-4 mt-2">
                <button onClick={scrollToFriendList} className="text-xs sm:text-sm text-gray-600 hover:text-pink-600 transition-colors">
                  <span className="font-bold text-gray-900">{friends?.length || 0}</span> フォロー
                </button>
                <button onClick={scrollToFriendList} className="text-xs sm:text-sm text-gray-600 hover:text-pink-600 transition-colors">
                  <span className="font-bold text-gray-900">{followers?.length || 0}</span> フォロワー
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 推し情報 */}
      <div className="mb-5 relative">
        {isEditingOshi ? (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">推しメンバー</label>
              <select
                value={editForm.oshiMember}
                onChange={(e) => setEditForm({...editForm, oshiMember: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              >
                {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">推しWith×MEETS (STATION含む)</label>
              <input
                type="text"
                list="meets-list"
                value={editForm.oshiMeets}
                onChange={(e) => setEditForm({...editForm, oshiMeets: e.target.value})}
                placeholder="検索または入力..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <datalist id="meets-list">
                {meetsOptions.map(option => <option key={option} value={option} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">推し活動記録</label>
              <input
                type="text"
                list="record-list"
                value={editForm.oshiRecord}
                onChange={(e) => setEditForm({...editForm, oshiRecord: e.target.value})}
                placeholder="検索または入力..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <datalist id="record-list">
                {recordOptions.map(option => <option key={option} value={option} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">推しFes×LIVE</label>
              <input
                type="text"
                list="feslive-list"
                value={editForm.oshiFesLive}
                onChange={(e) => setEditForm({...editForm, oshiFesLive: e.target.value})}
                placeholder="検索または入力..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <datalist id="feslive-list">
                {fesLiveOptions.map(option => <option key={option} value={option} />)}
              </datalist>
            </div>

            <div className="flex space-x-2 pt-2">
              <button 
                onClick={handleSaveOshiInfo}
                className="flex-1 flex items-center justify-center space-x-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-sm"
              >
                <Check size={18} />
                <span className="text-sm">保存</span>
              </button>
              <button 
                onClick={() => {
                  setIsEditingOshi(false);
                  setEditForm(profileData);
                }}
                className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                <X size={18} />
                <span className="text-sm">キャンセル</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-pink-200 p-4 rounded-lg text-sm text-gray-700 relative shadow-sm">
            <button 
              onClick={() => setIsEditingOshi(true)}
              className="absolute top-3 right-3 text-pink-400 hover:text-pink-600 bg-white/60 hover:bg-white p-1.5 rounded-full transition-colors"
              aria-label="推し情報を編集"
            >
              <Edit2 size={16} />
            </button>
            <div className="flex items-center mb-3 text-pink-600 font-bold border-b border-pink-100 pb-2">
              <Heart size={16} className="mr-1.5" />
              わたしの推し
            </div>
            <div className="space-y-2.5 pr-8">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-xs text-pink-500 font-bold w-28">メンバー</span>
                <span className="font-medium text-gray-800">{profileData.oshiMember}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="text-xs text-pink-500 font-bold w-28 mt-0.5">With×MEETS</span>
                <span className="font-medium text-gray-600 text-xs sm:text-sm flex-1 leading-snug">{profileData.oshiMeets}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="text-xs text-pink-500 font-bold w-28 mt-0.5">活動記録</span>
                <span className="font-medium text-gray-600 text-xs sm:text-sm flex-1 leading-snug">{profileData.oshiRecord}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="text-xs text-pink-500 font-bold w-28 mt-0.5">Fes×LIVE</span>
                <span className="font-medium text-gray-600 text-xs sm:text-sm flex-1 leading-snug">{profileData.oshiFesLive}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isEditingOshi && (
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2 px-4 rounded-lg transition duration-200 border border-gray-200"
        >
          <LogOut size={18} />
          <span className="text-sm">ログアウト</span>
        </button>
      )}
    </div>
  );
}