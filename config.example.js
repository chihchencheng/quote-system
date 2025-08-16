/**
 * 報價系統配置文件範例
 * 
 * 使用說明：
 * 1. 複製此文件為 config.js
 * 2. 修改為您的實際設定值
 * 3. 將 config.js 加入 .gitignore，避免上傳到 GitHub
 */

const CONFIG = {
  // Google Apps Script 部署網址
  API_URL: "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec",
  
  // API 金鑰（與 Google Apps Script 中設定的相同）
  API_KEY: "your-secure-api-key-here",
  
  // 預設使用者（可選）
  DEFAULT_EMAIL: "your-email@company.com"
};

// 授權使用者清單（可從 Google Sheets 的 AuthSheet 工作表管理）
// 格式：每行一個電子郵件
const AUTHORIZED_USERS = [
  "owner@company.com",
  "staff1@company.com", 
  "staff2@company.com"
];

/**
 * 設定 Google Apps Script 的步驟：
 * 1. 打開 Google Apps Script 編輯器
 * 2. 點擊「文件」→「專案屬性」
 * 3. 新增以下腳本屬性：
 *    - API_KEY: your-secure-api-key-here
 *    - OWNER_EMAIL: owner@company.com
 */