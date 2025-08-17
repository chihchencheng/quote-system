// 電器行報價系統前端 JavaScript
// 與 Google Apps Script API 整合

// 從環境變數或配置文件讀取設定
// 在 GitHub Pages 環境中，使用 window 物件來存取環境變數
const CONFIG = {
  API_URL: (typeof process !== 'undefined' && process.env && process.env.API_URL) || 
           (typeof window !== 'undefined' && window.ENV && window.ENV.API_URL) ||
           'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  API_KEY: (typeof process !== 'undefined' && process.env && process.env.API_KEY) || 
           (typeof window !== 'undefined' && window.ENV && window.ENV.API_KEY) ||
           '',
  DEFAULT_EMAIL: "chihchencheng31@gmail.com"
};

// 全域變數
let products = [];
let cart = [];
let currentQuote = null;
let currentUser = null;
let isAuthenticated = false;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
    loadCartFromStorage();
});

// 檢查登入狀態
function checkAuthentication() {
    const savedAuth = localStorage.getItem('quoteSystemAuth');
    if (savedAuth) {
        const auth = JSON.parse(savedAuth);
        currentUser = auth.email;
        isAuthenticated = true;
        showMainApp();
        loadProducts();
    } else {
        showLoginForm();
    }
}

// 顯示登入表單
function showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
}

// 顯示主應用程式
function showMainApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUser').textContent = `歡迎, ${currentUser}`;
}

// 處理登入
async function handleLogin() {
    const email = document.getElementById('userEmail').value.trim();
    const apiKey = document.getElementById('userApiKey').value.trim();
    
    if (!email || !apiKey) {
        showLoginMessage('請輸入電子郵件', 'error');
        return;
    }
    
    try {
        showLoginMessage('驗證中...', 'loading');
        
        // 測試驗證
        const testUrl = `${CONFIG.API_URL}?email=${encodeURIComponent(email)}`;
        const response = await fetch(testUrl);
        const result = await response.json();
        
        if (result.status === 'success') {
            // 儲存登入資訊
            const authData = { email, apiKey, timestamp: new Date().toISOString() };
            localStorage.setItem('quoteSystemAuth', JSON.stringify(authData));
            
            currentUser = email;
            isAuthenticated = true;
            
            showMainApp();
            loadProducts();
            showMessage('登入成功！', 'success');
        } else {
            showLoginMessage(result.message || '驗證失敗', 'error');
        }
    } catch (error) {
        showLoginMessage('連線失敗，請檢查網路連線', 'error');
    }
}

// 處理登出
function handleLogout() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('quoteSystemAuth');
        currentUser = null;
        isAuthenticated = false;
        cart = [];
        renderCart();
        showLoginForm();
        showLoginMessage('已成功登出', 'success');
    }
}

// 顯示登入訊息
function showLoginMessage(message, type) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.className = type;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 設定事件監聽器
function setupEventListeners() {
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const discountInput = document.getElementById('discount');
    
    productSelect.addEventListener('change', updateUnitPrice);
    quantityInput.addEventListener('input', updateUnitPrice);
    discountInput.addEventListener('input', updateUnitPrice);
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'p':
                    e.preventDefault();
                    printQuote();
                    break;
                case 's':
                    e.preventDefault();
                    saveQuote();
                    break;
            }
        }
    });
}

// 載入產品資料（新版 - 使用本地產品規格）
async function loadProducts() {
    if (!isAuthenticated) {
        showMessage('請先登入系統', 'error');
        return;
    }
    
    showMessage('產品系統就緒', 'success');
    // 產品資料已經在 productSpecs 中定義，不需要從API載入
}

// 更新單價顯示（新版）
function updateUnitPrice() {
    // 此函數已被 updateProductOptions 取代
    // 保留以相容於舊的事件監聽器
}

// 新增產品到購物車
function addToCart() {
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const discountInput = document.getElementById('discount');
    
    if (!productSelect.value) {
        showMessage('請選擇產品', 'error');
        return;
    }
    
    const quantity = parseInt(quantityInput.value) || 0;
    if (quantity <= 0) {
        showMessage('請輸入有效的數量', 'error');
        return;
    }
    
    const productName = productSelect.value;
    const unitPrice = parseFloat(document.getElementById('unitPrice').value);
    const discount = parseFloat(discountInput.value) || 0;
    
    // 檢查是否已存在相同產品
    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.discount = Math.max(existingItem.discount, discount);
    } else {
        cart.push({
            name: productName,
            quantity: quantity,
            unitPrice: unitPrice,
            discount: discount
        });
    }
    
    renderCart();
    saveCartToStorage();
    showMessage('產品已加入清單', 'success');
    
    // 清空輸入欄位
    productSelect.value = '';
    quantityInput.value = '1';
    discountInput.value = '0';
    document.getElementById('unitPrice').value = '';
}

// 渲染購物車
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="loading">尚無產品，請先新增產品</div>';
        document.getElementById('totalAmount').textContent = '0';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        const subtotal = (item.unitPrice * item.quantity) * (1 - item.discount / 100);
        total += subtotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>單價: $${item.unitPrice.toLocaleString()}</small>
            </div>
            <div>
                數量: ${item.quantity}<br>
                ${item.discount > 0 ? `折扣: ${item.discount}%` : ''}
            </div>
            <div>
                <strong>$${Math.round(subtotal).toLocaleString()}</strong>
            </div>
            <button class="btn btn-danger" onclick="removeFromCart(${index})" style="padding: 5px 10px; font-size: 12px;">刪除</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    document.getElementById('totalAmount').textContent = Math.round(total).toLocaleString();
}

// 從購物車移除產品
function removeFromCart(index) {
    if (confirm('確定要刪除此產品嗎？')) {
        cart.splice(index, 1);
        renderCart();
        saveCartToStorage();
        showMessage('產品已刪除', 'success');
    }
}

// 清空購物車
function clearCart() {
    if (confirm('確定要清空所有產品嗎？')) {
        cart = [];
        renderCart();
        saveCartToStorage();
        showMessage('清單已清空', 'success');
    }
}

// 產生 PDF 報價單
async function generatePDF() {
    if (cart.length === 0) {
        showMessage('請先新增產品到清單', 'error');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // 設定字體
        doc.setFont('helvetica');
        
        // 標題
        doc.setFontSize(20);
        doc.text('電器行報價單', 105, 20, { align: 'center' });
        
        // 公司資訊
        doc.setFontSize(12);
        doc.text('專業電器行', 20, 35);
        doc.text('電話: 02-1234-5678', 20, 42);
        doc.text('地址: 台北市中山區某某路123號', 20, 49);
        
        // 客戶資訊
        const customerName = document.getElementById('customerName').value || '未填寫';
        const customerPhone = document.getElementById('customerPhone').value || '未填寫';
        const customerAddress = document.getElementById('customerAddress').value || '未填寫';
        
        doc.text('客戶資訊:', 20, 60);
        doc.text(`姓名: ${customerName}`, 20, 67);
        doc.text(`電話: ${customerPhone}`, 20, 74);
        doc.text(`地址: ${customerAddress}`, 20, 81);
        
        // 日期
        const today = new Date().toLocaleDateString('zh-TW');
        doc.text(`日期: ${today}`, 150, 35);
        
        // 報價單號
        const quoteId = generateQuoteId();
        doc.text(`報價單號: ${quoteId}`, 150, 42);
        
        // 產品列表標題
        doc.setFontSize(14);
        doc.text('產品明細', 20, 95);
        
        // 表格標題
        doc.setFontSize(10);
        const headers = ['產品名稱', '數量', '單價', '折扣', '小計'];
        let y = 105;
        
        headers.forEach((header, i) => {
            doc.text(header, 20 + (i * 35), y);
        });
        
        // 產品內容
        y += 10;
        let total = 0;
        
        cart.forEach(item => {
            const subtotal = (item.unitPrice * item.quantity) * (1 - item.discount / 100);
            total += subtotal;
            
            doc.text(item.name.substring(0, 12), 20, y);
            doc.text(item.quantity.toString(), 55, y);
            doc.text(`$${item.unitPrice.toLocaleString()}`, 90, y);
            doc.text(`${item.discount}%`, 125, y);
            doc.text(`$${Math.round(subtotal).toLocaleString()}`, 160, y);
            
            y += 7;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });
        
        // 總計
        y += 10;
        doc.setFontSize(12);
        doc.text(`總金額: $${Math.round(total).toLocaleString()}`, 150, y);
        
        // 備註
        y += 20;
        doc.setFontSize(10);
        doc.text('備註:', 20, y);
        doc.text('• 此報價有效期限為30天', 20, y + 7);
        doc.text('• 安裝費用另計', 20, y + 14);
        doc.text('• 聯絡我們: 02-1234-5678', 20, y + 21);
        
        // 儲存 PDF
        doc.save(`報價單_${quoteId}.pdf`);
        
        // 記錄報價
        saveQuoteRecord(customerName, customerPhone, customerAddress, quoteId);
        
    } catch (error) {
        console.error('產生 PDF 失敗:', error);
        showMessage('產生 PDF 失敗，請稍後再試', 'error');
    }
}

// 列印報價單
function printQuote() {
    if (cart.length === 0) {
        showMessage('請先新增產品到清單', 'error');
        return;
    }
    
    // 建立列印視窗
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('zh-TW');
    const quoteId = generateQuoteId();
    
    const customerName = document.getElementById('customerName').value || '未填寫';
    const customerPhone = document.getElementById('customerPhone').value || '未填寫';
    const customerAddress = document.getElementById('customerAddress').value || '未填寫';
    
    let total = 0;
    let itemsHtml = '';
    
    cart.forEach(item => {
        const subtotal = (item.unitPrice * item.quantity) * (1 - item.discount / 100);
        total += subtotal;
        
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">$${item.unitPrice.toLocaleString()}</td>
                <td style="text-align: center;">${item.discount}%</td>
                <td style="text-align: right;">$${Math.round(subtotal).toLocaleString()}</td>
            </tr>
        `;
    });
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>報價單</title>
            <style>
                body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .info { margin-bottom: 30px; }
                .info div { margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
                .footer { margin-top: 50px; font-size: 12px; color: #666; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>專業電器行</h1>
                <p>電話: 02-1234-5678 | 地址: 台北市中山區某某路123號</p>
            </div>
            
            <div class="info">
                <h2>報價單</h2>
                <div><strong>報價單號:</strong> ${quoteId}</div>
                <div><strong>日期:</strong> ${today}</div>
                <div><strong>客戶姓名:</strong> ${customerName}</div>
                <div><strong>電話:</strong> ${customerPhone}</div>
                <div><strong>地址:</strong> ${customerAddress}</div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>產品名稱</th>
                        <th>數量</th>
                        <th>單價</th>
                        <th>折扣</th>
                        <th>小計</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="total">總金額: $${Math.round(total).toLocaleString()}</div>
            
            <div class="footer">
                <p><strong>備註:</strong></p>
                <p>• 此報價有效期限為30天</p>
                <p>• 安裝費用另計</p>
                <p>• 聯絡我們: 02-1234-5678</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    // 記錄報價
    saveQuoteRecord(customerName, customerPhone, customerAddress, quoteId);
}

// 儲存報價記錄
async function saveQuoteRecord(customerName, customerPhone, customerAddress, quoteId) {
    if (!isAuthenticated) return;
    
    const savedAuth = JSON.parse(localStorage.getItem('quoteSystemAuth'));
    const customerData = {
        name: customerName,
        phone: customerPhone,
        address: customerAddress
    };
    
    const quoteData = {
        auth: {
            email: savedAuth.email,
            apiKey: savedAuth.apiKey
        },
        customer: customerData,
        items: cart,
        quoteId: quoteId
    };
    
    try {
        await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quoteData)
        });
    } catch (error) {
        console.error('儲存報價記錄失敗:', error);
    }
}

// 產品規格資料
const productSpecs = {
    '冷氣': {
        sizes: ['1噸', '1.5噸', '2噸', '2.5噸', '3噸'],
        areaCoverage: ['3-5坪', '5-8坪', '8-12坪', '12-15坪', '15-20坪'],
        basePrices: [15000, 20000, 28000, 35000, 45000]
    },
    '洗衣機': {
        sizes: ['6公斤', '8公斤', '10公斤', '12公斤', '15公斤'],
        areaCoverage: ['1-2人', '2-3人', '3-4人', '4-5人', '5人以上'],
        basePrices: [8000, 12000, 18000, 25000, 35000]
    },
    '電視': {
        sizes: ['32吋', '43吋', '50吋', '55吋', '65吋', '75吋'],
        areaCoverage: ['小房間', '臥室', '客廳小', '客廳中', '客廳大', '視聽室'],
        basePrices: [8000, 15000, 25000, 35000, 50000, 80000]
    },
    '冰箱': {
        sizes: ['100公升', '200公升', '300公升', '400公升', '500公升以上'],
        areaCoverage: ['1-2人', '2-3人', '3-4人', '4-5人', '5人以上'],
        basePrices: [10000, 18000, 28000, 40000, 60000]
    }
};

// 更新產品選項
function updateProductOptions() {
    const productType = document.getElementById('productType').value;
    const sizeSelect = document.getElementById('productSize');
    const areaSelect = document.getElementById('areaCoverage');
    
    // 清除現有選項
    sizeSelect.innerHTML = '<option value="">請選擇規格</option>';
    areaSelect.innerHTML = '<option value="">請選擇坪數</option>';
    
    if (!productType || !productSpecs[productType]) {
        document.getElementById('unitPrice').value = '';
        document.getElementById('productDescription').value = '';
        return;
    }
    
    const specs = productSpecs[productType];
    
    // 填充大小選項
    specs.sizes.forEach((size, index) => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        option.dataset.price = specs.basePrices[index];
        option.dataset.area = specs.areaCoverage[index];
        sizeSelect.appendChild(option);
    });
    
    // 當選擇大小時更新坪數和價格
    sizeSelect.onchange = function() {
        const selectedIndex = this.selectedIndex - 1; // 減去"請選擇規格"
        if (selectedIndex >= 0) {
            areaSelect.innerHTML = '<option value="">' + specs.areaCoverage[selectedIndex] + '</option>';
            document.getElementById('unitPrice').value = specs.basePrices[selectedIndex];
            updateProductDescription();
        }
    };
    
    // 重置價格和描述
    document.getElementById('unitPrice').value = '';
    document.getElementById('productDescription').value = '';
}

// 更新產品描述
function updateProductDescription() {
    const productType = document.getElementById('productType').value;
    const productSize = document.getElementById('productSize').value;
    const areaCoverage = document.getElementById('areaCoverage').value;
    
    if (productType && productSize) {
        document.getElementById('productDescription').value = 
            `${productType} - ${productSize} - 適用${areaCoverage || '一般家庭'}`;
    } else {
        document.getElementById('productDescription').value = '';
    }
}

// 新增產品到購物車（更新版）
function addToCart() {
    const productType = document.getElementById('productType').value;
    const productSize = document.getElementById('productSize').value;
    const areaCoverage = document.getElementById('areaCoverage').value;
    const quantityInput = document.getElementById('quantity');
    
    if (!productType) {
        showMessage('請選擇產品類型', 'error');
        return;
    }
    
    if (!productSize) {
        showMessage('請選擇產品規格', 'error');
        return;
    }
    
    const quantity = parseInt(quantityInput.value) || 0;
    if (quantity <= 0) {
        showMessage('請輸入有效的數量', 'error');
        return;
    }
    
    const unitPrice = parseFloat(document.getElementById('unitPrice').value);
    const productName = `${productType} ${productSize}`;
    
    // 檢查是否已存在相同產品
    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            name: productName,
            quantity: quantity,
            unitPrice: unitPrice,
            discount: 0,
            type: productType,
            size: productSize,
            area: areaCoverage
        });
    }
    
    renderCart();
    saveCartToStorage();
    showMessage('產品已加入清單', 'success');
    
    // 清空選擇
    document.getElementById('productType').value = '';
    document.getElementById('productSize').innerHTML = '<option value="">請選擇規格</option>';
    document.getElementById('areaCoverage').innerHTML = '<option value="">請選擇坪數</option>';
    document.getElementById('quantity').value = '1';
    document.getElementById('unitPrice').value = '';
    document.getElementById('productDescription').value = '';
}

// 產生報價單 ID
function generateQuoteId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `Q${year}${month}${day}${random}`;
}

// 本地儲存
function saveCartToStorage() {
    localStorage.setItem('quoteCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('quoteCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        renderCart();
    }
}

// 顯示訊息
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.className = type;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 匯出報價資料
function exportQuote() {
    if (cart.length === 0) {
        showMessage('請先新增產品到清單', 'error');
        return;
    }
    
    const customerName = document.getElementById('customerName').value || '未填寫';
    const customerPhone = document.getElementById('customerPhone').value || '未填寫';
    const customerAddress = document.getElementById('customerAddress').value || '未填寫';
    
    let total = 0;
    const items = cart.map(item => {
        const subtotal = (item.unitPrice * item.quantity) * (1 - item.discount / 100);
        total += subtotal;
        return {
            ...item,
            subtotal: Math.round(subtotal)
        };
    });
    
    const quoteData = {
        customer: { name: customerName, phone: customerPhone, address: customerAddress },
        items: items,
        total: Math.round(total),
        date: new Date().toLocaleDateString('zh-TW'),
        quoteId: generateQuoteId()
    };
    
    const dataStr = JSON.stringify(quoteData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `報價單_${quoteData.quoteId}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// 搜尋產品
function searchProducts() {
    const searchTerm = prompt('請輸入產品名稱關鍵字:');
    if (!searchTerm) return;
    
    const filteredProducts = products.filter(product => 
        product['產品名稱'].toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredProducts.length === 0) {
        showMessage('找不到相關產品', 'error');
        return;
    }
    
    // 更新產品選擇器
    const select = document.getElementById('product');
    select.innerHTML = '<option value="">搜尋結果</option>';
    
    filteredProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product['產品名稱'];
        option.textContent = `${product['產品名稱']} - $${product['單價']}`;
        option.dataset.price = product['單價'];
        select.appendChild(option);
    });
}
