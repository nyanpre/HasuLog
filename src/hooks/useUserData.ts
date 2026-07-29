// src/hooks/useUserData.ts
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface UserData {
  monthlyPoints: number;
  totalPoints: number;
  lastResetMonth: string;
}

export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setUserData({ monthlyPoints: 0, totalPoints: 0, lastResetMonth: "" });
        }
        setLoading(false);
      });
      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  return { userData, loading };
};