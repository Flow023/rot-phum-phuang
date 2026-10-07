/* =====================================================
   รถพุ่มพวง JavaScript (Full System)
===================================================== */

/* =====================================================
   1. ข้อมูลเริ่มต้น (Initial Data)
===================================================== */

let trucks = JSON.parse(localStorage.getItem("trucks")) || [
    { id: 1, name: "รถพุ่มพวง A", license: "กข 1234", location: "ตลาดหน้าหมู่บ้าน", description: "ขายผักสดและของใช้ในบ้าน" },
    { id: 2, name: "รถพุ่มพวง B", license: "ขค 5678", location: "ชุมชนเมือง", description: "ขายเนื้อ หมู ไก่ และอาหารสด" }
];

let products = JSON.parse(localStorage.getItem("products")) || [
    { id: 1, truckId: 1, name: "ไข่ไก่", price: 45, quantity: 50, unit: "แผง" },
    { id: 2, truckId: 1, name: "ผักบุ้ง", price: 20, quantity: 30, unit: "กำ" },
    { id: 3, truckId: 2, name: "หมูสามชั้น", price: 120, quantity: 20, unit: "กิโลกรัม" },
    { id: 4, truckId: 2, name: "ไก่สด", price: 80, quantity: 20, unit: "กิโลกรัม" }
];

let orders = JSON.parse(localStorage.getItem("orders")) || [];

let users = JSON.parse(localStorage.getItem("users")) || [
    { id: 1, name: "ผู้ขายตัวอย่าง", phone: "0800000000", username: "seller", password: "1234", role: "seller", points: 0 },
    { id: 2, name: "ลูกค้าตัวอย่าง", phone: "0811111111", username: "customer", password: "1234", role: "customer", points: 50 }
];

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =====================================================
   2. ระบบบันทึกข้อมูล (Save Data)
===================================================== */

function saveData() {
    localStorage.setItem("trucks", JSON.stringify(trucks));
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =====================================================
   3. ระบบจัดการหน้าเรนเดอร์และเมนู (Navigation & Navbar)
===================================================== */

function renderNavbar() {
    let nav = document.getElementById("navbarMenu");
    if (!nav) return;

    let html = "";

    if (currentUser) {
        if (currentUser.role === "seller") {
            // 👨‍💼 ถ้าเป็น "ผู้ขาย" ให้แสดงเฉพาะเมนูระบบผู้ขายเท่านั้น
            html += `<button onclick="navigateTo('seller')">👨‍💼 ระบบผู้ขาย</button>`;
        } else {
            // 👤 ถ้าเป็น "ลูกค้า" ให้แสดงเมนูสำหรับซื้อสินค้าตามปกติ
            html += `
                <button onclick="navigateTo('home')">หน้าหลัก</button>
                <button onclick="navigateTo('trucks')">🚚 รถพุ่มพวง</button>
                <button onclick="navigateTo('cart')">🛒 ตะกร้า</button>
                <button onclick="navigateTo('orders')">📦 ออเดอร์ของฉัน</button>
            `;
        }

        // แสดงชื่อผู้ใช้ และปุ่มออกจากระบบ
        let userPoints = currentUser.points || 0;
        html += `
            <span style="color: #10b981; font-size: 0.9rem; align-self: center; margin: 0 8px; font-weight: 500;">
                👤 ${currentUser.name} ${currentUser.role === 'customer' ? `(⭐ ${userPoints} แต้ม)` : ''}
            </span>
            <button onclick="logout()" style="color: #ef4444;">ออกจากระบบ</button>
        `;
    } else {
        // 🔐 ถ้ายังไม่ได้เข้าสู่ระบบ ให้แสดงเมนูทั่วไป
        html += `
            <button onclick="navigateTo('home')">หน้าหลัก</button>
            <button onclick="navigateTo('trucks')">🚚 รถพุ่มพวง</button>
            <button onclick="navigateTo('cart')">🛒 ตะกร้า</button>
            <button onclick="showLogin()">🔐 เข้าสู่ระบบ</button>
            <button onclick="showRegister()">📝 สมัครสมาชิก</button>
        `;
    }

    nav.innerHTML = html;
}

function navigateTo(pageName, param = null) {
    let pageState = { name: pageName, param: param };
    localStorage.setItem("currentPage", JSON.stringify(pageState));

    switch (pageName) {
        case "home":
            showHome();
            break;
        case "trucks":
            showTrucks();
            break;
        case "products":
            showProducts(param);
            break;
        case "cart":
            showCart();
            break;
        case "orders":
            showOrders();
            break;
        case "seller":
            showSeller();
            break;
        case "manageTrucks":
            manageTrucks();
            break;
        case "manageProducts":
            manageProducts();
            break;
        case "manageOrders":
            manageOrders();
            break;
        case "salesReport":
            showSalesReport();
            break;
        default:
            showHome();
            break;
    }
}

/* =====================================================
   4. ฟังก์ชันช่วย (Helper Functions)
===================================================== */

function formatPrice(price) {
    return Number(price).toLocaleString("th-TH") + " บาท";
}

function findTruck(truckId) {
    return trucks.find(truck => truck.id == truckId);
}

function findProduct(productId) {
    return products.find(product => product.id == productId);
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

function getCurrentMonth() {
    let date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function getNextOrderId() {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.id)) + 1;
}

function getReceiptNumber(orderId) {
    return "RC-" + String(orderId).padStart(5, "0");
}

/* =====================================================
   5. หน้าหลัก (Home Page)
===================================================== */

function showHome() {
    let content = document.getElementById("content");
    let featuredProducts = products.slice(0, 4);

    let html = `
        <div class="hero">
            <div class="hero-content">
                <h1>🚚 รถพุ่มพวง</h1>
                <p>ตลาดเคลื่อนที่ ซื้อของง่าย สั่งซื้อสินค้าได้จากรถพุ่มพวงใกล้บ้านคุณ</p>
                <button class="btn btn-blue" style="max-width: 200px;" onclick="navigateTo('trucks')">
                    🚚 ดูรถพุ่มพวงทั้งหมด
                </button>
            </div>
            <div class="hero-image">
                <img src="hero-truck.jpg" alt="รถพุ่มพวง" onerror="this.style.display='none'">
            </div>
        </div>

        <div class="card-container">
            <div class="card" onclick="navigateTo('trucks')" style="cursor: pointer;">
                <h3>🚚 รถพุ่มพวง</h3>
                <p>มีรถทั้งหมด <strong>${trucks.length}</strong> คัน</p>
            </div>
            <div class="card" onclick="navigateTo('trucks')" style="cursor: pointer;">
                <h3>🥬 สินค้าในระบบ</h3>
                <p>มีสินค้าทั้งหมด <strong>${products.length}</strong> รายการ</p>
            </div>
            <div class="card">
                <h3>👥 สมาชิก</h3>
                <p>มีสมาชิกทั้งหมด <strong>${users.length}</strong> คน</p>
            </div>
            <div class="card" onclick="navigateTo('cart')" style="cursor: pointer;">
                <h3>🛒 ตะกร้าของฉัน</h3>
                <p>มีสินค้าในตะกร้า <strong>${cart.length}</strong> รายการ</p>
            </div>
        </div>

        <div style="margin-top: 40px;">
            <div class="page-title" style="display: flex; justify-content: space-between; align-items: center;">
                <h2>🚚 รถพุ่มพวงที่กำลังให้บริการ</h2>
                <button class="btn btn-blue" style="width: auto; padding: 6px 12px; font-size: 0.85rem;" onclick="navigateTo('trucks')">
                    ดูทั้งหมด →
                </button>
            </div>

            <div class="card-container">
    `;

    trucks.forEach(truck => {
        html += `
            <div class="card truck-card">
                <h3>🚚 ${truck.name}</h3>
                <p><strong>ทะเบียน:</strong> ${truck.license}</p>
                <p>📍 ${truck.location}</p>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 12px;">${truck.description}</p>
                <button class="btn" onclick="navigateTo('products', ${truck.id})">ดูสินค้าในรถ</button>
            </div>
        `;
    });

    html += `
            </div>
        </div>

        <div style="margin-top: 40px;">
            <div class="page-title">
                <h2>🥬 สินค้าแนะนำประจำวัน</h2>
            </div>

            <div class="card-container">
    `;

    featuredProducts.forEach(product => {
        let truck = findTruck(product.truckId);
        let unitText = product.unit ? product.unit : "ชิ้น";

        html += `
            <div class="product-card">
                <div class="product-image">🥬</div>
                <h3>${product.name}</h3>
                <p style="font-size: 0.85rem; color: #666;">ประจำ: ${truck ? truck.name : '-'}</p>
                <p class="price">${formatPrice(product.price)}</p>
                <p style="font-size: 0.85rem; margin-bottom: 10px;">คงเหลือ ${product.quantity} ${unitText}</p>
                <button class="btn" onclick="addToCart(${product.id})">🛒 เพิ่มลงตะกร้า</button>
            </div>
        `;
    });

    html += `
            </div>
        </div>

        <footer style="margin-top: 60px; padding: 20px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; font-size: 0.9rem;">
            <p>© 2026 รถพุ่มพวง - ระบบตลาดเคลื่อนที่ออนไลน์ สั่งง่าย ส่งไว ถึงหน้าบ้าน</p>
        </footer>
    `;

    content.innerHTML = html;
}

/* =====================================================
   6. แสดงรถพุ่มพวง และค้นหา
===================================================== */

function showTrucks() {
    let content = document.getElementById("content");
    let html = `
        <div class="page-title">
            <h1>🚚 รถพุ่มพวง</h1>
            <p>เลือกรถพุ่มพวงที่ต้องการ</p>
        </div>

        <div class="search-box">
            <input id="truckSearch" placeholder="ค้นหารถพุ่มพวง..." onkeyup="searchTrucks()">
        </div>

        <div id="truckList" class="card-container">
    `;

    trucks.forEach(truck => {
        html += `
            <div class="card truck-card">
                <h3>🚚 ${truck.name}</h3>
                <p>ทะเบียน: ${truck.license}</p>
                <p>📍 ${truck.location}</p>
                <p>${truck.description}</p>
                <button class="btn" onclick="navigateTo('products', ${truck.id})">ดูสินค้า</button>
            </div>
        `;
    });

    html += `</div>`;
    content.innerHTML = html;
}

function searchTrucks() {
    let keyword = document.getElementById("truckSearch").value.toLowerCase();
    let cards = document.querySelectorAll(".truck-card");

    cards.forEach(card => {
        let text = card.innerText.toLowerCase();
        card.style.display = text.includes(keyword) ? "block" : "none";
    });
}

/* =====================================================
   7. แสดงสินค้าตามรถ
===================================================== */

function showProducts(truckId) {
    let truck = findTruck(truckId);
    let content = document.getElementById("content");
    let truckProducts = products.filter(product => product.truckId == truckId);

    let html = `
        <div class="page-title">
            <h1>${truck ? truck.name : "ไม่พบรถพุ่มพวง"}</h1>
            <p>📍 ${truck ? truck.location : "-"}</p>
        </div>
        <div class="card-container">
    `;

    if (truckProducts.length === 0) {
        html += `<div class="card"><p>ยังไม่มีสินค้า</p></div>`;
    } else {
        truckProducts.forEach(product => {
            let unitText = product.unit ? product.unit : "ชิ้น";
            html += `
                <div class="product-card">
                    <div class="product-image">🥬</div>
                    <h3>${product.name}</h3>
                    <p class="price">${formatPrice(product.price)}</p>
                    <p>เหลือ ${product.quantity} ${unitText}</p>
                    <button class="btn" onclick="addToCart(${product.id})">🛒 เพิ่มลงตะกร้า</button>
                </div>
            `;
        });
    }

    html += `</div>`;
    content.innerHTML = html;
}

/* =====================================================
   8. ตะกร้าสินค้า
===================================================== */

function addToCart(productId) {
    let product = findProduct(productId);
    if (!product) return;

    if (cart.length > 0) {
        let firstProduct = findProduct(cart[0].productId);
        if (firstProduct && firstProduct.truckId != product.truckId) {
            alert("สามารถสั่งสินค้าจากรถพุ่มพวงได้ครั้งละ 1 คัน");
            return;
        }
    }

    let cartItem = cart.find(item => item.productId == productId);

    if (cartItem) {
        if (cartItem.quantity < product.quantity) {
            cartItem.quantity++;
        } else {
            alert("สินค้าในสต็อกมีไม่พอ");
            return;
        }
    } else {
        cart.push({ productId: Number(productId), quantity: 1 });
    }

    saveData();
    alert("เพิ่มสินค้าลงตะกร้าแล้ว");
}

function showCart() {
    let content = document.getElementById("content");
    let html = `<div class="page-title"><h1>🛒 ตะกร้าสินค้า</h1></div>`;

    if (cart.length === 0) {
        html += `
            <div class="card">
                <p>ยังไม่มีสินค้าในตะกร้า</p>
                <button class="btn" onclick="navigateTo('trucks')">เลือกสินค้า</button>
            </div>
        `;
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
                <div>
                    <strong>${product.name}</strong><br>
                    ${formatPrice(product.price)}
                </div>
                <div>
                    <button class="btn" onclick="decreaseCart(${product.id})">-</button>
                    ${item.quantity}
                    <button class="btn" onclick="increaseCart(${product.id})">+</button>
                </div>
                <div>${formatPrice(subtotal)}</div>
                <button class="btn btn-danger" onclick="removeFromCart(${product.id})">ลบ</button>
            </div>
        `;
    });

    html += `
        <div class="cart-total">
            ยอดรวม: ${formatPrice(total)}<br><br>
            <button class="btn" onclick="checkout()">💳 ไปชำระเงิน</button>
        </div>
    `;

    content.innerHTML = html;
}

function increaseCart(productId) {
    let item = cart.find(item => item.productId == productId);
    let product = findProduct(productId);
    if (item && product && item.quantity < product.quantity) {
        item.quantity++;
    } else {
        alert("สินค้าในสต็อกมีไม่พอ");
    }
    saveData();
    showCart();
}

function decreaseCart(productId) {
    let item = cart.find(item => item.productId == productId);
    if (!item) return;

    item.quantity--;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveData();
    showCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId != productId);
    saveData();
    showCart();
}

/* =====================================================
   9. ชำระเงิน และระบบแต้มส่วนลด (Checkout)
===================================================== */

function checkout() {
    if (cart.length === 0) {
        alert("ไม่มีสินค้าในตะกร้า");
        return;
    }

    if (!currentUser) {
        alert("กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อนสั่งซื้อ");
        showLogin();
        return;
    }

    if (currentUser.role !== "customer") {
        alert("บัญชีผู้ขายไม่สามารถสั่งซื้อสินค้าได้");
        return;
    }

    let subtotal = cart.reduce((sum, item) => {
        let p = findProduct(item.productId);
        return sum + (p ? p.price * item.quantity : 0);
    }, 0);

    let userPoints = currentUser.points || 0;

    let html = `
        <h2>💳 ชำระเงิน</h2>
        <div class="card">
            <h3>ข้อมูลลูกค้า</h3>
            <p>ชื่อ: ${currentUser.name || '-'}</p>
            <p>เบอร์โทร: ${currentUser.phone || '-'}</p>
            <p style="color: #27ae60; font-weight: bold; margin-top: 5px;">⭐ แต้มสะสมคงเหลือ: ${userPoints} แต้ม</p>
        </div>

        ${userPoints > 0 ? `
            <div class="form-group" style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
                <label style="color: #166534; font-weight: bold;">🎁 ใช้แต้มสะสมแลกส่วนลด (1 แต้ม = 1 บาท)</label>
                <input type="number" id="usePointsInput" min="0" max="${Math.min(userPoints, subtotal)}" value="0" oninput="calculateDiscount(${subtotal},${userPoints})" placeholder="กรอกจำนวนแต้มที่ต้องการใช้">
                <small style="color: #15803d; display: block; margin-top: 4px;">แต้มสะสมที่จะได้รับจากออเดอร์นี้: +${Math.floor(subtotal / 100)} แต้ม</small>
            </div>
        ` : ''}

        <div class="form-group">
            <label>ที่อยู่จัดส่ง</label>
            <textarea id="customerAddress" rows="3" placeholder="กรอกที่อยู่จัดส่ง"></textarea>
        </div>

        <div class="card">
            <h3>🏦 ข้อมูลสำหรับโอนเงิน</h3>
            <p>ธนาคาร: กสิกรไทย</p>
            <p>ชื่อบัญชี: ร้านรถพุ่มพวง</p>
            <p>เลขบัญชี: 123-4-56789-0</p>
            <hr style="margin: 10px 0;">
            <p>ราคาสินค้ารวม: <span id="cartSubtotalText">${formatPrice(subtotal)}</span></p>
            <p style="color: #e74c3c;">ส่วนลดจากแต้ม: -<span id="discountText">0 บาท</span></p>
            <h3>ยอดสุทธิที่ต้องโอน: <span id="finalTotalText" style="color: #10b981;">${formatPrice(subtotal)}</span></h3>
        </div>

        <div class="form-group">
            <label>แนบสลิปการโอนเงิน</label>
            <input type="file" id="slipImage" accept="image/*">
        </div>
        <button class="btn" onclick="placeOrder(${subtotal})">✅ ยืนยันการสั่งซื้อ</button>
    `;

    openModal(html);
}

function calculateDiscount(subtotal, userPoints) {
    let inputEl = document.getElementById("usePointsInput");
    let pointsToUse = Number(inputEl.value) || 0;

    if (pointsToUse > userPoints) {
        pointsToUse = userPoints;
        inputEl.value = pointsToUse;
    }

    if (pointsToUse > subtotal) {
        pointsToUse = subtotal;
        inputEl.value = pointsToUse;
    }

    let finalTotal = subtotal - pointsToUse;

    document.getElementById("discountText").innerText = pointsToUse + " บาท";
    document.getElementById("finalTotalText").innerText = formatPrice(finalTotal);
}

function placeOrder(subtotal) {
    let address = document.getElementById("customerAddress").value.trim();
    let slipInput = document.getElementById("slipImage");
    let slipFile = slipInput.files[0];
    let pointsInput = document.getElementById("usePointsInput");
    let pointsUsed = pointsInput ? Number(pointsInput.value) || 0 : 0;

    if (!address) {
        alert("กรุณากรอกที่อยู่");
        return;
    }

    if (!slipFile) {
        alert("กรุณาแนบสลิปการโอนเงิน");
        return;
    }

    // อ่านไฟล์รูปภาพเปลี่ยนเป็น Base64
    let reader = new FileReader();
    reader.onload = function (e) {
        let slipDataUrl = e.target.result; // รูปสลิปจริง
        let finalTotal = subtotal - pointsUsed;
        let items = [];

        for (let cartItem of cart) {
            let product = findProduct(cartItem.productId);
            if (cartItem.quantity > product.quantity) {
                alert(`สินค้า ${product.name} มีไม่พอ`);
                return;
            }

            let itemSubtotal = product.price * cartItem.quantity;
            items.push({
                productId: product.id,
                productName: product.name,
                quantity: cartItem.quantity,
                price: product.price,
                subtotal: itemSubtotal
            });
        }

        let firstProduct = findProduct(cart[0].productId);

        let order = {
            id: getNextOrderId(),
            customerId: currentUser.id,
            customerName: currentUser.name,
            phone: currentUser.phone,
            address: address,
            truckId: firstProduct.truckId,
            items: items,
            subtotal: subtotal,
            discount: pointsUsed,
            total: finalTotal,
            date: new Date().toISOString(),
            status: "รอตรวจสอบ",
            paymentMethod: "โอนเงิน",
            paymentStatus: "รอตรวจสอบ",
            slipImage: slipDataUrl, // 🌟 บันทึกรูปสลิปจริง
            receiptNumber: null
        };

        orders.push(order);

        if (pointsUsed > 0) {
            currentUser.points = (currentUser.points || 0) - pointsUsed;
            let userInList = users.find(u => u.id == currentUser.id);
            if (userInList) userInList.points = currentUser.points;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        items.forEach(item => {
            let product = findProduct(item.productId);
            if (product) product.quantity -= item.quantity;
        });

        cart = [];
        saveData();
        renderNavbar();
        closeModal();
        alert("สั่งซื้อสำเร็จ กรุณารอร้านตรวจสอบการโอนเงิน");
        navigateTo('orders');
    };

    reader.readAsDataURL(slipFile);
}

/* =====================================================
   10. ระบบสมาชิก (Register & Login)
===================================================== */

function showRegister() {
    let html = `
        <div class="form-box">
            <h2>📝 สมัครสมาชิก</h2>
            <div class="form-group">
                <label>ชื่อผู้ใช้ (Username)</label>
                <input id="registerUsername" placeholder="ตั้งชื่อผู้ใช้">
            </div>
            <div class="form-group">
                <label>รหัสผ่าน</label>
                <input id="registerPassword" type="password" placeholder="ตั้งรหัสผ่าน">
            </div>
            <div class="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input id="registerPhone" placeholder="กรอกเบอร์โทรศัพท์">
            </div>
            <div class="form-group">
                <label>ประเภทสมาชิก</label>
                <select id="registerRole">
                    <option value="customer">ลูกค้า</option>
                    <option value="seller">ผู้ขาย</option>
                </select>
            </div>
            <button class="btn" onclick="registerUser()">สมัครสมาชิก</button>
            <p style="margin-top: 15px; text-align: center;">
                มีบัญชีแล้ว? 
                <button class="btn btn-blue" style="width: auto; padding: 4px 12px; margin-left: 5px;" onclick="closeModal(); setTimeout(showLogin, 100);">
                    เข้าสู่ระบบ
                </button>
            </p>
        </div>
    `;
    openModal(html);
}

function registerUser() {
    let name = document.getElementById("registerName").value.trim();
    let phone = document.getElementById("registerPhone").value.trim();
    let username = document.getElementById("registerUsername").value.trim();
    let password = document.getElementById("registerPassword").value;
    let role = document.getElementById("registerRole").value;

    if (!name || !phone || !username || !password) {
        alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
    }

    if (users.some(user => user.username === username)) {
        alert("Username นี้มีผู้ใช้งานแล้ว");
        return;
    }

    let newUser = {
        id: Date.now(),
        name: name,
        phone: phone,
        username: username,
        password: password,
        role: role,
        points: 0
    };

    users.push(newUser);
    saveData();
    
    alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
    closeModal();
    navigateTo('home');
    
    setTimeout(() => {
        showLogin();
    }, 200);
}

function showLogin() {
    let html = `
        <div class="form-box">
            <h2>🔐 เข้าสู่ระบบ</h2>
            <div class="form-group">
                <label>Username</label>
                <input id="loginUsername" placeholder="Username">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input id="loginPassword" type="password" placeholder="Password">
            </div>
            <button class="btn" onclick="login()">เข้าสู่ระบบ</button>
            <p style="margin-top: 15px; text-align: center;">ยังไม่มีบัญชี?</p>
            <button class="btn btn-blue" onclick="closeModal(); setTimeout(showRegister, 100);">สมัครสมาชิก</button>
        </div>
    `;
    openModal(html);
}

function login() {
    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value;

    let user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        alert("Username หรือ Password ไม่ถูกต้อง");
        return;
    }

    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    closeModal();
    renderNavbar(); // 👈 1. สั่งวาด Navbar ใหม่ทันที

    alert(`ยินดีต้อนรับคุณ ${currentUser.name}`);

    // 👈 2. สลับหน้าตามบทบาทผู้ใช้
    if (user.role === "seller") {
        navigateTo('seller');
    } else {
        navigateTo('home');
    }
}
function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    renderNavbar();
    alert("ออกจากระบบแล้ว");
    navigateTo('home');
}

/* =====================================================
   11. หน้าออเดอร์ของฉัน (Customer Orders + Stepper)
===================================================== */

function getStepProgress(status) {
    switch (status) {
        case "รอตรวจสอบ": return 1;
        case "กำลังเตรียมสินค้า": return 2;
        case "พร้อมจัดส่ง": return 3;
        case "จัดส่งสำเร็จ": return 4;
        default: return 0;
    }
}

function renderStepperHTML(currentStatus) {
    if (currentStatus === "ยกเลิกออเดอร์" || currentStatus === "ชำระเงินไม่ถูกต้อง") {
        return `
            <div class="stepper-wrapper canceled">
                <div class="stepper-item canceled">
                    <div class="step-counter">❌</div>
                    <div class="step-name">ออเดอร์ถูกยกเลิก</div>
                </div>
            </div>
        `;
    }

    const steps = [
        { level: 1, name: "รอตรวจสอบ", icon: "⏳" },
        { level: 2, name: "กำลังเตรียมสินค้า", icon: "👨‍🍳" },
        { level: 3, name: "พร้อมจัดส่ง", icon: "🚚" },
        { level: 4, name: "จัดส่งสำเร็จ", icon: "✅" }
    ];

    const currentLevel = getStepProgress(currentStatus);
    let html = `<div class="stepper-wrapper">`;

    steps.forEach(step => {
        let stateClass = "";
        if (step.level < currentLevel) {
            stateClass = "completed";
        } else if (step.level === currentLevel) {
            stateClass = "active";
        }

        html += `
            <div class="stepper-item ${stateClass}">
                <div class="step-counter">${step.level < currentLevel ? "✓" : step.icon}</div>
                <div class="step-name">${step.name}</div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

function showOrders() {
    if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        showLogin();
        return;
    }

    if (currentUser.role !== "customer") {
        alert("หน้านี้สำหรับลูกค้า");
        return;
    }

    let content = document.getElementById("content");
    let myOrders = orders.filter(order => order.customerId == currentUser.id);

    let html = `
        <div class="page-title">
            <h1>📦 ออเดอร์ของฉัน</h1>
        </div>

        <div class="card" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: none; margin-bottom: 20px;">
            <h3>⭐ แต้มสะสมของฉัน: <span style="font-size: 1.5rem; color: #d97706;">${currentUser.points || 0}</span> แต้ม</h3>
            <p style="font-size: 0.85rem; color: #92400e;">(ซื้อครบทุก 100 บาท รับ 1 แต้ม / 1 แต้ม = ส่วนลด 1 บาท)</p>
        </div>
    `;

    if (myOrders.length === 0) {
        html += `<div class="card"><p>ยังไม่มีรายการสั่งซื้อ</p></div>`;
        content.innerHTML = html;
        return;
    }

    for (let i = myOrders.length - 1; i >= 0; i--) {
        let order = myOrders[i];
        let truck = findTruck(order.truckId);

        html += `
            <div class="card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>ออเดอร์ #${order.id}</h3>
                    <span style="font-size: 0.9em; color: #666;">
                        📅 ${new Date(order.date).toLocaleString("th-TH")}
                    </span>
                </div>

                ${renderStepperHTML(order.status)}

                <div style="background: #f9f9f9; padding: 12px; border-radius: 8px; margin-top: 10px;">
                    <p><strong>รถพุ่มพวง:</strong> ${truck ? truck.name : "-"}</p>
                    ${order.discount ? `<p style="color: #dc2626;"><strong>ส่วนลดจากแต้ม:</strong> -${order.discount} บาท</p>` : ''}
                    <p><strong>ยอดเงินสุทธิ:</strong> <strong>${formatPrice(order.total)}</strong></p>
                    <p><strong>การชำระเงิน:</strong> ${order.paymentStatus}</p>
                </div>
        `;

        if (order.paymentStatus === "ชำระเงินแล้ว") {
            html += `
                <div style="margin-top: 10px;">
                    <button class="btn btn-blue" onclick="showReceipt(${order.id})">
                        🧾 ดูใบเสร็จรับเงิน
                    </button>
                </div>
            `;
        }

        html += `</div>`;
    }

    content.innerHTML = html;
}

/* =====================================================
   12. ระบบผู้ขาย (Seller System)
===================================================== */

function showSeller() {
    if (!currentUser || currentUser.role !== "seller") {
        alert("กรุณาเข้าสู่ระบบผู้ขาย");
        showLogin();
        return;
    }

    // คำนวณข้อมูลสำหรับแดชบอร์ด
    let today = getToday();
    let todayOrders = orders.filter(o => o.date.substring(0, 10) === today && o.paymentStatus === "ชำระเงินแล้ว");
    let todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);
    let pendingOrders = orders.filter(o => o.paymentStatus === "รอตรวจสอบ");

    let content = document.getElementById("content");
    content.innerHTML = `
        <div class="page-title" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            <div>
                <h1 style="font-size: 1.8rem; color: var(--dark);">👨‍💼 แดชบอร์ดผู้ขาย</h1>
                <p style="color: #64748b;">ยินดีต้อนรับคุณ <strong>${currentUser.name}</strong></p>
            </div>
            <span class="badge" style="background: var(--primary-light); color: var(--primary-hover); font-size: 0.9rem; padding: 6px 14px; border-radius: 20px;">
                🟢 พร้อมให้บริการ
            </span>
        </div>

        <!-- 1. ตัวเลขสรุปภาพรวมด่วน -->
        <div class="report-container" style="margin-top: 20px;">
            <div class="report-card" style="border-left: 5px solid #10b981;">
                <p style="color: #64748b; font-size: 0.9rem;">💰 ยอดขายวันนี้</p>
                <h2 style="font-size: 1.6rem; color: #10b981; margin: 5px 0;">${formatPrice(todayTotal)}</h2>
                <p style="font-size: 0.85rem; color: #64748b;">สำเร็จ ${todayOrders.length} ออเดอร์</p>
            </div>
            <div class="report-card" style="border-left: 5px solid #f59e0b;">
                <p style="color: #64748b; font-size: 0.9rem;">⏳ รอตรวจสอบสลิป</p>
                <h2 style="font-size: 1.6rem; color: #f59e0b; margin: 5px 0;">${pendingOrders.length} รายการ</h2>
                <p style="font-size: 0.85rem; color: #64748b;">รอยืนยันการชำระเงิน</p>
            </div>
            <div class="report-card" style="border-left: 5px solid #3b82f6;">
                <p style="color: #64748b; font-size: 0.9rem;">🚚 รถพุ่มพวงในระบบ</p>
                <h2 style="font-size: 1.6rem; color: #3b82f6; margin: 5px 0;">${trucks.length} คัน</h2>
                <p style="font-size: 0.85rem; color: #64748b;">พร้อมวิ่งให้บริการ</p>
            </div>
            <div class="report-card" style="border-left: 5px solid #8b5cf6;">
                <p style="color: #64748b; font-size: 0.9rem;">🥬 สินค้าทั้งหมด</p>
                <h2 style="font-size: 1.6rem; color: #8b5cf6; margin: 5px 0;">${products.length} รายการ</h2>
                <p style="font-size: 0.85rem; color: #64748b;">ในคลังสินค้า</p>
            </div>
        </div>

        <!-- 2. เมนูจัดการหลัก -->
        <div style="margin-top: 35px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: var(--dark);">🛠️ เมนูจัดการระบบ</h3>
            <div class="card-container">
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🚚</div>
                    <h3 style="margin-bottom: 6px;">จัดการรถพุ่มพวง</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">เพิ่ม/ลบ รถพุ่มพวง และกำหนดจุดให้บริการ</p>
                    <button class="btn" onclick="navigateTo('manageTrucks')">จัดการรถ</button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🥬</div>
                    <h3 style="margin-bottom: 6px;">จัดการสินค้า</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">เพิ่ม แก้ไขสต็อกสินค้า และ <br> ราคา</p>
                    <button class="btn" onclick="navigateTo('manageProducts')">จัดการสินค้า</button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📦</div>
                    <h3 style="margin-bottom: 6px;">จัดการออเดอร์</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">ตรวจสลิปโอนเงิน และอัปเดตสถานะจัดส่ง</p>
                    <button class="btn btn-blue" onclick="navigateTo('manageOrders')">
                        ดูออเดอร์ ${pendingOrders.length > 0 ? `(${pendingOrders.length})` : ''}
                    </button>
                </div>
                <div class="card" style="text-align: center; padding: 24px;">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">📊</div>
                    <h3 style="margin-bottom: 6px;">รายงานยอดขาย</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">สรุปรายได้ประจำวัน ประจำเดือน และใบเสร็จ</p>
                    <button class="btn btn-blue" onclick="navigateTo('salesReport')">ดูรายงาน</button>
                </div>
            </div>
        </div>

        <!-- 3. ตารางรายการสั่งซื้อล่าสุด -->
        <div class="card" style="margin-top: 35px; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>📦 รายการสั่งซื้อล่าสุด</h3>
                <button class="btn btn-blue" style="width: auto; padding: 6px 14px; font-size: 0.85rem;" onclick="navigateTo('manageOrders')">
                    ดูออเดอร์ทั้งหมด →
                </button>
            </div>
            <div class="table-box">
                <table>
                    <thead>
                        <tr>
                            <th>เลขที่ออเดอร์</th>
                            <th>ชื่อลูกค้า</th>
                            <th>ยอดเงินสุทธิ</th>
                            <th>สถานะสลิป</th>
                            <th>สถานะการจัดส่ง</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${createRecentOrdersRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ฟังก์ชันช่วยเรนเดอร์แถวออเดอร์ล่าสุด 5 รายการ
function createRecentOrdersRows() {
    if (orders.length === 0) {
        return `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">ยังไม่มีรายการสั่งซื้อเข้ามาในระบบ</td></tr>`;
    }

    let recentOrders = orders.slice(-5).reverse();

    return recentOrders.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.customerName}</td>
            <td><strong>${formatPrice(o.total)}</strong></td>
            <td>
                <span class="badge" style="background: ${o.paymentStatus === 'ชำระเงินแล้ว' ? '#d1fae5' : '#fef3c7'}; color: ${o.paymentStatus === 'ชำระเงินแล้ว' ? '#059669' : '#d97706'};">
                    ${o.paymentStatus}
                </span>
            </td>
            <td>${o.status}</td>
        </tr>
    `).join("");
}

function manageTrucks() {
    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <h2>🚚 จัดการรถพุ่มพวง</h2>
        <button class="btn" onclick="showAddTruck()">+ เพิ่มรถ</button>
        <hr style="margin: 15px 0;">
    `;

    trucks.forEach(truck => {
        html += `
            <div class="card" style="margin-bottom: 15px;">
                <h3>🚚 ${truck.name}</h3>
                <p><strong>ทะเบียน:</strong> ${truck.license}</p>
                <p>📍 ${truck.location}</p>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 12px;">${truck.description || '-'}</p>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-blue" onclick="showEditTruck(${truck.id})">✏️ แก้ไขข้อมูลรถ</button>
                    <button class="btn btn-danger" onclick="deleteTruck(${truck.id})">🗑️ ลบรถ</button>
                </div>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

// เปิดหน้าต่าง Modal แก้ไขข้อมูลรถ
function showEditTruck(truckId) {
    let truck = findTruck(truckId);
    if (!truck) return;

    let html = `
        <h2>✏️ แก้ไขข้อมูลรถพุ่มพวง</h2>
        <div class="form-group">
            <label>ชื่อรถ</label>
            <input id="editTruckName" value="${truck.name}">
        </div>
        <div class="form-group">
            <label>ทะเบียน</label>
            <input id="editTruckLicense" value="${truck.license}">
        </div>
        <div class="form-group">
            <label>สถานที่ให้บริการ</label>
            <input id="editTruckLocation" value="${truck.location}">
        </div>
        <div class="form-group">
            <label>รายละเอียด</label>
            <textarea id="editTruckDescription" rows="3">${truck.description || ''}</textarea>
        </div>
        <button class="btn" onclick="saveEditTruck(${truck.id})">💾 บันทึกการแก้ไข</button>
    `;

    openModal(html);
}

// บันทึกข้อมูลรถพุ่มพวงที่แก้ไข
function saveEditTruck(truckId) {
    let truck = findTruck(truckId);
    if (!truck) return;

    let name = document.getElementById("editTruckName").value.trim();
    let license = document.getElementById("editTruckLicense").value.trim();
    let location = document.getElementById("editTruckLocation").value.trim();
    let description = document.getElementById("editTruckDescription").value.trim();

    if (!name || !license) {
        alert("กรุณากรอกชื่อรถและทะเบียนรถให้ครบถ้วน");
        return;
    }

    truck.name = name;
    truck.license = license;
    truck.location = location;
    truck.description = description;

    saveData();
    closeModal();
    manageTrucks();
    alert("อัปเดตข้อมูลรถพุ่มพวงเรียบร้อยแล้ว");
}

function deleteTruck(truckId) {
    if (!confirm("ต้องการลบรถคันนี้หรือไม่?")) return;

    trucks = trucks.filter(truck => truck.id != truckId);
    products = products.filter(product => product.truckId != truckId);
    saveData();
    manageTrucks();
}

function manageProducts() {
    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <h2>🥬 จัดการสินค้า</h2>
        <button class="btn" onclick="showAddProduct()">+ เพิ่มสินค้า</button>
        <div class="table-box">
            <table>
                <thead>
                    <tr>
                        <th>สินค้า</th>
                        <th>รถ</th>
                        <th>ราคา</th>
                        <th>จำนวน</th>
                        <th style="text-align: center;">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (products.length === 0) {
        html += `<tr><td colspan="5" style="text-align: center;">ยังไม่มีรายการสินค้า</td></tr>`;
    } else {
        products.forEach(product => {
            let truck = findTruck(product.truckId);
            let unitText = product.unit ? product.unit : "ชิ้น";

            html += `
                <tr>
                    <td><strong>${product.name}</strong></td>
                    <td>${truck ? truck.name : "-"}</td>
                    <td>${formatPrice(product.price)}</td>
                    <td>${product.quantity} ${unitText}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-blue" style="padding: 4px 8px; font-size: 0.85rem;" onclick="showEditProduct(${product.id})">✏️ แก้ไข</button>
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.85rem;" onclick="deleteProduct(${product.id})">🗑️ ลบ</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    document.getElementById("content").innerHTML = html;
}

function showAddProduct() {
    let options = trucks.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    let html = `
        <h2>เพิ่มสินค้า</h2>
        <div class="form-group"><label>ชื่อสินค้า</label><input id="productName"></div>
        <div class="form-group"><label>รถพุ่มพวง</label><select id="productTruck">${options}</select></div>
        <div class="form-group"><label>ราคา</label><input id="productPrice" type="number"></div>
        <div class="form-group"><label>จำนวน</label><input id="productQuantity" type="number"></div>
        <div class="form-group"><label>หน่วย</label><input id="productUnit" placeholder="เช่น แผง / กำ / กิโลกรัม"></div>
        <button class="btn" onclick="saveProduct()">บันทึกสินค้า</button>
    `;
    openModal(html);
}

function saveProduct() {
    let name = document.getElementById("productName").value.trim();
    let truckId = Number(document.getElementById("productTruck").value);
    let price = Number(document.getElementById("productPrice").value);
    let quantity = Number(document.getElementById("productQuantity").value);
    let unit = document.getElementById("productUnit").value.trim();

    if (!name || price <= 0 || quantity <= 0) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    // ตรวจสอบว่ารถคันนี้มีสินค้านี้อยู่แล้วหรือไม่
    let existingProduct = products.find(p => p.truckId === truckId && p.name.toLowerCase() === name.toLowerCase());

    if (existingProduct) {
        // ถ้านามซ้ำ ให้ทบจำนวนสต็อกเพิ่มเข้าไปในรายการเดิม
        existingProduct.quantity += quantity;
        existingProduct.price = price; // อัปเดตราคาล่าสุด
        if (unit) existingProduct.unit = unit;
        alert(`พบสินค้า "${name}" ในรถคันนี้อยู่แล้ว ระบบได้ทำการบวกเพิ่มจำนวนสต็อกให้อัตโนมัติ`);
    } else {
        // ถ้าเป็นสินค้าใหม่ ให้สร้างรายการใหม่
        products.push({
            id: Date.now(),
            truckId: truckId,
            name: name,
            price: price,
            quantity: quantity,
            unit: unit !== "" ? unit : "ชิ้น"
        });
        alert("เพิ่มสินค้าเรียบร้อยแล้ว");
    }

    saveData();
    closeModal();
    manageProducts();
}

function showEditProduct(productId) {
    let product = findProduct(productId);
    if (!product) return;

    let options = trucks.map(t => 
        `<option value="${t.id}" ${t.id == product.truckId ? "selected" : ""}>${t.name}</option>`
    ).join("");

    let html = `
        <h2>✏️ แก้ไขสินค้า</h2>
        <div class="form-group"><label>ชื่อสินค้า</label><input id="editProductName" value="${product.name}"></div>
        <div class="form-group"><label>รถพุ่มพวง</label><select id="editProductTruck">${options}</select></div>
        <div class="form-group"><label>ราคา</label><input id="editProductPrice" type="number" value="${product.price}"></div>
        <div class="form-group"><label>จำนวนสต็อก</label><input id="editProductQuantity" type="number" value="${product.quantity}"></div>
        <div class="form-group"><label>หน่วย</label><input id="editProductUnit" value="${product.unit || ''}" placeholder="เช่น แผง / กำ / กิโลกรัม"></div>
        <button class="btn" onclick="saveEditProduct(${product.id})">💾 บันทึกการแก้ไข</button>
    `;

    openModal(html);
}

function saveEditProduct(productId) {
    let product = findProduct(productId);
    if (!product) return;

    let name = document.getElementById("editProductName").value.trim();
    let truckId = Number(document.getElementById("editProductTruck").value);
    let price = Number(document.getElementById("editProductPrice").value);
    let quantity = Number(document.getElementById("editProductQuantity").value);
    let unit = document.getElementById("editProductUnit").value.trim();

    if (!name || price <= 0 || quantity < 0) {
        alert("กรุณากรอกข้อมูลให้ถูกต้อง");
        return;
    }

    product.name = name;
    product.truckId = truckId;
    product.price = price;
    product.quantity = quantity;
    product.unit = unit || "ชิ้น";

    saveData();
    closeModal();
    manageProducts();
    alert("อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว");
}

function deleteProduct(productId) {
    if (!confirm("คุณต้องการลบสินค้ารายการนี้ใช่หรือไม่?")) return;

    products = products.filter(p => p.id != productId);
    cart = cart.filter(c => c.productId != productId);

    saveData();
    manageProducts();
}

function manageOrders() {
    let content = document.getElementById("content");
    let html = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <div class="page-title">
            <h1>📦 รายการออเดอร์ทั้งหมด</h1>
        </div>
    `;

    if (orders.length === 0) {
        html += `<div class="card"><p>ยังไม่มีออเดอร์ในระบบ</p></div>`;
        content.innerHTML = html;
        return;
    }

    for (let i = orders.length - 1; i >= 0; i--) {
        let order = orders[i];

        html += `
            <div class="card" style="margin-bottom: 15px; border-left: 5px solid ${order.paymentStatus === 'ชำระเงินแล้ว' ? '#10b981' : '#f59e0b'};">
                <h3>ออเดอร์ #${order.id}</h3>
                <p><strong>ลูกค้า:</strong> ${order.customerName} (${order.phone})</p>
                <p><strong>ที่อยู่จัดส่ง:</strong> ${order.address || '-'}</p>
                ${order.discount ? `<p style="color: #dc2626;"><strong>ส่วนลดแต้ม:</strong> -${order.discount} บาท</p>` : ''}
                <p><strong>ยอดเงินสุทธิ:</strong> <strong>${formatPrice(order.total)}</strong></p>
                <p><strong>สถานะการชำระเงิน:</strong> <span class="badge">${order.paymentStatus}</span></p>

                <!-- ปุ่มเปิดดูรูปภาพสลิป -->
                <div style="margin: 10px 0;">
                    ${order.slipImage ? `
                        <button class="btn btn-blue" style="width: auto; padding: 6px 12px; font-size: 0.85rem;" onclick="viewSlip('${order.id}')">
                            🖼️ ดูหลักฐานสลิปโอนเงิน
                        </button>
                    ` : '<p style="color: #ef4444; font-size: 0.85rem;">⚠️ ไม่มีหลักฐานสลิป</p>'}
                </div>

                ${order.receiptNumber ? `<p><strong>เลขที่ใบเสร็จ:</strong> ${order.receiptNumber}</p>` : ''}

                <hr style="margin: 10px 0;">

                <div style="margin-bottom: 10px;">
        `;

        if (order.paymentStatus === "รอตรวจสอบ") {
            html += `
                <button class="btn btn-success" style="margin-bottom: 6px;" onclick="confirmPayment(${order.id})">
                    ✅ ยืนยันสลิปถูกต้อง
                </button>
                <button class="btn btn-danger" onclick="rejectPayment(${order.id})">
                    ❌ ปฏิเสธสลิป / ไม่ถูกต้อง
                </button>
            `;
        } else {
            html += `<p style="color: green; font-weight: bold;">✓ ตรวจสอบการชำระเงินเรียบร้อยแล้ว</p>`;
        }

        html += `
                </div>

                <div class="form-group" style="margin-top: 10px;">
                    <label><strong>อัปเดตสถานะการจัดส่ง:</strong></label>
                    <select id="statusSelect_${order.id}" onchange="updateOrderStatus(${order.id}, this.value)" class="form-control" style="padding: 5px; margin-top: 5px;">
                        <option value="รอตรวจสอบ" ${order.status === "รอตรวจสอบ" ? "selected" : ""}>⏳ รอตรวจสอบ</option>
                        <option value="กำลังเตรียมสินค้า" ${order.status === "กำลังเตรียมสินค้า" ? "selected" : ""}>👨‍🍳 กำลังเตรียมสินค้า</option>
                        <option value="พร้อมจัดส่ง" ${order.status === "พร้อมจัดส่ง" ? "selected" : ""}>🚚 พร้อมจัดส่ง</option>
                        <option value="จัดส่งสำเร็จ" ${order.status === "จัดส่งสำเร็จ" ? "selected" : ""}>✅ จัดส่งสำเร็จ</option>
                        <option value="ยกเลิกออเดอร์" ${order.status === "ยกเลิกออเดอร์" ? "selected" : ""}>❌ ยกเลิกออเดอร์</option>
                    </select>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
}

// ฟังก์ชันแสดงรูปสลิปขยายใหญ่ใน Modal
function viewSlip(orderId) {
    let order = orders.find(o => o.id == orderId);
    if (!order || !order.slipImage) return;

    let html = `
        <div style="text-align: center;">
            <h2>🖼️ หลักฐานการโอนเงิน (ออเดอร์ #${order.id})</h2>
            <p>ยอดโอนสุทธิ: <strong>${formatPrice(order.total)}</strong></p>
            <hr style="margin: 12px 0;">
            <img src="${order.slipImage}" alt="สลิปการโอนเงิน" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="margin-top: 16px;">
                <button class="btn btn-blue" onclick="closeModal()">ปิดหน้าต่าง</button>
            </div>
        </div>
    `;

    openModal(html);
}

function confirmPayment(orderId) {
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    if (!confirm(`ยืนยันการชำระเงินสำหรับออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    order.paymentStatus = "ชำระเงินแล้ว";
    order.status = "กำลังเตรียมสินค้า";
    order.receiptNumber = getReceiptNumber(order.id);

    let earnedPoints = Math.floor(order.total / 100);
    let customer = users.find(u => u.id == order.customerId);
    
    if (customer) {
        customer.points = (customer.points || 0) + earnedPoints;
        if (currentUser && currentUser.id == customer.id) {
            currentUser.points = customer.points;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
    }

    saveData();
    renderNavbar();
    alert(`อนุมัติการชำระเงินเรียบร้อยแล้ว (ลูกค้าได้รับ +${earnedPoints} แต้มสะสม)`);
    manageOrders();
}

function rejectPayment(orderId) {
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    if (!confirm(`ต้องการปฏิเสธสลิปการโอนเงินของออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    order.paymentStatus = "ชำระเงินไม่ถูกต้อง";
    order.status = "ยกเลิกออเดอร์";

    saveData();
    alert("ปฏิเสธการชำระเงินแล้ว");
    manageOrders();
}

function updateOrderStatus(orderId, newStatus) {
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    order.status = newStatus;
    saveData();
    alert(`อัปเดตสถานะออเดอร์ #${orderId} เป็น "${newStatus}" เรียบร้อยแล้ว`);
    manageOrders();
}

/* =====================================================
   13. ใบเสร็จรับเงิน & รายงานยอดขาย
===================================================== */

function showReceipt(orderId) {
    let order = orders.find(o => o.id == orderId);
    if (!order) return;

    let truck = findTruck(order.truckId);

    let html = `
        <div class="receipt">
            <div class="receipt-header">
                <h1>🚚 รถพุ่มพวง</h1>
                <h2>ใบเสร็จรับเงิน</h2>
                <p>เลขที่ใบเสร็จ: ${order.receiptNumber}</p>
                <p>วันที่: ${new Date(order.date).toLocaleString("th-TH")}</p>
            </div>
            <p><strong>ลูกค้า:</strong> ${order.customerName}</p>
            <p><strong>เบอร์โทร:</strong> ${order.phone}</p>
            <p><strong>รถ:</strong> ${truck ? truck.name : "-"}</p>
            <hr>
            <table>
                <tr>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ราคา</th>
                </tr>
    `;

    order.items.forEach(item => {
        html += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.subtotal)}</td>
            </tr>
        `;
    });

    html += `
            </table>
            ${order.discount ? `<p style="text-align: right; color: #dc2626; margin-top: 10px;">ส่วนลดจากแต้มสะสม: -${order.discount} บาท</p>` : ''}
            <div class="receipt-total">รวมทั้งสิ้น: ${formatPrice(order.total)}</div>
            <p>วิธีชำระเงิน: ${order.paymentMethod}</p>
            <p>สถานะ: ชำระเงินแล้ว</p>
            <br>
            <div style="text-align:center">
                <p>ขอบคุณที่ใช้บริการ</p>
                <button class="btn" onclick="window.print()">🖨️ พิมพ์ใบเสร็จ</button>
            </div>
        </div>
    `;

    openModal(html);
}

function showSalesReport() {
    let today = getToday();
    let month = getCurrentMonth();

    let todayOrders = orders.filter(o => o.date.substring(0, 10) === today && o.paymentStatus === "ชำระเงินแล้ว");
    let monthOrders = orders.filter(o => o.date.substring(0, 7) === month && o.paymentStatus === "ชำระเงินแล้ว");

    let todayTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);
    let monthTotal = monthOrders.reduce((sum, o) => sum + o.total, 0);

    let content = document.getElementById("content");
    content.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-blue" style="width: auto; padding: 6px 14px;" onclick="navigateTo('seller')">← กลับหน้าระบบผู้ขาย</button>
        </div>
        <div class="page-title">
            <h1>📊 รายงานยอดขาย</h1>
            <p>แสดงเฉพาะออเดอร์ที่ชำระเงินแล้ว</p>
        </div>
        <div class="report-container">
            <div class="report-card">
                <h3>📅 ยอดขายวันนี้</h3>
                <h2>${formatPrice(todayTotal)}</h2>
                <p>${todayOrders.length} ออเดอร์</p>
            </div>
            <div class="report-card">
                <h3>📆 ยอดขายเดือนนี้</h3>
                <h2>${formatPrice(monthTotal)}</h2>
                <p>${monthOrders.length} ออเดอร์</p>
            </div>
            <div class="report-card">
                <h3>🧾 ใบเสร็จเดือนนี้</h3>
                <h2>${monthOrders.length}</h2>
                <p>ใบเสร็จ</p>
            </div>
        </div>
        <br>
        <div class="card">
            <h2>รายการขายวันนี้</h2>
            <div class="table-box">
                <table>
                    <tr>
                        <th>ออเดอร์</th>
                        <th>ลูกค้า</th>
                        <th>เวลา</th>
                        <th>ยอดเงิน</th>
                    </tr>
                    ${createSalesRows(todayOrders)}
                </table>
            </div>
        </div>
    `;
}

function createSalesRows(orderList) {
    if (orderList.length === 0) {
        return `<tr><td colspan="4" style="text-align:center;">ยังไม่มีรายการขายวันนี้</td></tr>`;
    }

    return orderList.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleTimeString("th-TH")}</td>
            <td>${formatPrice(order.total)}</td>
        </tr>
    `).join("");
}

/* =====================================================
   14. ควบคุม Modal
===================================================== */

function openModal(html) {
    document.getElementById("modalContent").innerHTML = html;
    document.getElementById("modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

/* =====================================================
   15. เริ่มต้นระบบ (Initialize App)
===================================================== */

function initApp() {
    renderNavbar();
    let savedPage = JSON.parse(localStorage.getItem("currentPage"));

    if (savedPage && savedPage.name) {
        navigateTo(savedPage.name, savedPage.param);
    } else {
        navigateTo("home");
    }
}

// เริ่มการทำงานระบบเมื่อโหลดไฟล์
initApp();
