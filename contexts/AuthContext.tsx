import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db, fbProvider, isFirebaseConfigured } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  credits: number;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string) => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  deductCredit: (amount?: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Fallback state for local dev if Firebase isn't configured
  const [mockCredits, setMockCredits] = useState(300);

  const syncUserDoc = async (uid: string) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      setCredits(docSnap.data().credits || 0);
    } else {
      await setDoc(userRef, { credits: 300, createdAt: new Date() });
      setCredits(300);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Mock mode
      const savedMockUser = localStorage.getItem('mockUser');
      if (savedMockUser) {
        setUser({ email: savedMockUser, uid: 'mock-123' } as User);
        setCredits(parseInt(localStorage.getItem('mockCredits') || '300'));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserDoc(currentUser.uid);
      } else {
        setCredits(0);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (e: string, p: string) => {
    if (!auth) {
      localStorage.setItem('mockUser', e);
      setUser({ email: e, uid: 'mock-123' } as User);
      setCredits(parseInt(localStorage.getItem('mockCredits') || '300'));
      return;
    }
    await signInWithEmailAndPassword(auth, e, p);
  };

  const register = async (e: string, p: string) => {
    if (!auth) {
      localStorage.setItem('mockUser', e);
      localStorage.setItem('mockCredits', '300');
      setUser({ email: e, uid: 'mock-123' } as User);
      setCredits(300);
      return;
    }
    const res = await createUserWithEmailAndPassword(auth, e, p);
    await syncUserDoc(res.user.uid);
  };

  const loginWithFacebook = async () => {
    if (!auth || !fbProvider) {
      const e = "facebookuser@example.com";
      localStorage.setItem('mockUser', e);
      setUser({ email: e, uid: 'mock-123' } as User);
      setCredits(parseInt(localStorage.getItem('mockCredits') || '300'));
      return;
    }
    const res = await signInWithPopup(auth, fbProvider);
    await syncUserDoc(res.user.uid);
  };

  const logout = async () => {
    if (!auth) {
      localStorage.removeItem('mockUser');
      setUser(null);
      setCredits(0);
      return;
    }
    await signOut(auth);
  };

  const deductCredit = async (amount = 1): Promise<boolean> => {
    if (credits < amount) return false;

    if (!db || !user) {
      const newCredits = credits - amount;
      setCredits(newCredits);
      localStorage.setItem('mockCredits', newCredits.toString());
      return true;
    }

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      credits: increment(-amount)
    });
    setCredits(prev => prev - amount);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, credits, loading, login, register, loginWithFacebook, logout, deductCredit }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
