import * as ScopedStorage from "react-native-scoped-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { KTB_FOLDER_URI_KEY } from "../constants/app";

// ดึง URI ที่บันทึกไว้
export const getSavedFolderUri = async () => {
  return await AsyncStorage.getItem(KTB_FOLDER_URI_KEY);
};

// บันทึก URI
export const saveFolderUri = async (uri) => {
  await AsyncStorage.setItem(KTB_FOLDER_URI_KEY, uri);
};

// ขอ Permission เลือกโฟลเดอร์
export const askForFolderPermission = async () => {
  try {
    Alert.alert(
      "ตั้งค่าโฟลเดอร์",
      "กรุณาเลือกโฟลเดอร์ที่แอป Krungthai NEXT ใช้บันทึกสลิป"
    );
    let dir = await ScopedStorage.openDocumentTree(true);
    if (dir) {
      await saveFolderUri(dir.uri);
      return dir.uri;
    }
    return null;
  } catch (e) {
    console.error("Permission Error:", e);
    return null;
  }
};

// ดึงรายชื่อไฟล์รูปภาพจากโฟลเดอร์ (กรองเฉพาะเดือนปัจจุบัน)
export const listImageFilesInCurrentMonth = async (folderUri) => {
  try {
    const dirFiles = await ScopedStorage.listFiles(folderUri);
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    return dirFiles.filter(
      (file) =>
        (file.mime === "image/jpeg" || file.mime === "image/png") &&
        file.lastModified >= firstDayOfMonth
    );
  } catch (e) {
    console.error("List Files Error:", e);
    throw e; // ส่ง Error กลับไปให้คนเรียกจัดการ (เช่น แจ้งเตือนว่าสิทธิ์หลุด)
  }
};