'use strict';

/**
 * KeyGen SMplus Sign - Main Logic
 */

// ==========================================
// 1. SECURITY & PASSWORD LOGIC
// ==========================================
// Password ពិតគឺ "admin123" (បំលែងជា MD5 រួចហើយ)
const HASHED_PASSWORD = "0192023a7bbd73250516f069df18b500"; 
let failedAttempts = 0;
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME_MS = 120000; // ២ នាទី

// ចងចាំការ Login
if (localStorage.getItem('smplus_logged_in') === 'true') {
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    });
}

function checkPwd() {
    const input = document.getElementById("pwdInput").value;
    const errEl = document.getElementById("pwdErr");
    const btn = document.getElementById("loginBtn");
    
    const inputHash = CryptoJS.MD5(input).toString();

    if (inputHash === HASHED_PASSWORD) {
        errEl.classList.remove("show");
        localStorage.setItem('smplus_logged_in', 'true'); 
        
        document.getElementById("loginOverlay").style.opacity = "0";
        setTimeout(() => {
            document.getElementById("loginOverlay").style.display = "none";
            document.getElementById("mainApp").style.display = "block";
        }, 300);
    } else {
        failedAttempts++;
        document.getElementById("pwdInput").value = "";
        
        if (failedAttempts >= MAX_ATTEMPTS) {
            btn.disabled = true;
            document.getElementById("pwdInput").disabled = true;
            
            let timeLeft = LOCKOUT_TIME_MS / 1000;
            errEl.textContent = `វាយខុសច្រើនដងពេក! សូមរង់ចាំ ${timeLeft} វិនាទី...`;
            errEl.classList.add("show");
            
            const timer = setInterval(() => {
                timeLeft--;
                errEl.textContent = `វាយខុសច្រើនដងពេក! សូមរង់ចាំ ${timeLeft} វិនាទី...`;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    failedAttempts = 0;
                    btn.disabled = false;
                    document.getElementById("pwdInput").disabled = false;
                    errEl.classList.remove("show");
                    document.getElementById("pwdInput").focus();
                }
            }, 1000);
        } else {
            errEl.textContent = `លេខកូដមិនត្រឹមត្រូវ! (ព្យាយាម ${failedAttempts}/${MAX_ATTEMPTS})`;
            errEl.classList.add("show");
        }
    }
}

// ការពារ F12 និង Right Click
document.addEventListener('keydown', function(e) {
    if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) || 
        (e.ctrlKey && e.key.toUpperCase() === 'U')
    ) {
        e.preventDefault();
        return false;
    }
});


// ==========================================
// 2. CORE LOGIC (KEY GENERATION)
// ==========================================
const SECRETS = {
    11:{EU:"NewSupraLooksGreat",NA:"PcnM67n4fvDw",OT:"SKE48",JP:"d5kMnpJKjFuH"},
    12:{EU:"NewYarisGazooIsHot",NA:"aKyFHbQ2RuP6",OT:"SKE48",JP:"F0XE3NbAqBmY"},
    14:{EU:"GRSupra2019IsIconic",NA:"RzLjNAVNLUj2",OT:"SKE48",JP:"gaynyrGps4cA"},
    15:{EU:"YarisGRMNisHere0720",NA:"TxnEJmDGSFFN",OT:"SKE48",JP:"KGnJeyWWX7SQ"},
    16:{EU:"N3wL@ndCru1serGoesHybr1d",NA:"vXmN6XgUQjHM",OT:"SKE48",JP:"6Ix2V3mnktWJ"},
    17:{EU:"GRY4r1sW1nsRally1nK3nya",NA:"eS9VdRGeTMBc",OT:"SKE48",JP:"7Chxc3419YF2"},
    18:{EU:"MyPr1u5isS1ck85365",NA:"JxENR5GakyTw",OT:"SKE48",JP:"SVciaorlleett1118"}
};

const REGIONS = [
    {k:"EU", l:"EU"}, {k:"NA", l:"NA"}, {k:"OT", l:"OT"}, {k:"JP", l:"JP"}
];

const md5 = (s) => CryptoJS.MD5(s).toString();

function getDateStr() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return p(d.getDate()) + p(d.getMonth() + 1) + String(d.getFullYear()).slice(-2) + p(d.getHours()) + p(d.getMinutes());
}

function genCode(hwid, period, region, version) {
    const s = SECRETS[version];
    const ds = getDateStr(), ps = String(period).padStart(4, "0");
    return md5(md5(hwid + version) + s[region] + ps + ds) + ps + ds;
}

function genJP(hwid, period, version) {
    const s = SECRETS[version];
    const ds = getDateStr(), ps = String(period).padStart(4, "0");
    if (version === "11") {
        return md5(md5(hwid + version) + s.JP + ps + ds) + ps + ds;
    }
    const pre = md5(ps + "Japan" + hwid);
    const h = md5(s.JP + ds + pre + version);
    const [l, E, S, g, u, c, _, N, v, R] = ds.split("");
    const [J, m, p, y] = ps.split("");
    const head = h.substring(0, 9);
    return h.substring(9, 21) + _ + N + m + S + g + v + l + E + u + c + p + y + h.substring(21, 27) + R + J + head + h.substring(27, 32);
}


// ==========================================
// 3. UI FUNCTIONS
// ==========================================
function pasteHwid() {
    navigator.clipboard.readText().then(text => {
        document.getElementById("hwid").value = text.trim();
    }).catch(() => {
        alert("មិនអាចអាន Clipboard បានទេ។ សូម Paste ដោយដៃ។");
    });
}

function updateExpiryDate() {
    const days = parseInt(document.getElementById("period").value) || 0;
    const expiryEl = document.getElementById("expiryDate");
    
    if (days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        expiryEl.textContent = d.toLocaleDateString('km-KH', options);
    } else {
        expiryEl.textContent = "--";
    }
}

function generate() {
    const hwid = document.getElementById("hwid").value.trim();
    const period = parseInt(document.getElementById("period").value, 10);
    const version = document.getElementById("versionSelect").value;

    if (!hwid) {
        alert("សូមបញ្ចូល Software ID!");
        return;
    }
    if (isNaN(period) || period < 1 || period > 6000) {
        alert("រយៈពេលត្រូវតែពី 1 ដល់ 6000 ថ្ងៃ!");
        return;
    }

    try {
        const keys = {
            EU: genCode(hwid, period, "EU", version),
            NA: genCode(hwid, period, "NA", version),
            OT: genCode(hwid, period, "OT", version),
            JP: genJP(hwid, period, version)
        };

        const resultEl = document.getElementById("result");
        resultEl.innerHTML = ""; // Clear
        
        REGIONS.forEach(r => {
            const item = document.createElement("div");
            item.className = "key-item";
            
            const regionSpan = document.createElement("span");
            regionSpan.className = "key-region";
            regionSpan.textContent = r.l;
            
            const codeSpan = document.createElement("span");
            codeSpan.className = "key-code";
            codeSpan.textContent = keys[r.k];
            
            const copyBtn = document.createElement("button");
            copyBtn.className = "copy-btn";
            copyBtn.textContent = "Copy";
            copyBtn.onclick = function() { copyText(keys[r.k], this); };
            
            item.appendChild(regionSpan);
            item.appendChild(codeSpan);
            item.appendChild(copyBtn);
            resultEl.appendChild(item);
        });
        
        resultEl.classList.add("show");
    } catch (e) {
        console.error(e);
        alert("មានបញ្ហាក្នុងការបង្កើត Key! សូមពិនិត្យឡើងវិញ។");
    }
}

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = "✓";
        btn.style.background = "#4ade80";
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.background = "";
        }, 1500);
    }).catch(err => {
        console.error("Copy failed", err);
    });
}

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const periodInput = document.getElementById("period");
    if (periodInput) {
        periodInput.addEventListener("input", updateExpiryDate);
    }

    const pwdInput = document.getElementById("pwdInput");
    if (pwdInput) {
        pwdInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !document.getElementById("loginBtn").disabled) {
                checkPwd();
            }
        });
    }

    updateExpiryDate();
});