// Helper function to show notifications
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = toast.className.replace('show', '').trim();
    }, 3000);
}

// API base URL
const API_BASE = '';

// Auth Forms
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('Login successful', 'success');
                localStorage.setItem('username', data.username);
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('An error occurred during login', 'error');
        }
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('Registration successful', 'success');
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                showToast(data.message || 'Registration failed', 'error');
            }
        } catch (err) {
            showToast('An error occurred during registration', 'error');
        }
    });
}

const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const new_password = document.getElementById('new_password').value;

        if (new_password.length < 6) return showToast('Password must be at least 6 characters', 'error');

        try {
            const res = await fetch(`${API_BASE}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, new_password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('Password updated successfully', 'success');
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                showToast(data.message || 'Failed to update password', 'error');
            }
        } catch (err) {
            showToast('An error occurred during password reset', 'error');
        }
    });
}


// -------------------------------------------------------------
// Dashboard Logic & Advanced Features
// -------------------------------------------------------------
let currentProductName = "";
let currentResults = [];
let priceChartInstance = null;
let trendChartInstance = null;
let currentSummary = null;

// Context Feature 1: Dark Mode Theme Toggle
const themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        if (priceChartInstance) updateChartTheme(priceChartInstance);
        if (trendChartInstance) updateChartTheme(trendChartInstance);
    });
}

const usernameDisplay = document.getElementById('usernameDisplay');
const historyList = document.getElementById('historyList');

if (usernameDisplay) {
    const savedUser = localStorage.getItem('username');
    if (!savedUser) {
        window.location.href = 'login.html';
    } else {
        usernameDisplay.textContent = savedUser;
        fetchHistory(savedUser);
        fetchWatchlist(savedUser);
    }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });
}

// Fetch Search History
async function fetchHistory(username) {
    if (!historyList) return;
    try {
        const res = await fetch(`${API_BASE}/api/history?username=${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const historyData = await res.json();
        
        if (historyData.length === 0) {
            historyList.innerHTML = '<li class="empty-state">No recent searches</li>';
            return;
        }

        historyList.innerHTML = '';
        historyData.forEach(item => {
            const li = document.createElement('li');
            const dateStr = new Date(item.timestamp).toLocaleString();
            li.innerHTML = `
                <span class="history-query"><i class="fas fa-search" style="color:#cbd5e1; margin-right:8px;"></i>${item.query}</span>
                <span class="history-time">${dateStr}</span>
            `;
            historyList.appendChild(li);
        });
    } catch (e) {
        console.error("Failed to load history", e);
    }
}

// Feature 5: Fetch & Manage Watchlist
async function fetchWatchlist(username) {
    const container = document.getElementById('watchlistContainer');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/watchlist?username=${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.length === 0) {
            container.innerHTML = '<li class="empty-state">No targets actively monitored.</li>';
            return;
        }

        container.innerHTML = '';
        data.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="history-query"><i class="fas fa-eye" style="color:var(--warning-color); margin-right:8px;"></i>${item.product_name}</span>
            `;
            li.style.cursor = 'pointer';
            li.title = "Click to scan";
            li.onclick = () => {
                document.getElementById('manualSearchInput').value = item.product_name;
                document.getElementById('manualSearchBtn').click();
            };
            container.appendChild(li);
        });
    } catch (e) {
        console.error("Watchlist error", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addToWatchlistBtn = document.getElementById('addToWatchlistBtn');
    if(addToWatchlistBtn) {
        addToWatchlistBtn.addEventListener('click', async () => {
            const username = localStorage.getItem('username');
            if(!username || !currentProductName) return;
            try {
                const res = await fetch(`${API_BASE}/api/watchlist`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username: username, product: currentProductName})
                });
                if(res.ok) {
                    showToast(`${currentProductName} added to Watchlist!`, 'success');
                    fetchWatchlist(username);
                }
            } catch(e) { console.error(e); showToast("Failed to save", 'error'); }
        });
    }
});


// Containers
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingMessage = document.getElementById('loadingMessage');
const predictionCard = document.getElementById('predictionCard');
const resultsSection = document.getElementById('resultsSection');

// Manual Search
const manualSearchBtn = document.getElementById('manualSearchBtn');
const manualSearchInput = document.getElementById('manualSearchInput');
if (manualSearchBtn && manualSearchInput) {
    manualSearchBtn.addEventListener('click', async () => {
        const product = manualSearchInput.value.trim();
        if(!product) return showToast("Enter a product name", "error");
        
        loadingIndicator.style.display = 'block';
        loadingMessage.textContent = `Deploying scrapers for ${product}...`;
        predictionCard.style.display = 'none';
        resultsSection.style.display = 'none';
        
        await fetchPrices(product);
        fetchHistory(localStorage.getItem('username'));
        loadingIndicator.style.display = 'none';
        
        // Setup dummy insight
        document.getElementById('predProduct').textContent = product;
        document.getElementById('predConfidence').textContent = `100%`;
        const cb = document.getElementById('predConfidenceBar');
        if(cb) cb.style.width = '100%';
        document.getElementById('predInsight').textContent = "Manual override pattern matched.";
        predictionCard.style.display = 'block';
    });
}

// Global Filter/Export
const sortSelect = document.getElementById('sortSelect');
const filterSelect = document.getElementById('filterSelect');
const exportCsvBtn = document.getElementById('exportCsvBtn');

if (sortSelect) sortSelect.addEventListener('change', renderResults);
if (filterSelect) filterSelect.addEventListener('change', renderResults);
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
        if (!currentResults || currentResults.length === 0) return showToast("No data to export", "error");
        let csv = "Store,Product Name,Price,URL\n";
        currentResults.forEach(r => {
            const safeName = r.product_name ? r.product_name.replace(/,/g, '') : currentProductName;
            csv += `${r.store},${safeName},${r.price},${r.product_url || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProductName}_prices.csv`;
        a.click();
    });
}

// Image Upload Logic
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const uploadText = document.getElementById('uploadText');
const uploadBtn = document.getElementById('uploadBtn');

if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
        uploadArea.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(ev => {
        uploadArea.addEventListener(ev, () => uploadArea.classList.add('active'), false);
    });
    ['dragleave', 'drop'].forEach(ev => {
        uploadArea.addEventListener(ev, () => uploadArea.classList.remove('active'), false);
    });

    uploadArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
    fileInput.addEventListener('change', function () { handleFiles(this.files); });

    function handleFiles(files) {
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(files[0]);
            reader.onload = function () {
                imagePreview.src = reader.result;
                imagePreview.style.display = 'block';
                uploadText.style.display = 'none';
                uploadBtn.style.display = 'inline-flex';
                
                predictionCard.style.display = 'none';
                if(resultsSection) resultsSection.style.display = 'none';
            }
        } else {
            showToast('Please upload an image file', 'error');
        }
    }

    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        uploadBtn.style.display = 'none';
        loadingIndicator.style.display = 'block';
        loadingMessage.textContent = "AI Vision engaged. Recognizing target...";

        const formData = new FormData();
        formData.append("image", file);
        formData.append("username", localStorage.getItem('username') || '');

        try {
            const res = await fetch(`${API_BASE}/api/upload-image`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed.");
            const data = await res.json();
            
            showToast(`Product Detected: ${data.product}`, 'success');

            document.getElementById('predProduct').textContent = data.product.toUpperCase();
            const confPct = Math.round((data.confidence || 0) * 100);
            document.getElementById('predConfidence').textContent = `${confPct}%`;
            
            // Feature 4 Insight Logic
            const insightText = document.getElementById('predInsight');
            let insight = "Standard commercial item.";
            if(data.product.toLowerCase().includes('shoe') || data.product.toLowerCase().includes('sneaker')) insight = "Fashion / Apparel category. Match probability high.";
            if(data.product.toLowerCase().includes('phone') || data.product.toLowerCase().includes('laptop') || data.product.toLowerCase().includes('sony')) insight = "Electronics network. High price volatility detected.";
            insightText.textContent = insight;

            const confBar = document.getElementById('predConfidenceBar');
            setTimeout(() => { confBar.style.width = `${confPct}%`; }, 200);

            if(confPct > 80) { confBar.style.background = 'var(--success-color)'; }
            else if(confPct > 50) { confBar.style.background = 'var(--warning-color)'; }
            else { confBar.style.background = 'var(--danger-color)'; }

            predictionCard.style.display = 'block';
            loadingMessage.textContent = `Scraping real-time parameters for ${data.product}...`;

            await fetchPrices(data.product);
            fetchHistory(localStorage.getItem('username'));

        } catch (error) {
            showToast('API Error during upload or analysis.', 'error');
            console.error(error);
            uploadBtn.style.display = 'inline-flex';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
}

async function fetchPrices(productName) {
    const container = document.getElementById('priceResults');
    if(container) container.innerHTML = "";
    
    currentProductName = productName;
    currentResults = [];
    currentSummary = null;

    try {
        const res = await fetch(`${API_BASE}/api/compare-prices?product=${encodeURIComponent(productName)}`);
        if (!res.ok) throw new Error("Scraping failed.");

        const data = await res.json();
        
        if (resultsSection) resultsSection.style.display = 'block';

        if (!data.results || data.results.length === 0) {
            if(container) container.innerHTML = "<p class='empty-state'>Zero nodes responded with valid intel.</p>";
            document.getElementById('metricAverage').textContent = "N/A";
            document.getElementById('metricHighest').textContent = "N/A";
            document.getElementById('bestDealPrice').textContent = "N/A";
            return;
        }

        currentResults = data.results;
        currentSummary = data.summary;

        // Feature 1: Best Deal Update
        let bestItem = currentResults[0];
        let maxP = 0;
        currentResults.forEach(r => {
            const p = parseFloat(r.price);
            if(p > maxP) maxP = p;
            if(p === parseFloat(data.summary.lowest_price)) bestItem = r;
        });

        document.getElementById('bestDealStore').textContent = bestItem.store;
        document.getElementById('bestDealPrice').textContent = `₹${bestItem.price}`;
        document.getElementById('bestDealUrl').href = bestItem.product_url || '#';
        
        const savings = (maxP - parseFloat(bestItem.price)).toFixed(2);
        document.getElementById('bestDealSavings').textContent = savings > 0 ? `Max Potential Savings: ₹${savings}` : "Market parity detected.";

        document.getElementById('metricAverage').textContent = `₹${data.summary.average_price}`;
        document.getElementById('metricHighest').textContent = `₹${data.summary.highest_price}`;

        renderResults();
        renderChart();
        fetchTrends(productName);

    } catch (error) {
        if(container) container.innerHTML = "<p class='empty-state' style='color:var(--danger-color);'>Extraction system compromised.</p>";
        showToast("Scraper error.", "error");
    }
}

// Feature 2: Platform Face-off UI Generator
function renderResults() {
    const container = document.getElementById('priceResults');
    if (!container || !currentResults) return;

    let filtered = [...currentResults];
    const filterVal = filterSelect ? filterSelect.value : 'all';
    if (filterVal !== 'all') {
        filtered = filtered.filter(item => item.store.toLowerCase().includes(filterVal));
    }

    const sortVal = sortSelect ? sortSelect.value : 'asc';
    filtered.sort((a, b) => {
        const pA = parseFloat(a.price);
        const pB = parseFloat(b.price);
        return sortVal === 'asc' ? pA - pB : pB - pA;
    });

    if (filtered.length === 0) {
        container.innerHTML = "<p class='empty-state'>No coordinates match your tactical filter.</p>";
        return;
    }

    let html = "";
    filtered.forEach(item => {
        const isBest = parseFloat(item.price) === parseFloat(currentSummary.lowest_price);
        const storeClass = item.store.toLowerCase().includes('walmart') ? '#0071ce' : 
                           item.store.toLowerCase().includes('amazon') ? '#ff9900' :
                           item.store.toLowerCase().includes('flipkart') ? '#2874f0' :
                           item.store.toLowerCase().includes('croma') ? '#12efdd' :
                           item.store.toLowerCase().includes('reliance') ? '#e61d2b' :
                           item.store.toLowerCase().includes('tata') ? '#cc0066' : '#e53238'; 
        const nameNode = item.product_name || currentProductName;
        
        html += `
            <div class="battle-card ${isBest ? 'winner' : ''}">
                <div class="battle-card-header">
                    <span class="battle-store-name" style="color:${storeClass};">${item.store}</span>
                    ${isBest ? '<span class="best-badge"><i class="fas fa-crown"></i> VICTOR</span>' : ''}
                </div>
                <div style="flex:1;">
                    <div class="text-muted" style="font-size:0.85rem; line-height:1.2; margin-bottom:10px;">${nameNode}</div>
                </div>
                <div>
                    <div class="battle-price">₹${item.price}</div>
                    <a href="${item.product_url || '#'}" target="_blank" class="battle-btn" style="display:block;">
                        <i class="fas fa-external-link-alt"></i> Execute
                    </a>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Distribution Chart
function renderChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx || !currentResults || currentResults.length === 0) return;
    if (priceChartInstance) priceChartInstance.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const tColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const labels = currentResults.map((r,i) => `${r.store} (#${i+1})`);
    const dataPoints = currentResults.map(r => parseFloat(r.price));
    
    priceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price in USD',
                data: dataPoints,
                backgroundColor: 'rgba(79, 70, 229, 0.5)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, ticks: { color: tColor }, grid: { color: gridColor } },
                x: { ticks: { color: tColor }, grid: { color: gridColor } }
            }
        }
    });
}

// Feature 3: Trend Chart
async function fetchTrends(productName) {
    const ctx = document.getElementById('trendChart');
    const emptyUI = document.getElementById('trendEmpty');
    if (!ctx || !emptyUI) return;

    try {
        const res = await fetch(`${API_BASE}/api/product-trends?product=${encodeURIComponent(productName)}`);
        if(!res.ok) return;
        const trendData = await res.json();

        if (trendChartInstance) trendChartInstance.destroy();

        if(trendData.length < 2) {
            emptyUI.style.display = 'block';
            ctx.style.display = 'none';
            return;
        }

        emptyUI.style.display = 'none';
        ctx.style.display = 'block';

        const isDark = document.body.classList.contains('dark-mode');
        const tColor = isDark ? '#f1f5f9' : '#1e293b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';

        const labels = trendData.map(d => new Date(d.timestamp).toLocaleDateString());
        const dataPoints = trendData.map(d => d.price);

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Recorded Price',
                    data: dataPoints,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display:false } },
                scales: {
                    y: { ticks: { color: tColor }, grid: { color: gridColor } },
                    x: { ticks: { color: tColor }, grid: { color: gridColor } }
                }
            }
        });

    } catch(e) { console.error("Trend fail", e); }
}

function updateChartTheme(chart) {
    const isDark = document.body.classList.contains('dark-mode');
    const tColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    if(chart && chart.options.scales.x) {
        chart.options.scales.x.ticks.color = tColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.ticks.color = tColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.update();
    }
}
