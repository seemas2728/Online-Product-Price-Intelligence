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

// Login Logic
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

// Register Logic
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

// Reset Password Logic
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

// Dashboard User Session Logic
const usernameDisplay = document.getElementById('usernameDisplay');
if (usernameDisplay) {
    const savedUser = localStorage.getItem('username');
    if (!savedUser) {
        window.location.href = 'login.html';
    } else {
        usernameDisplay.textContent = savedUser;
    }
}
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });
}

// Dashboard Image Upload Logic (Now connected to Real Price Scraping API)
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
                uploadBtn.style.display = 'block';
            }
        } else {
            showToast('Please upload an image file', 'error');
        }
    }

    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        showToast('Uploading & Detecting...', 'info');
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`${API_BASE}/api/upload-image`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed.");
            const data = await res.json();

            showToast(`Product Detected: ${data.product}. Fetching prices...`, 'success');

            const priceContainer = document.getElementById('priceResults');
            if (priceContainer) {
                fetchPrices(data.product, priceContainer);
            }

        } catch (error) {
            showToast('API Error during upload.', 'error');
            console.error(error);
        }

        // Reset UI partially
        setTimeout(() => {
            imagePreview.style.display = 'none';
            imagePreview.src = '';
            uploadText.style.display = 'block';
            uploadBtn.style.display = 'none';
            fileInput.value = '';
        }, 1500);
    });

    async function fetchPrices(productName, container) {
        container.innerHTML = "Fetching real-time prices...";
        try {
            const res = await fetch(`${API_BASE}/api/compare-prices?product=${encodeURIComponent(productName)}`);
            if (!res.ok) throw new Error("Scraping failed.");

            const data = await res.json();
            if (!data.results || data.results.length === 0) {
                container.innerHTML = "No prices found for this product.";
                return;
            }

            let html = `<h3>Price Comparison for ${productName} (Avg: $${data.summary.average_price})</h3>`;
            html += `<ul style="list-style: none; padding: 0;">`;

            data.results.forEach(item => {
                const isBest = parseFloat(item.price) === parseFloat(data.summary.lowest_price);
                html += `
                    <li style="border:1px solid #ddd; margin:10px 0; padding:15px; border-radius:5px; background: ${isBest ? '#eaffea' : '#fff'};">
                        <div style="display:flex; justify-content: space-between; align-items:center;">
                            <div>
                                <strong>${item.store}</strong> - $${item.price}
                                ${isBest ? '<span style="color:green; font-weight:bold; margin-left:10px;">🔥 BEST PRICE</span>' : ''}
                                <br><small>${item.product_name}</small>
                            </div>
                            <a href="${item.product_url}" target="_blank" style="padding:8px 15px; background:#007bff; color:#fff; text-decoration:none; border-radius:4px;">View Deal</a>
                        </div>
                    </li>
                `;
            });
            html += `</ul>`;
            container.innerHTML = html;

        } catch (error) {
            container.innerHTML = "Error fetching prices.";
            showToast("Scraper error.", "error");
        }
    }
}
