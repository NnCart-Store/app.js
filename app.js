import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// 🔥 FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCH...",
  authDomain: "nncart.firebaseapp.com",
  projectId: "nncart",
  storageBucket: "nncart.appspot.com",
  messagingSenderId: "662993037031",
  appId: "1:662993037031:web:893e379fe374cb74d26442"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 APNA GOOGLE SHEET WEB APP URL YAHAN PASTE KAREIN
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyNtRN7HSWCm-8vrMLp0tHfTCghe_WtFVWHZI5SRZasmf1l-JCrUEh1YTXr_7OzCAly/exec";

let cart = [];

// 🔥 LOAD PRODUCTS
export async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 🛒 ADD TO CART
window.addToCart = (p) => {
  cart.push(p);
  document.getElementById("cartCount").innerText = cart.length;
};

// 🧾 TOTAL CALCULATOR
function getTotal() {
  return cart.reduce((s, i) => s + Number(i["Price"] || 0), 0);
}

// 📦 SUBMIT ORDER (FIREBASE + GOOGLE SHEETS INTEGRATION)
window.submitOrder = async () => {
  const now = new Date();

  // Order data jo save hoga
  const orderData = {
    "Timestamp": now.toISOString(),
    "Customer Name": document.getElementById("cName").value,
    "Mobile": document.getElementById("mobile").value,
    "Address": document.getElementById("address").value,
    "Products": cart.map(i => i["Product Name"]).join(", "),
    "Total": getTotal(),
    "Payment Proof": document.getElementById("payProof").value,
    "Status": "Pending",
    "Barcode ID": "",
    "Price": getTotal(),
    "Size": "",
    "Color": "",
    "Category": "",
    "Stock": "",
    "Shipping ID": "Pending",
    "Description": document.getElementById("desc").value,
    "Order Date": now.toLocaleDateString(),
    "OrderTime": now.toLocaleTimeString()
  };

  try {
    // 1. Firebase mein save karein
    await addDoc(collection(db, "orders"), orderData);

    // 2. Google Sheet mein bhejein
    await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    alert("✅ Order Placed Successfully!");
    location.reload();
    
  } catch (error) {
    console.error("Error submitting order:", error);
    alert("❌ Error: Check console for details.");
  }
};

// 📷 BARCODE SCAN
window.startScanner = () => {
  const html5QrCode = new Html5Qrcode("scanner");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async (decodedText) => {
      document.getElementById("barcode").value = decodedText;

      const snap = await getDocs(collection(db, "products"));
      snap.forEach(doc => {
        let p = doc.data();
        if (p["Barcode"] == decodedText) {
          document.getElementById("pname").value = p["Product Name"];
          document.getElementById("price").value = p["Price"];
          document.getElementById("image").value = p["Image URL"];
        }
      });

      html5QrCode.stop();
    }
  );
};

// ➕ SAVE PRODUCT
window.saveProduct = async () => {
  await addDoc(collection(db, "products"), {
    "Timestamp": new Date().toISOString(),
    "Barcode": document.getElementById("barcode").value,
    "Product Name": document.getElementById("pname").value,
    "Image URL": document.getElementById("image").value,
    "Price": document.getElementById("price").value,
    "category": document.getElementById("category").value,
    "stock": document.getElementById("stock").value,
    "color": document.getElementById("color").value,
    "size": document.getElementById("size").value
  });

  alert("Product Saved!");
};
