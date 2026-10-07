/* =====================================================
   ระบบจำลองรถพุ่มพวงออนไลน์ (Rot Phum Phuang) - Full Version
===================================================== */

// 1. ตั้งค่า Firebase Configuration (เชื่อมต่อกับโปรเจกต์ phomphung-f25c5)
const firebaseConfig = {
  apiKey: "AIzaSyBjEzbFuCngT-u_hvalTn0Lw-ufILi7qYc",
  authDomain: "phomphung-f25c5.firebaseapp.com",
  projectId: "phomphung-f25c5",
  storageBucket: "phomphung-f25c5.firebasestorage.app",
  messagingSenderId: "6978226057",
  appId: "1:6978226057:web:ab86d3de879a56ff464358",
  measurementId: "G-J24X9W5K4S"
};

// 2. เริ่มต้นเชื่อมต่อ Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// Global State
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let users = [];
let trucks = [];
let products = [];
let orders = [];
let cart = [];

// ==========================================
// 3. โหลดข้อมูลจาก Cloud Firestore
// ==========================================
async function loadDataFromCloud() {
    if (!db) {
        console.warn("ไม่ได้เชื่อมต่อ Firebase, ระบบจะทำงานผ่าน Memory");
        renderNavbar();
        navigateTo('home');
        return;
    }

    try {
        // ดึงข้อมูลผู้ใช้งาน
        const usersSnap = await db.collection("users").get();
        users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // อัปเดต currentUser ให้เป็นข้อมูลล่าสุด
        if (currentUser) {
            let found = users.find(u => u.id === currentUser.id || u.username === currentUser.username);
            if (found) {
                currentUser = found;
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
            }
        }

        // ดึงข้อมูลรถพุ่มพวง
        const trucksSnap = await db.collection("trucks").get();
        trucks = trucksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // ดึงข้อมูลสินค้า
        const productsSnap = await db.collection("products").get();
        products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // ดึงข้อมูลออเดอร์
        const ordersSnap = await db.collection("orders").get();
        orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("โหลดข้อมูลจาก Firebase เรียบร้อยแล้ว");
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Firebase:", error);
    }

    renderNavbar();
    navigateTo('home');
}

// Helper Functions
function findProduct(id) { return products.find(p => p.id == id); }
function findTruck(id) { return trucks.find(t => t.id == id); }
function formatPrice(num) { return Number(num).toLocaleString('th-TH') + " บาท"; }

// ==========================================
// 4. ระบบนำทาง & Modal
// ==========================================
function renderNavbar() {
    let navRight = document.getElementById("navRight");
    if (!navRight) return;

    if (currentUser) {
        navRight.innerHTML = `
            <span style="margin-right: 15px; color: white;">👤 ${currentUser.name} (${currentUser.role === 'seller' ? 'ผู้ขาย' : 'ลูกค้า'})</span>
            ${currentUser.role === 'customer' ? `<span style="margin-right: 15px; color: #fde047;">⭐ ${currentUser.points || 0} แต้ม</span>` : ''}
            <button class="btn btn-danger" style="width: auto; padding: 5px 12px;" onclick="logout()">ออกจากระบบ</button>
        `;
    } else {
        navRight.innerHTML = `
            <button class="btn btn-blue" style="width: auto; padding: 5px 12px; margin-right: 8px;" onclick="showLogin()">เข้าสู่ระบบ</button>
            <button class="btn" style="width: auto; padding: 5px 12px;" onclick="showRegister()">สมัครสมาชิก</button>
        `;
    }
}

function navigateTo(page) {
    let content = document.getElementById("content");
    if (!content) return;

    if (page === 'home') renderHome();
    else if (page === 'trucks') renderTrucks();
    else if (page === 'cart') showCart();
    else if (page === 'orders') renderOrders();
    else if (page === 'seller') renderSellerDashboard();
}

function openModal(htmlContent) {
    let modal = document.getElementById("modal");
    let modalBody = document.getElementById("modalBody");
    if (modal && modalBody) {
        modalBody.innerHTML = htmlContent;
        modal.style.display = "flex";
    }
}

function closeModal() {
    let modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
}

// ==========================================
// 5. ระบบเข้าสู่ระบบ & สมัครสมาชิก (กด Enter ได้)
// ==========================================
function showLogin() {
    let html = `
        <div class="form-box">
            <h2>🔐 เข้าสู่ระบบ</h2>
            <div class="form-group">
                <label>Username</label>
                <input id="loginUsername" placeholder="Username" onkeyup="handleLoginKey(event)">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input id="loginPassword" type="password" placeholder="Password" onkeyup="handleLoginKey(event)">
            </div>
            <button class="btn" onclick="login()">เข้าสู่ระบบ</button>
            <p style="margin-top: 15px; text-align: center;">ยังไม่มีบัญชี?</p>
            <button class="btn btn-blue" onclick="closeModal(); setTimeout(showRegister, 100);">สมัครสมาชิก</button>
        </div>
    `;
    openModal(html);
}

function handleLoginKey(e) { if (e.key === "Enter") login(); }

async function login() {
    let u = document.getElementById("loginUsername").value.trim();
    let p = document.getElementById("loginPassword").value.trim();

    let user = users.find(user => user.username.toLowerCase() === u.toLowerCase() && user.password === p);
    if (!user) {
        alert("Username หรือ Password ไม่ถูกต้อง");
        return;
    }

    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    renderNavbar();
    closeModal();
    alert(`ยินดีต้อนรับคุณ ${currentUser.name}`);
    navigateTo(currentUser.role === 'seller' ? 'seller' : 'home');
}

function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    cart = [];
    renderNavbar();
    alert("ออกจากระบบเรียบร้อยแล้ว");
    navigateTo('home');
}

function showRegister() {
    let html = `
        <div class="form-box">
            <h2>📝 สมัครสมาชิก</h2>
            <div class="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input id="registerName" placeholder="กรอกชื่อ-นามสกุล" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="form-group">
                <label>ชื่อผู้ใช้ (Username)</label>
                <input id="registerUsername" placeholder="ตั้งชื่อผู้ใช้" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="form-group">
                <label>รหัสผ่าน</label>
                <input id="registerPassword" type="password" placeholder="ตั้งรหัสผ่าน" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input id="registerPhone" placeholder="กรอกเบอร์โทรศัพท์" onkeyup="handleRegisterKey(event)">
            </div>
            <div class="form-group">
                <label>ประเภทสมาชิก</label>
                <select id="registerRole" onkeyup="handleRegisterKey(event)">
                    <option value="customer">ลูกค้า</option>
                    <option value="seller">ผู้ขาย</option>
                </select>
            </div>
            <button class="btn" onclick="registerUser()">สมัครสมาชิก</button>
        </div>
    `;
    openModal(html);
}

function handleRegisterKey(e) { if (e.key === "Enter") registerUser(); }

async function registerUser() {
    let name = document.getElementById("registerName").value.trim();
    let username = document.getElementById("registerUsername").value.trim();
    let password = document.getElementById("registerPassword").value.trim();
    let phone = document.getElementById("registerPhone").value.trim();
    let role = document.getElementById("registerRole").value;

    if (!name || !username || !password || !phone) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    let existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
        alert("Username นี้มีผู้ใช้งานแล้ว");
        return;
    }

    let newUser = {
        name: name,
        username: username,
        password: password,
        phone: phone,
        role: role,
        points: 0,
        createdAt: new Date().toISOString()
    };

    try {
        if (db) {
            let docRef = await db.collection("users").add(newUser);
            newUser.id = docRef.id;
        } else {
            newUser.id = "user_" + Date.now();
        }
        users.push(newUser);

        alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
        closeModal();
        setTimeout(showLogin, 100);
    } catch (err) {
        console.error(err);
        alert("สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่");
    }
}

// ==========================================
// 6. หน้าแสดงผลสำหรับผู้ใช้ (Home, Trucks, Cart, Orders)
// ==========================================
function renderHome() {
    let content = document.getElementById("content");
    content.innerHTML = `
        <div class="hero">
            <h1>🚚 รถพุ่มพวงออนไลน์</h1>
            <p>ยกตลาดสดมาไว้หน้าบ้านคุณ สด ใหม่ ส่งไวทุกวัน</p>
            <br>
            <button class="btn" style="width: auto; padding: 10px 24px;" onclick="navigateTo('trucks')">🛒 เลือกซื้อสินค้าเลย</button>
        </div>
    `;
}

function renderTrucks() {
    let content = document.getElementById("content");
    let html = `<div class="page-title"><h1>🚚 เลือกรถพุ่มพวงใกล้คุณ</h1></div>`;

    if (trucks.length === 0) {
        html += `<div class="card"><p>ยังไม่มีรถพุ่มพวงให้บริการในขณะนี้</p></div>`;
        content.innerHTML = html;
        return;
    }

    trucks.forEach(truck => {
        let truckProducts = products.filter(p => p.truckId == truck.id);
        html += `
            <div class="card" style="margin-bottom: 20px;">
                <h2>🚚 ${truck.name}</h2>
                <p><strong>ทะเบียน:</strong> ${truck.license} | 📍 <strong>พื้นที่:</strong> ${truck.location}</p>
                <hr style="margin: 10px 0;">
                <h3>รายการสินค้าบนรถ</h3>
                <div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 10px;">
        `;

        if (truckProducts.length === 0) {
            html += `<p style="color: #666;">ไม่มีสินค้าบนรถคันนี้</p>`;
        } else {
            truckProducts.forEach(p => {
                html += `
                    <div style="border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center; background: #fff;">
                        <h4>${p.name}</h4>
                        <p style="color: #10b981; font-weight: bold;">${formatPrice(p.price)} / ${p.unit || 'ชิ้น'}</p>
                        <p style="font-size: 0.85rem; color: #666;">คงเหลือ: ${p.quantity} ${p.unit || 'ชิ้น'}</p>
                        <button class="btn" style="margin-top: 6px;" onclick="addToCart('${p.id}')">🛒 ใส่ตะกร้า</button>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
    });

    content.innerHTML = html;
}

function addToCart(productId) {
    if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อนเลือกซื้อสินค้า");
        showLogin();
        return;
    }

    let product = findProduct(productId);
    if (!product || product.quantity <= 0) {
        alert("สินค้าชิ้นนี้หมดสต็อกแล้ว");
        return;
    }

    let item = cart.find(c => c.productId == productId);
    if (item) {
        if (item.quantity + 1 > product.quantity) {
            alert("จำนวนสินค้าเกินสต็อกที่มี");
            return;
        }
        item.quantity++;
    } else {
        cart.push({ productId: productId, quantity: 1 });
    }

    alert(`เพิ่ม "${product.name}" ลงในตะกร้าเรียบร้อยแล้ว`);
}

function showCart() {
    let content = document.getElementById("content");
    let html = `<div class="page-title"><h1>🛒 ตะกร้าสินค้า</h1></div>`;

    if (cart.length === 0) {
        html += `<div class="card"><p>ยังไม่มีสินค้าในตะกร้า</p><button class="btn" onclick="navigateTo('trucks')">เลือกซื้อสินค้า</button></div>`;
        content.innerHTML = html;
        return;
    }

    let total = 0;
    cart.forEach(item => {
        let product = findProduct(item.productId);
        if (!product) return;
        let subtotal = product.price * item.quantity;
        total += subtotal;

        html += `
            <div class="cart-item">
                <div style="flex: 2;">
                    <strong>${product.name}</strong><br>
                    <span style="color: #64748b;">${formatPrice(product.price)}</span>
                </div>
                <div class="cart-qty-control" style="flex: 1; justify-content: center;">
                    <button class="btn cart-qty-btn" onclick="decreaseCart('${product.id}')">-</button>
                    <span style="font-weight: 600; min-width: 24px; text-align: center;">${item.quantity}</span>
                    <button class="btn cart-qty-btn" onclick="increaseCart('${product.id}')">+</button>
                </div>
                <div style="flex: 1; text-align: right; font-weight: 600; color: #10b981;">
                    ${formatPrice(subtotal)}
                </div>
                <div>
                    <button class="btn btn-danger cart-delete-btn" onclick="removeFromCart('${product.id}')">🗑️ ลบ</button>
                </div>
            </div>
        `;
    });

    html += `
        <div class="cart-total">
            ยอดรวมทั้งสิ้น: <span style="color: #10b981; font-size: 1.4rem;">${formatPrice(total)}</span><br><br>
            <button class="btn" onclick="checkout()">💳 ไปชำระเงิน</button>
        </div>
    `;

    content.innerHTML = html;
}

function increaseCart(pId) {
    let p = findProduct(pId);
    let item = cart.find(c => c.productId == pId);
    if (item && p && item.quantity < p.quantity) item.quantity++;
    showCart();
}

function decreaseCart(pId) {
    let item = cart.find(c => c.productId == pId);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) cart = cart.filter(c => c.productId != pId);
    }
    showCart();
}

function removeFromCart(pId) {
    cart = cart.filter(c => c.productId != pId);
    showCart();
}

function checkout() {
    let total = cart.reduce((sum, item) => {
        let p = findProduct(item.productId);
        return sum + (p ? p.price * item.quantity : 0);
    }, 0);

    let maxPoints = currentUser ? currentUser.points || 0 : 0;

    let html = `
        <h2>💳 ชำระเงิน</h2>
        <p>ยอดชำระ: <strong>${formatPrice(total)}</strong></p>
        <div class="form-group">
            <label>ที่อยู่จัดส่ง</label>
            <textarea id="customerAddress" rows="2" placeholder="กรอกที่อยู่จัดส่ง"></textarea>
        </div>
        ${maxPoints > 0 ? `
            <div class="form-group">
                <label>ใช้แต้มส่วนลด (คุณมี ${maxPoints} แต้ม)</label>
                <input type="number" id="usePointsInput" max="${Math.min(maxPoints, total)}" min="0" value="0" placeholder="จำนวนแต้ม">
            </div>
        ` : ''}
        <div class="form-group">
            <label>แนบสลิปโอนเงิน</label>
            <input type="file" id="slipImage" accept="image/*">
        </div>
        <button class="btn" onclick="placeOrder(${total})">✅ ยืนยันการสั่งซื้อ</button>
    `;

    openModal(html);
}

function placeOrder(subtotal) {
    let address = document.getElementById("customerAddress").value.trim();
    let slipInput = document.getElementById("slipImage");
    let slipFile = slipInput ? slipInput.files[0] : null;
    let pointsInput = document.getElementById("usePointsInput");
    let pointsUsed = pointsInput ? Number(pointsInput.value) || 0 : 0;

    if (!address) { alert("กรุณากรอกที่อยู่จัดส่ง"); return; }
    if (!slipFile) { alert("กรุณาแนบสลิปการโอนเงิน"); return; }

    let reader = new FileReader();
    reader.onload = async function (e) {
        let slipDataUrl = e.target.result;
        let finalTotal = subtotal - pointsUsed;
        let items = [];

        for (let cartItem of cart) {
            let product = findProduct(cartItem.productId);
            items.push({
                productId: product.id,
                productName: product.name,
                quantity: cartItem.quantity,
                price: product.price,
                subtotal: product.price * cartItem.quantity
            });
        }

        let firstProduct = findProduct(cart[0].productId);

        let newOrder = {
            customerId: currentUser.id,
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: address,
            truckId: firstProduct ? firstProduct.truckId : null,
            items: items,
            subtotal: subtotal,
            discount: pointsUsed,
            total: finalTotal,
            date: new Date().toISOString(),
            status: "รอตรวจสอบ",
            paymentMethod: "โอนเงิน",
            paymentStatus: "รอตรวจสอบ",
            slipImage: slipDataUrl
        };

        try {
            if (db) {
                let docRef = await db.collection("orders").add(newOrder);
                newOrder.id = docRef.id;

                if (pointsUsed > 0) {
                    currentUser.points = (currentUser.points || 0) - pointsUsed;
                    await db.collection("users").doc(currentUser.id).update({ points: currentUser.points });
                }

                for (let item of items) {
                    let product = findProduct(item.productId);
                    if (product) {
                        product.quantity -= item.quantity;
                        await db.collection("products").doc(String(product.id)).update({ quantity: product.quantity });
                    }
                }
            } else {
                newOrder.id = "ord_" + Date.now();
            }

            orders.push(newOrder);
            cart = [];
            renderNavbar();
            closeModal();
            alert("สั่งซื้อสำเร็จ! กรุณารอร้านค้าตรวจสอบการโอนเงิน");
            navigateTo('orders');
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการบันทึกออเดอร์");
        }
    };

    reader.readAsDataURL(slipFile);
}

// ==========================================
// 7. หน้าติดตามออเดอร์สำหรับลูกค้า & Stepper
// ==========================================
function renderOrders() {
    let content = document.getElementById("content");
    let html = `<div class="page-title"><h1>📦 ออเดอร์ของฉัน</h1></div>`;

    let myOrders = orders.filter(o => o.customerId == currentUser.id);
    if (myOrders.length === 0) {
        html += `<div class="card"><p>คุณยังไม่มีประวัติการสั่งซื้อ</p></div>`;
        content.innerHTML = html;
        return;
    }

    myOrders.reverse().forEach(o => {
        html += `
            <div class="card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <h3>ออเดอร์ #${o.id}</h3>
                    <small style="color: #666;">${new Date(o.date).toLocaleString('th-TH')}</small>
                </div>
                
                ${renderStepperHTML(o.status)}

                <p><strong>ยอดเงินสุทธิ:</strong> ${formatPrice(o.total)} ${o.discount ? `(ใช้ส่วนลด ${o.discount} แต้ม)` : ''}</p>
                <p><strong>การชำระเงิน:</strong> <span class="badge">${o.paymentStatus}</span></p>
            </div>
        `;
    });

    content.innerHTML = html;
}

function renderStepperHTML(currentStatus) {
    if (currentStatus === "ยกเลิกออเดอร์" || currentStatus === "ชำระเงินไม่ถูกต้อง") {
        return `
            <div style="text-align: center; padding: 10px; background: #fee2e2; color: #dc2626; border-radius: 8px; margin: 10px 0; font-weight: bold;">
                ❌ ออเดอร์ถูกยกเลิก / การชำระเงินไม่ถูกต้อง (ระบบทำการคืนแต้มสะสมแล้ว)
            </div>
        `;
    }

    const steps = ["รอตรวจสอบ", "กำลังเตรียมสินค้า", "พร้อมจัดส่ง", "จัดส่งสำเร็จ"];
    let currIdx = steps.indexOf(currentStatus);

    let html = `<div style="display: flex; justify-content: space-between; margin: 15px 0;">`;
    steps.forEach((step, idx) => {
        let active = idx <= currIdx ? "color: #10b981; font-weight: bold;" : "color: #ccc;";
        html += `<div style="${active}">${idx <= currIdx ? '✓' : '○'} ${step}</div>`;
    });
    html += `</div>`;
    return html;
}

// ==========================================
// 8. แดชบอร์ดผู้ขาย (Seller Dashboard)
// ==========================================
function renderSellerDashboard() {
    let content = document.getElementById("content");
    content.innerHTML = `
        <div class="page-title"><h1>👨‍🍳 แดชบอร์ดผู้ขาย</h1></div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <button class="btn" style="padding: 20px;" onclick="manageTrucks()">🚚 จัดการรถพุ่มพวง</button>
            <button class="btn btn-blue" style="padding: 20px;" onclick="manageProducts()">🥬 จัดการสินค้า</button>
            <button class="btn" style="padding: 20px; background: #8b5cf6;" onclick="manageOrders()">📦 รายการออเดอร์ทั้งหมด</button>
        </div>
    `;
}

// จัดการรถพุ่มพวง
function manageTrucks() {
    let html = `
        <button class="btn btn-blue" style="width: auto; margin-bottom: 15px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        <h2>🚚 จัดการรถพุ่มพวง</h2>
        <button class="btn" onclick="showAddTruck()">+ เพิ่มรถ</button>
        <hr style="margin: 15px 0;">
    `;

    trucks.forEach(t => {
        html += `
            <div class="card" style="margin-bottom: 15px;">
                <h3>🚚 ${t.name}</h3>
                <p><strong>ทะเบียน:</strong> ${t.license} | 📍 ${t.location}</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-blue" onclick="showEditTruck('${t.id}')">✏️ แก้ไขข้อมูลรถ</button>
                    <button class="btn btn-danger" onclick="deleteTruck('${t.id}')">🗑️ ลบรถ</button>
                </div>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

function showAddTruck() {
    let html = `
        <h2>🚚 เพิ่มรถพุ่มพวงใหม่</h2>
        <div class="form-group"><label>ชื่อรถ</label><input id="truckName" placeholder="เช่น รถพุ่มพวง A"></div>
        <div class="form-group"><label>ทะเบียนรถ</label><input id="truckLicense" placeholder="เช่น กข 1234"></div>
        <div class="form-group"><label>พื้นที่ให้บริการ</label><input id="truckLocation" placeholder="เช่น ตลาดหน้าหมู่บ้าน"></div>
        <button class="btn" onclick="saveTruck()">💾 บันทึกรถ</button>
    `;
    openModal(html);
}

async function saveTruck() {
    let name = document.getElementById("truckName").value.trim();
    let license = document.getElementById("truckLicense").value.trim();
    let location = document.getElementById("truckLocation").value.trim();

    if (!name || !license) { alert("กรุณากรอกชื่อรถและทะเบียน"); return; }

    let newTruck = { name: name, license: license, location: location };
    if (db) {
        let docRef = await db.collection("trucks").add(newTruck);
        newTruck.id = docRef.id;
    } else {
        newTruck.id = "t_" + Date.now();
    }
    trucks.push(newTruck);

    closeModal();
    manageTrucks();
    alert("เพิ่มรถพุ่มพวงเรียบร้อยแล้ว");
}

function showEditTruck(tId) {
    let truck = findTruck(tId);
    if (!truck) return;

    let html = `
        <h2>✏️ แก้ไขข้อมูลรถพุ่มพวง</h2>
        <div class="form-group"><label>ชื่อรถ</label><input id="editTruckName" value="${truck.name}"></div>
        <div class="form-group"><label>ทะเบียน</label><input id="editTruckLicense" value="${truck.license}"></div>
        <div class="form-group"><label>สถานที่ให้บริการ</label><input id="editTruckLocation" value="${truck.location}"></div>
        <button class="btn" onclick="saveEditTruck('${truck.id}')">💾 บันทึกการแก้ไข</button>
    `;
    openModal(html);
}

async function saveEditTruck(tId) {
    let truck = findTruck(tId);
    if (!truck) return;

    truck.name = document.getElementById("editTruckName").value.trim();
    truck.license = document.getElementById("editTruckLicense").value.trim();
    truck.location = document.getElementById("editTruckLocation").value.trim();

    if (db) await db.collection("trucks").doc(String(tId)).update(truck);

    closeModal();
    manageTrucks();
    alert("อัปเดตข้อมูลรถเรียบร้อยแล้ว");
}

async function deleteTruck(tId) {
    if (!confirm("ต้องการลบรถคันนี้ใช่หรือไม่?")) return;

    if (db) await db.collection("trucks").doc(String(tId)).delete();
    trucks = trucks.filter(t => t.id != tId);

    manageTrucks();
    alert("ลบรถพุ่มพวงเรียบร้อยแล้ว");
}

// จัดการสินค้า + ป้องกันสินค้าซ้ำซ้อน
function manageProducts() {
    let html = `
        <button class="btn btn-blue" style="width: auto; margin-bottom: 15px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        <h2>🥬 จัดการสินค้าในสต็อก</h2>
        <button class="btn" onclick="showAddProduct()">+ เพิ่มสินค้าใหม่</button>
        <hr style="margin: 15px 0;">
    `;

    products.forEach(p => {
        let truck = findTruck(p.truckId);
        html += `
            <div class="card" style="margin-bottom: 10px;">
                <strong>${p.name}</strong> (${truck ? truck.name : 'ไม่ระบุรถ'}) - ${formatPrice(p.price)} | สต็อก: ${p.quantity} ${p.unit || 'ชิ้น'}
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

function showAddProduct() {
    let truckOptions = trucks.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    let html = `
        <h2>🥬 เพิ่มสินค้าใหม่</h2>
        <div class="form-group"><label>เลือกรถพุ่มพวง</label><select id="productTruck">${truckOptions}</select></div>
        <div class="form-group"><label>ชื่อสินค้า</label><input id="productName" placeholder="เช่น ไข่ไก่, ผักบุ้ง"></div>
        <div class="form-group"><label>ราคา (บาท)</label><input type="number" id="productPrice" placeholder="ราคา"></div>
        <div class="form-group"><label>จำนวนสต็อก</label><input type="number" id="productQuantity" placeholder="จำนวน"></div>
        <div class="form-group"><label>หน่วยเรียก</label><input id="productUnit" placeholder="เช่น แผง, กำ, กิโลกรัม"></div>
        <button class="btn" onclick="saveProduct()">💾 บันทึกสินค้า</button>
    `;
    openModal(html);
}

async function saveProduct() {
    let name = document.getElementById("productName").value.trim();
    let truckId = document.getElementById("productTruck").value;
    let price = Number(document.getElementById("productPrice").value);
    let quantity = Number(document.getElementById("productQuantity").value);
    let unit = document.getElementById("productUnit").value.trim() || "ชิ้น";

    if (!name || price <= 0 || quantity <= 0) { alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return; }

    let existingProduct = products.find(p => p.truckId == truckId && p.name.toLowerCase() === name.toLowerCase());

    if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.price = price;
        if (db) await db.collection("products").doc(String(existingProduct.id)).update({ quantity: existingProduct.quantity, price: price });
        alert(`เพิ่มสต็อกสินค้า "${name}" เรียบร้อยแล้ว`);
    } else {
        let newProd = { truckId: truckId, name: name, price: price, quantity: quantity, unit: unit };
        if (db) {
            let docRef = await db.collection("products").add(newProd);
            newProd.id = docRef.id;
        } else {
            newProd.id = "p_" + Date.now();
        }
        products.push(newProd);
        alert("เพิ่มสินค้าใหม่เรียบร้อยแล้ว");
    }

    closeModal();
    manageProducts();
}

// จัดการออเดอร์ + ตรวจสลิป + คืนแต้มเมื่อยกเลิก
function manageOrders() {
    let content = document.getElementById("content");
    let html = `
        <button class="btn btn-blue" style="width: auto; margin-bottom: 15px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        <h2>📦 รายการออเดอร์ทั้งหมด</h2>
    `;

    orders.slice().reverse().forEach(o => {
        html += `
            <div class="card" style="margin-bottom: 15px;">
                <h3>ออเดอร์ #${o.id}</h3>
                <p><strong>ลูกค้า:</strong> ${o.customerName} (${o.phone})</p>
                <p><strong>ยอดรวม:</strong> ${formatPrice(o.total)} ${o.discount ? `(ส่วนลดแต้ม: -${o.discount} บาท)` : ''}</p>
                <p><strong>สถานะชำระเงิน:</strong> ${o.paymentStatus}</p>
                
                ${o.slipImage ? `<button class="btn btn-blue" style="width: auto; padding: 4px 10px; margin: 8px 0;" onclick="viewSlip('${o.id}')">🖼️ ดูหลักฐานสลิปโอนเงิน</button>` : ''}

                ${o.paymentStatus === "รอตรวจสอบ" ? `
                    <div style="margin-top: 10px;">
                        <button class="btn" style="width: auto; background: #10b981;" onclick="confirmPayment('${o.id}')">✅ ยืนยันสลิป</button>
                        <button class="btn btn-danger" style="width: auto;" onclick="rejectPayment('${o.id}')">❌ ปฏิเสธสลิป / คืนแต้ม</button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    content.innerHTML = html;
}

function viewSlip(orderId) {
    let o = orders.find(ord => ord.id == orderId);
    if (!o || !o.slipImage) return;

    openModal(`
        <div style="text-align: center;">
            <h3>🖼️ หลักฐานสลิปโอนเงิน (ออเดอร์ #${o.id})</h3>
            <img src="${o.slipImage}" style="max-width: 100%; max-height: 350px; border-radius: 8px; margin: 10px 0;">
            <br><button class="btn btn-blue" onclick="closeModal()">ปิดหน้าต่าง</button>
        </div>
    `);
}

async function confirmPayment(orderId) {
    let o = orders.find(ord => ord.id == orderId);
    if (!o) return;

    o.paymentStatus = "ชำระเงินแล้ว";
    o.status = "กำลังเตรียมสินค้า";

    let earnedPoints = Math.floor(o.total / 100);
    let customer = users.find(u => u.id == o.customerId);
    if (customer && earnedPoints > 0) {
        customer.points = (customer.points || 0) + earnedPoints;
        if (db) await db.collection("users").doc(String(customer.id)).update({ points: customer.points });
    }

    if (db) await db.collection("orders").doc(String(o.id)).update({ paymentStatus: o.paymentStatus, status: o.status });

    alert(`ยืนยันการชำระเงินเรียบร้อยแล้ว (ลูกค้าได้รับแต้มสะสม ${earnedPoints} แต้ม)`);
    manageOrders();
}

async function rejectPayment(orderId) {
    let o = orders.find(ord => ord.id == orderId);
    if (!o) return;

    if (!confirm("ต้องการปฏิเสธสลิปใช่หรือไม่? ระบบจะทำการคืนแต้มส่วนลดและสต็อกสินค้าให้ลูกค้าทันที")) return;

    if (o.discount && o.discount > 0) {
        let customer = users.find(u => u.id == o.customerId);
        if (customer) {
            customer.points = (customer.points || 0) + o.discount;
            if (db) await db.collection("users").doc(String(customer.id)).update({ points: customer.points });
        }
    }

    for (let item of o.items) {
        let product = findProduct(item.productId);
        if (product) {
            product.quantity += item.quantity;
            if (db) await db.collection("products").doc(String(product.id)).update({ quantity: product.quantity });
        }
    }

    o.paymentStatus = "ชำระเงินไม่ถูกต้อง";
    o.status = "ยกเลิกออเดอร์";

    if (db) await db.collection("orders").doc(String(o.id)).update({ paymentStatus: o.paymentStatus, status: o.status });

    alert("ปฏิเสธการชำระเงินและคืนแต้มสะสมให้ลูกค้าเรียบร้อยแล้ว");
    manageOrders();
}

// เริ่มต้นโหลดระบบเมื่อเปิดหน้าเว็บ
window.onload = function() {
    loadDataFromCloud();
};
