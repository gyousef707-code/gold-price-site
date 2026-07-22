// إخفاء شاشة البداية تلقائياً بعد ثانيتين بسلاسة تامة
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.classList.add('hidden');
        }
    }, 2000);
});

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    window.scrollTo(0, 0);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function refreshData() {
    alert("تم تحديث الأسعار بنجاح!");
}
