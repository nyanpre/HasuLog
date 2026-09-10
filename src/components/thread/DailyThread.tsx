// src/components/thread/DailyThread.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, Send, Clock, User } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useFriends } from '../../hooks/useFriends';

interface Comment {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  createdAt: any;
  dateStr: string;
  streamId?: string;
}

interface DailyThreadProps {
  streamId?: string;
}

export function DailyThread({ streamId }: DailyThreadProps) {
  const { currentUser } = useAuth();
  const { friends } = useFriends();
  
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // 🌟 過去日の不要コメントを削除するクリーンアップ処理
  const cleanOldComments = async (todayStr: string) => {
    try {
      // 本日以外のコメントを取得
      const oldQuery = query(collection(db, 'dailyComments'), where('dateStr', '<', todayStr));
      const snapshot = await getDocs(oldQuery);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      // 削除権限エラーや通信エラー時もメインのチャットを止めない
      console.warn("過去コメントの削除スキップ:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const todayStr = getTodayStr();

    const q = streamId
      ? query(
          collection(db, 'dailyComments'),
          where('dateStr', '==', todayStr),
          where('streamId', '==', streamId)
        )
      : query(
          collection(db, 'dailyComments'),
          where('dateStr', '==', todayStr)
        );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];

      setAllComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [currentUser, streamId]);

  const comments = useMemo(() => {
    return allComments
      .filter(c => c.uid === currentUser?.uid || friends.some(f => f.uid === c.uid))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeA - timeB;
      });
  }, [allComments, currentUser, friends]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const todayStr = getTodayStr();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'dailyComments'), {
        uid: currentUser.uid,
        displayName: currentUser.displayName || '名無しさん',
        photoURL: currentUser.photoURL || '',
        text: inputText.trim(),
        createdAt: serverTimestamp(),
        dateStr: todayStr,
        streamId: streamId || '',
      });
      setInputText('');

      // 🌟 送信のついでに過去の古いコメントを安全に削除
      cleanOldComments(todayStr);
    } catch (error) {
      console.error("コメント送信エラー:", error);
      alert("送信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden flex flex-col h-[400px] mb-5">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-3 text-white flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} />
          <h3 className="font-bold text-sm text-shadow-sm">今日の感想スレッド</h3>
        </div>
        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm">
          <Clock size={12} />
          <span>0時リセット</span>
        </div>
      </div>

      {/* タイムライン */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4 custom-scrollbar"
      >
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <MessageCircle size={32} className="opacity-20" />
            <p className="text-xs">今日の感想を一番乗りで書き込もう！</p>
          </div>
        ) : (
          comments.map(comment => {
            const isMe = comment.uid === currentUser?.uid;
            return (
              <div key={comment.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {comment.photoURL ? (
                    <img src={comment.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-pink-400" />
                  )}
                </div>

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1">{comment.displayName}</span>
                  <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? 'bg-pink-500 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    {comment.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1">{formatTime(comment.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="今の気持ちをシェア！"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-shadow"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSubmitting}
          className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
        >
          <Send size={16} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}