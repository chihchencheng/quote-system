# 電器行內部報價系統

## 系統簡介
這是一套專為電器行設計的內部報價系統，結合了前端網頁介面與 Google Sheets 後端資料管理，提供完整的報價、列印、記錄功能。

## 系統特色
- **響應式設計**：支援電腦、平板、手機等各種裝置
- **即時報價**：自動計算折扣後金額
- **PDF 產生**：一鍵產生專業 PDF 報價單
- **列印功能**：直接列印格式化報價單
- **資料儲存**：報價記錄自動儲存到 Google Sheets
- **本地暫存**：購物車資料本地儲存，避免資料遺失

## 檔案結構
```
quote-system/
├── index.html          # 主頁面
├── app.js             # 前端 JavaScript 功能
├── quote_sys.gs       # Google Apps Script 後端
├── README.md          # 使用說明
└── .gitignore         # Git 忽略檔案
```

## 系統需求
- Google 帳號
- Google Sheets
- 網路連線
- 現代瀏覽器 (Chrome, Firefox, Safari, Edge)

## 安全設定與安裝步驟

### 🔒 重要安全更新
現在系統加入了完整的驗證機制，只有授權使用者才能存取。

### 1. Google Sheets 安全設定
1. 建立新的 Google Sheets
2. 建立以下工作表：
   - **Products**（產品資料）
   - **Quotes**（報價記錄）
   - **Customers**（客戶資料）
   - **AuthorizedUsers**（授權使用者清單）

#### 設定授權使用者
在 **AuthorizedUsers** 工作表建立：
| A欄（電子郵件） |
|------------------|
| owner@yourcompany.com |
| staff1@yourcompany.com |
| staff2@yourcompany.com |

### 2. Google Apps Script 安全設定
1. 在 Google Sheets 中點擊「擴充功能」→「Apps Script」
2. 刪除預設程式碼，貼上 `quote_sys.gs` 的內容
3. **設定腳本屬性**：
   - 點擊「文件」→「專案屬性」→「腳本屬性」
   - 新增：
     - `API_KEY`: `your-secure-api-key-here`（至少16位隨機字串）
     - `OWNER_EMAIL`: `your-email@company.com`

4. **部署為網頁應用程式**：
   - 點擊「部署」→「新建部署」
   - 類型選擇「網頁應用程式」
   - 執行身份選擇「我」
   - **重要**：存取權選擇「任何人」
   - 複製部署網址

### 3. 前端安全設定
1. 複製 `config.example.js` 為 `config.js`
2. 修改 `config.js` 中的敏感資訊：
   ```javascript
   const CONFIG = {
     API_URL: "您的實際Google Apps Script網址",
     API_KEY: "與腳本屬性相同的API金鑰",
     DEFAULT_EMAIL: "您的預設email"
   };
   ```
3. 將 `config.js` 加入 `.gitignore`，避免上傳到 GitHub

## 使用說明

### 基本操作流程
1. **載入產品**：系統自動從 Google Sheets 載入產品清單
2. **填寫客戶資訊**：輸入客戶姓名、電話、地址
3. **選擇產品**：從下拉選單選擇產品，輸入數量和折扣
4. **加入購物車**：點擊「加入」將產品加入報價清單
5. **產生報價**：點擊「產生PDF報價單」或「列印報價單」

### 功能說明
- **新增折扣**：可為每個產品設定個別折扣百分比
- **修改數量**：直接在購物車中調整數量
- **刪除項目**：點擊「刪除」移除不需要的產品
- **清空清單**：一鍵清空所有產品
- **快捷鍵**：
  - Ctrl+P：列印報價單
  - Ctrl+S：儲存報價

## 技術架構

### 前端技術
- HTML5 + CSS3
- JavaScript (ES6+)
- jspdf.js (PDF 產生)
- 響應式設計

### 後端技術
- Google Apps Script
- Google Sheets API
- JSON 資料交換

### 資料流程
```
前端網頁 ←→ Google Apps Script ←→ Google Sheets
```

## 範例資料
系統預設包含以下範例產品：
- 冷氣機 1.5噸 - $25,000
- 冷氣機 2.0噸 - $32,000
- 電冰箱 420L - $18,000
- 洗衣機 10公斤 - $15,000
- 電視機 55吋 - $22,000

## 故障排除

### 常見問題
1. **無法載入產品資料**
   - 檢查 Google Apps Script 網址是否正確
   - 確認 Google Sheets 權限設定
   - 檢查網路連線

2. **PDF 無法產生**
   - 確認瀏覽器支援 jspdf
   - 檢查是否有選擇產品

3. **報價記錄未儲存**
   - 確認 Google Sheets 權限
   - 檢查工作表名稱是否正確

### 聯絡支援
如有問題，請透過以下方式聯絡：
- 電話：02-1234-5678
- Email：support@example.com

## 更新日誌
- v1.0.0 - 初始版本發布
- v1.1.0 - 新增 PDF 產生功能
- v1.2.0 - 優化響應式設計
- v1.3.0 - 新增本地儲存功能

## 授權
本系統採用 MIT 授權條款，可自由使用與修改。