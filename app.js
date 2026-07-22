
const GOLD_API_KEY = "goldapi-089a4b351a675e09bc33b56b7675057d-io"; 

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    fetchGoldPrices();
    
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", fetchGoldPrices);
    }
});

function initTabs() {
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            const targetId = item.getAttribute("data-target");
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.classList.remove("active");
            });
            const targetTab = document.getElementById(targetId);
            if (targetTab) {
                targetTab.classList.add("active");
            }
        });
    });
}

async function fetchGoldPrices() {
    try {
        const response = await fetch("https://www.goldapi.io/api/XAU/USD", {
            headers: {
                "x-access-token": GOLD_API_KEY,
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        
        if(data && data.price_gram_24k) {
            let usdRate = 51.5; 
            let price24 = data.price_gram_24k * usdRate;
            
            document.getElementById("price-24-sell").innerText = Math.round(price24);
            document.getElementById("price-24-buy").innerText = Math.round(price24 * 0.99);

            let price21 = price24 * (21/24);
            document.getElementById("price-21-sell").innerText = Math.round(price21);
            document.getElementById("price-21-buy").innerText = Math.round(price21 * 0.99);

            let price22 = price24 * (22/24);
            document.getElementById("price-22-sell").innerText = Math.round(price22);
            document.getElementById("price-22-buy").innerText = Math.round(price22 * 0.99);

            let price18 = price24 * (18/24);
            document.getElementById("price-18-sell").innerText = Math.round(price18);
            document.getElementById("price-18-buy").innerText = Math.round(price18 * 0.99);

            let coinPrice = price21 * 8;
            document.getElementById("main-coin-price").innerText = Math.round(coinPrice).toLocaleString() + " ج.م";
            document.getElementById("main-coin-sub").innerText = `الشراء: ${Math.round(coinPrice * 0.99).toLocaleString()} | البيع: ${Math.round(coinPrice).toLocaleString()}`;

            document.getElementById("last-update-text").innerText = "تم التحديث لحظياً: " + new Date().toLocaleTimeString("ar-EG");
        }
    } catch (error) {
        console.error("خطأ في جلب الأسعار:", error);
        const updateText = document.getElementById("last-update-text");
        if(updateText) updateText.innerText = "تعذر تحديث الأسعار حالياً";
    }
}
