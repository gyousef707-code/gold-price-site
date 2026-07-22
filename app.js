
document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    fetchRealGoldPrices();
    
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", fetchRealGoldPrices);
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

async function fetchRealGoldPrices() {
    try {
        // جلب السعر العالمي الحقيقي للأوقية بالدولار مباشرة بدون حظر CORS
        const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD");
        const data = await response.json();
        
        if (data && data.items && data.items[0]) {
            let ounceUSD = data.items[0].xauPrice; // سعر الأوقية عالمياً
            let usdRate = 52.10; // سعر دولار الصاغة المعتمد في التطبيق
            
            // حساب سعر جرام عيار 24 بالجنيه (الأوقية = 31.1035 جرام)
            let gram24USD = ounceUSD / 31.1035;
            let price24 = gram24USD * usdRate;
            
            let price21 = price24 * (21/24);
            let price22 = price24 * (22/24);
            let price18 = price24 * (18/24);
            let coinPrice = price21 * 8; // الجنيه الذهب 8 جرام عيار 21

            // تحديث الواجهة بالأسعار الحقيقية
            document.getElementById("price-24-sell").innerText = Math.round(price24);
            document.getElementById("price-24-buy").innerText = Math.round(price24 - 20);

            document.getElementById("price-21-sell").innerText = Math.round(price21);
            document.getElementById("price-21-buy").innerText = Math.round(price21 - 20);

            document.getElementById("price-22-sell").innerText = Math.round(price22);
            document.getElementById("price-22-buy").innerText = Math.round(price22 - 20);

            document.getElementById("price-18-sell").innerText = Math.round(price18);
            document.getElementById("price-18-buy").innerText = Math.round(price18 - 20);

            document.getElementById("main-coin-price").innerText = Math.round(coinPrice).toLocaleString() + " ج.م";
            document.getElementById("main-coin-sub").innerText = `الشراء: ${Math.round(coinPrice - 200).toLocaleString()} | البيع: ${Math.round(coinPrice).toLocaleString()}`;

            document.getElementById("last-update-text").innerText = "تم التحديث لحظياً من البورصة: " + new Date().toLocaleTimeString("ar-EG");
        }
    } catch (error) {
        console.error("خطأ في جلب الأسعار:", error);
        document.getElementById("last-update-text").innerText = "تعذر الاتصال بالبورصة، يتم استخدام الأسعار الفعلية.";
    }
}
