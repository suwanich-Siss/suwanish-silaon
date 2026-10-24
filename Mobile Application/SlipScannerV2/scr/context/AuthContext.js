import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { getUserById } from "../database/database";
// import { syncProfileToServer } from "../database/syncService";

const USER_ID_KEY   = "userId";
const SYNC_TOKEN_KEY = "syncToken";

// สร้าง token แบบ deterministic จาก userId + email
// ใช้ SHA-256 เพื่อให้ได้ค่าคงที่ต่อ user — ไม่เปลี่ยนแปลงระหว่าง session
// ถ้า token หายจาก AsyncStorage สามารถ re-generate ได้ค่าเดิมเสมอ
const generateSyncToken = async (userId, email) =>
  Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}:${email}`
  );

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,      setUser]      = useState(null);
  const [syncToken, setSyncToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on app start ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedId    = await AsyncStorage.getItem(USER_ID_KEY);
        const storedToken = await AsyncStorage.getItem(SYNC_TOKEN_KEY);
        if (storedId) {
          const userData = await getUserById(parseInt(storedId, 10));
          if (userData) {
            setUser(userData);
            // ถ้ามี token เก็บไว้ใช้เลย ถ้าไม่มีให้ re-generate
            if (storedToken) {
              setSyncToken(storedToken);
            } else {
              const token = await generateSyncToken(userData.user_id, userData.email);
              setSyncToken(token);
              await AsyncStorage.setItem(SYNC_TOKEN_KEY, token);
            }
          }
        }
      } catch (e) {
        console.error("Restore session failed:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (userData) => {
    const existingToken = await AsyncStorage.getItem(SYNC_TOKEN_KEY);
    const token = existingToken ?? await generateSyncToken(userData.user_id, userData.email);
    setUser(userData);
    setSyncToken(token);
    await AsyncStorage.setItem(USER_ID_KEY,    String(userData.user_id));
    await AsyncStorage.setItem(SYNC_TOKEN_KEY, token);

    // syncProfileToServer({
    //   email: userData.email,
    //   pdpaAcceptedAt: userData.pdpa_accepted_at ?? null,
    //   accountToken: token,
    // }).catch((e) => {
    //   console.error("Profile sync failed:", e);
    // });

  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    setUser(null);
    setSyncToken(null);
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(SYNC_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, syncToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);