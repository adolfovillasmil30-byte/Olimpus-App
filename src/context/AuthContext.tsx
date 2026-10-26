import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  status: 'trial' | 'active' | 'suspended';
  createdAt: number;
  trialEndDate: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  daysRemainingInTrial: number;
  isTrialExpired: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_PREFIX = 'olimpus_profile_';
const CACHE_TIME_PREFIX = 'olimpus_profile_time_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to optimize Firestore free-tier reads

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const getCachedProfile = (uid: string): UserProfile | null => {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${uid}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading cached user profile:', e);
    }
    return null;
  };

  const setCachedProfile = (uid: string, profile: UserProfile) => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${uid}`, JSON.stringify(profile));
      localStorage.setItem(`${CACHE_TIME_PREFIX}${uid}`, Date.now().toString());
    } catch (e) {
      console.warn('Error saving cached user profile:', e);
    }
  };

  const fetchOrSyncProfile = async (firebaseUser: User, forceFetch = false) => {
    const uid = firebaseUser.uid;
    const cached = getCachedProfile(uid);
    const cacheTime = localStorage.getItem(`${CACHE_TIME_PREFIX}${uid}`);
    const isCacheFresh = cacheTime && Date.now() - Number(cacheTime) < CACHE_TTL_MS;

    // Use cached profile immediately if available and fresh to avoid Firestore read
    if (cached && isCacheFresh && !forceFetch) {
      // Evaluate trial expiry even on cached profile
      const now = Date.now();
      if (cached.status === 'trial' && now >= cached.trialEndDate) {
        cached.status = 'suspended';
        setCachedProfile(uid, cached);
        // Sync the suspension to Firestore asynchronously
        try {
          const userDocRef = doc(db, 'users', uid);
          await updateDoc(userDocRef, { status: 'suspended' });
        } catch (err) {
          console.warn('Error updating suspended status:', err);
        }
      }
      setUserProfile(cached);
      return;
    }

    // Otherwise, fetch from Firestore
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const now = Date.now();

        // Check if trial has expired
        if (data.status === 'trial' && now >= data.trialEndDate) {
          data.status = 'suspended';
          await updateDoc(userDocRef, { status: 'suspended' });
        }

        setUserProfile(data);
        setCachedProfile(uid, data);
      } else {
        // Document doesn't exist yet (auto-create 15-day trial)
        const now = Date.now();
        const initialProfile: UserProfile = {
          uid,
          email: firebaseUser.email || '',
          role: 'user',
          status: 'trial',
          createdAt: now,
          trialEndDate: now + 15 * 24 * 60 * 60 * 1000, // 15 days
        };

        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
        setCachedProfile(uid, initialProfile);
      }
    } catch (err) {
      console.error('Error fetching/syncing user document:', err);
      // Fallback to cache if network / Firestore read fails
      if (cached) {
        setUserProfile(cached);
      } else {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthError(null);
      if (currentUser) {
        setUser(currentUser);
        // First set cached profile for instant non-blocking UI
        const cached = getCachedProfile(currentUser.uid);
        if (cached) {
          setUserProfile(cached);
        }
        await fetchOrSyncProfile(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await fetchOrSyncProfile(cred.user, true);
    } catch (err: unknown) {
      let msg = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          msg = 'Correo electrónico o contraseña incorrectos.';
        } else if (err.message.includes('auth/user-not-found')) {
          msg = 'No existe una cuenta registrada con este correo.';
        } else if (err.message.includes('auth/too-many-requests')) {
          msg = 'Demasiados intentos fallidos. Intenta más tarde.';
        } else {
          msg = err.message;
        }
      }
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const now = Date.now();
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        role: 'user',
        status: 'trial',
        createdAt: now,
        trialEndDate: now + 15 * 24 * 60 * 60 * 1000, // 15 días gratis
      };

      const userDocRef = doc(db, 'users', cred.user.uid);
      await setDoc(userDocRef, newProfile);

      setCachedProfile(cred.user.uid, newProfile);
      setUser(cred.user);
      setUserProfile(newProfile);
    } catch (err: unknown) {
      let msg = 'Error al registrar la cuenta.';
      if (err instanceof Error) {
        if (err.message.includes('auth/email-already-in-use')) {
          msg = 'Este correo electrónico ya está registrado. Inicia sesión.';
        } else if (err.message.includes('auth/weak-password')) {
          msg = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (err.message.includes('auth/invalid-email')) {
          msg = 'El formato del correo electrónico no es válido.';
        } else {
          msg = err.message;
        }
      }
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        localStorage.removeItem(`${CACHE_PREFIX}${user.uid}`);
        localStorage.removeItem(`${CACHE_TIME_PREFIX}${user.uid}`);
      }
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrSyncProfile(user, true);
    }
  };

  const clearError = () => setAuthError(null);

  // Calculate remaining trial days
  const now = Date.now();
  const trialEnd = userProfile?.trialEndDate || now;
  const isTrialExpired = userProfile?.status === 'suspended' || (userProfile?.status === 'trial' && now >= trialEnd);
  const remainingMs = Math.max(0, trialEnd - now);
  const daysRemainingInTrial = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        daysRemainingInTrial,
        isTrialExpired,
        login,
        signup,
        logout,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
