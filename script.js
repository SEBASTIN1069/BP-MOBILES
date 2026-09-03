// =====================================================================
// Product & accessory data now live in Firebase (Firestore + Storage),
// not in this file. Only the shop owner can add/edit/delete them, via
// admin.html (protected by Firebase login). Customers only ever READ
// this data — same idea as browsing Flipkart/Amazon.
//
// Collections used:
//   products     — one document per phone   (see admin.js for fields)
//   accessories  — one document per accessory
// =====================================================================

// ===== Helpers =====
function formatPrice(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function productCard(p) {
  const stockLabel = p.stock === "in" ? "In stock" : "Only 2 left";
  const conditionBadge = p.condition === "Second-hand"
    ? `<span class="condition-badge">Second-hand</span>` : "";
  return `
    <a href="product.html?id=${p.id}" class="product-card" data-brand="${p.brand}" data-price="${p.price}" data-name="${p.name.toLowerCase()}" data-condition="${p.condition}">
      <div class="product-thumb ${p.images && p.images[0] ? "" : "empty"}">
        ${p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy">` : `<span>${p.brand}</span>`}
      </div>
      <div class="product-top">
        <span class="product-brand">${p.brand}</span>
        ${conditionBadge}
      </div>
      <h3 class="product-name">${p.name}</h3>
      <div class="product-specs">${p.ram} RAM · ${p.storage} · ${p.battery}${p.networkType ? " · " + p.networkType : ""}</div>
      <div class="product-footer">
        <span class="product-price">${formatPrice(p.price)}</span>
        <span class="stock-badge ${p.stock}">${stockLabel}</span>
      </div>
    </a>
  `;
}

function laptopCard(l) {
  const stockLabel = l.stock === "in" ? "In stock" : "Only 2 left";
  const conditionBadge = l.condition === "Second-hand"
    ? `<span class="condition-badge">Second-hand</span>` : "";
  return `
    <a href="laptop.html?id=${l.id}" class="product-card" data-brand="${l.brand}" data-price="${l.price}" data-name="${l.name.toLowerCase()}" data-condition="${l.condition}">
      <div class="product-thumb ${l.images && l.images[0] ? "" : "empty"}">
        ${l.images && l.images[0] ? `<img src="${l.images[0]}" alt="${l.name}" loading="lazy">` : `<span>${l.brand}</span>`}
      </div>
      <div class="product-top">
        <span class="product-brand">${l.brand}</span>
        ${conditionBadge}
      </div>
      <h3 class="product-name">${l.name}</h3>
      <div class="product-specs">${l.processor} · ${l.ram} RAM · ${l.storage}</div>
      <div class="product-footer">
        <span class="product-price">${formatPrice(l.price)}</span>
        <span class="stock-badge ${l.stock}">${stockLabel}</span>
      </div>
    </a>
  `;
}

function accessoryCard(a) {
  const firstImg = (a.images && a.images[0]) || a.image || null;
  const thumb = firstImg
    ? `<img src="${firstImg}" alt="${a.name}" loading="lazy">`
    : `<span class="accessory-icon">${a.icon || "🎧"}</span>`;
  return `
    <a href="accessory.html?id=${a.id}" class="accessory-card">
      ${thumb}
      <span class="accessory-category">${a.category}</span>
      <h3 class="accessory-name">${a.name}</h3>
      <span class="accessory-price">${formatPrice(a.price)}</span>
    </a>
  `;
}

function loadingHTML(label) {
  return `<p class="data-status">${label || "Loading…"}</p>`;
}

function errorHTML(label) {
  return `<p class="data-status data-status-error">${label || "Couldn't load data — check your connection and refresh."}</p>`;
}

// ===== Firestore fetchers =====
// Cached per page-load so pages that need the list more than once
// (e.g. products.html for filtering) don't re-fetch on every keystroke.
let _phonesCache = null;
let _accessoriesCache = null;
let _laptopsCache = null;

async function fetchPhones() {
  if (_phonesCache) return _phonesCache;
  const snap = await db.collection("products").orderBy("createdAt", "desc").get();
  _phonesCache = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return _phonesCache;
}

async function fetchLaptops() {
  if (_laptopsCache) return _laptopsCache;
  const snap = await db.collection("laptops").orderBy("createdAt", "desc").get();
  _laptopsCache = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return _laptopsCache;
}

async function fetchAccessories() {
  if (_accessoriesCache) return _accessoriesCache;
  const snap = await db.collection("accessories").orderBy("createdAt", "desc").get();
  _accessoriesCache = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return _accessoriesCache;
}

// ===== Render: trending + second-hand on homepage =====
const trendingGrid = document.getElementById("trendingGrid");
const secondHandGrid = document.getElementById("secondHandGrid");
if (trendingGrid || secondHandGrid) {
  if (trendingGrid) trendingGrid.innerHTML = loadingHTML("Loading trending phones…");
  if (secondHandGrid) secondHandGrid.innerHTML = loadingHTML("Loading second-hand phones…");

  fetchPhones().then((phones) => {
    if (trendingGrid) {
      const trending = phones.filter((p) => p.condition === "New").slice(0, 4);
      trendingGrid.innerHTML = trending.length ? trending.map(productCard).join("") : `<p class="data-status">No phones added yet.</p>`;
    }
    if (secondHandGrid) {
      const secondHand = phones.filter((p) => p.condition === "Second-hand").slice(0, 4);
      secondHandGrid.innerHTML = secondHand.length ? secondHand.map(productCard).join("") : `<p class="data-status">No second-hand phones added yet.</p>`;
    }
  }).catch(() => {
    if (trendingGrid) trendingGrid.innerHTML = errorHTML();
    if (secondHandGrid) secondHandGrid.innerHTML = errorHTML();
  });
}

// ===== Render: trending laptops on homepage =====
const trendingLaptopsGrid = document.getElementById("trendingLaptopsGrid");
if (trendingLaptopsGrid) {
  trendingLaptopsGrid.innerHTML = loadingHTML("Loading laptops…");
  fetchLaptops().then((laptops) => {
    const trending = laptops.slice(0, 4);
    trendingLaptopsGrid.innerHTML = trending.length ? trending.map(laptopCard).join("") : `<p class="data-status">No laptops added yet.</p>`;
  }).catch(() => { trendingLaptopsGrid.innerHTML = errorHTML(); });
}

// ===== Render: accessories on homepage (preview) =====
const accessoryGrid = document.getElementById("accessoryGrid");
if (accessoryGrid) {
  accessoryGrid.innerHTML = loadingHTML("Loading accessories…");
  fetchAccessories().then((accessories) => {
    const preview = accessories.slice(0, 4);
    accessoryGrid.innerHTML = preview.length ? preview.map(accessoryCard).join("") : `<p class="data-status">No accessories added yet.</p>`;
  }).catch(() => { accessoryGrid.innerHTML = errorHTML(); });
}

// ===== Categorize an accessory into a section =====
// Matches loosely on keywords in BOTH the "category" and "name" fields,
// so the shop owner can type the type either place (e.g. Category:
// "Charger" or just Name: "33W Fast Charger") and it still lands in
// the right section here. Anything that doesn't match a known keyword
// falls into "other".
function accessorySectionFor(a) {
  const text = ((a.category || "") + " " + (a.name || "")).toLowerCase();
  if (text.includes("airbud") || text.includes("earbud") || text.includes("earphone") || text.includes("headphone") || text.includes("neckband") || text.includes("neck band") || text.includes("bud")) {
    return "airbuds";
  }
  if (text.includes("charger") || text.includes("charging") || text.includes("cable") || text.includes("adapter")) {
    return "charger";
  }
  if (text.includes("cover") || text.includes("case") || text.includes("tempered") || text.includes("temper") || text.includes("glass") || text.includes("screen guard") || text.includes("screenguard")) {
    return "cover";
  }
  if (text.includes("speaker") || text.includes("bluetooth speaker") || text.includes("bt speaker") || text.includes("soundbar") || text.includes("sound bar")) {
    return "speaker";
  }
  return "other";
}

// ===== Render + filter: accessories on products page (grouped by category) =====
const airbudsBlock = document.getElementById("airbudsBlock");
if (airbudsBlock) {
  const chargerBlock = document.getElementById("chargerBlock");
  const coverBlock = document.getElementById("coverBlock");
  const speakerBlock = document.getElementById("speakerBlock");
  const otherAccessoryBlock = document.getElementById("otherAccessoryBlock");
  const accessoryEmptyState = document.getElementById("accessoryEmptyState");
  const accessorySearchInput = document.getElementById("accessorySearchInput");

  const accessoryGridAirbuds = document.getElementById("accessoryGridAirbuds");
  const accessoryGridCharger = document.getElementById("accessoryGridCharger");
  const accessoryGridCover = document.getElementById("accessoryGridCover");
  const accessoryGridSpeaker = document.getElementById("accessoryGridSpeaker");
  const accessoryGridOther = document.getElementById("accessoryGridOther");

  accessoryGridOther.innerHTML = loadingHTML("Loading accessories…");

  // Splits the search text into words so "redmi note 12 5g cover" matches
  // an accessory named "Redmi Note 12 5G Back Cover" even though the
  // words aren't in the exact same order or adjacent.
  function matchesAccessorySearch(a, query) {
    if (!query) return true;
    const haystack = ((a.category || "") + " " + (a.name || "")).toLowerCase();
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return words.every((w) => haystack.includes(w));
  }

  function renderAccessorySections(allAccessories) {
    const query = accessorySearchInput.value.trim();
    const filtered = allAccessories.filter((a) => matchesAccessorySearch(a, query));

    const grouped = { airbuds: [], charger: [], cover: [], speaker: [], other: [] };
    filtered.forEach((a) => grouped[accessorySectionFor(a)].push(a));

    airbudsBlock.hidden = grouped.airbuds.length === 0;
    accessoryGridAirbuds.innerHTML = grouped.airbuds.map(accessoryCard).join("");

    chargerBlock.hidden = grouped.charger.length === 0;
    accessoryGridCharger.innerHTML = grouped.charger.map(accessoryCard).join("");

    coverBlock.hidden = grouped.cover.length === 0;
    accessoryGridCover.innerHTML = grouped.cover.map(accessoryCard).join("");

    speakerBlock.hidden = grouped.speaker.length === 0;
    accessoryGridSpeaker.innerHTML = grouped.speaker.map(accessoryCard).join("");

    otherAccessoryBlock.hidden = grouped.other.length === 0;
    accessoryGridOther.innerHTML = grouped.other.map(accessoryCard).join("");

    accessoryEmptyState.hidden = filtered.length !== 0;
  }

  fetchAccessories().then((accessories) => {
    renderAccessorySections(accessories);
    accessorySearchInput.addEventListener("input", () => renderAccessorySections(accessories));
  }).catch(() => {
    accessoryGridOther.innerHTML = errorHTML();
    otherAccessoryBlock.hidden = false;
  });
}

// ===== Render + filter: products page =====
const productGrid = document.getElementById("productGrid");
if (productGrid) {
  const searchInput = document.getElementById("searchInput");
  const brandFilter = document.getElementById("brandFilter");
  const priceFilter = document.getElementById("priceFilter");
  const conditionFilter = document.getElementById("conditionFilter");
  const networkFilter = document.getElementById("networkFilter");
  const emptyState = document.getElementById("emptyState");

  productGrid.innerHTML = loadingHTML("Loading phones…");

  function renderProducts(allPhones) {
    const query = searchInput.value.trim().toLowerCase();
    const brand = brandFilter.value;
    const priceRange = priceFilter.value;
    const condition = conditionFilter.value;
    const network = networkFilter.value;

    let filtered = allPhones.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query);
      const matchesBrand = brand === "all" || p.brand === brand;
      const matchesCondition = condition === "all" || p.condition === condition;
      const matchesNetwork = network === "all" || p.networkType === network;
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = p.price >= min && p.price <= max;
      }
      return matchesQuery && matchesBrand && matchesPrice && matchesCondition && matchesNetwork;
    });

    productGrid.innerHTML = filtered.map(productCard).join("");
    emptyState.hidden = filtered.length !== 0;
  }

  fetchPhones().then((phones) => {
    renderProducts(phones);
    searchInput.addEventListener("input", () => renderProducts(phones));
    brandFilter.addEventListener("change", () => renderProducts(phones));
    priceFilter.addEventListener("change", () => renderProducts(phones));
    conditionFilter.addEventListener("change", () => renderProducts(phones));
    networkFilter.addEventListener("change", () => renderProducts(phones));
  }).catch(() => { productGrid.innerHTML = errorHTML(); });
}

// ===== Render + filter: laptops page =====
const laptopGrid = document.getElementById("laptopGrid");
if (laptopGrid) {
  const laptopSearchInput = document.getElementById("laptopSearchInput");
  const laptopBrandFilter = document.getElementById("laptopBrandFilter");
  const laptopPriceFilter = document.getElementById("laptopPriceFilter");
  const laptopConditionFilter = document.getElementById("laptopConditionFilter");
  const laptopEmptyState = document.getElementById("laptopEmptyState");

  laptopGrid.innerHTML = loadingHTML("Loading laptops…");

  function renderLaptops(allLaptops) {
    const query = laptopSearchInput.value.trim().toLowerCase();
    const brand = laptopBrandFilter.value;
    const priceRange = laptopPriceFilter.value;
    const condition = laptopConditionFilter.value;

    let filtered = allLaptops.filter((l) => {
      const matchesQuery = l.name.toLowerCase().includes(query);
      const matchesBrand = brand === "all" || l.brand === brand;
      const matchesCondition = condition === "all" || l.condition === condition;
      let matchesPrice = true;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        matchesPrice = l.price >= min && l.price <= max;
      }
      return matchesQuery && matchesBrand && matchesPrice && matchesCondition;
    });

    laptopGrid.innerHTML = filtered.map(laptopCard).join("");
    laptopEmptyState.hidden = filtered.length !== 0;
  }

  fetchLaptops().then((laptops) => {
    renderLaptops(laptops);
    laptopSearchInput.addEventListener("input", () => renderLaptops(laptops));
    laptopBrandFilter.addEventListener("change", () => renderLaptops(laptops));
    laptopPriceFilter.addEventListener("change", () => renderLaptops(laptops));
    laptopConditionFilter.addEventListener("change", () => renderLaptops(laptops));
  }).catch(() => { laptopGrid.innerHTML = errorHTML(); });
}

// ===== Mobile nav toggle =====
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    navToggle.textContent = mainNav.classList.contains("open") ? "✕" : "☰";
  });
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.textContent = "☰";
    });
  });
}

// ===== Contact form → sends enquiry straight to WhatsApp =====
const SHOP_WHATSAPP_NUMBER = "919363510957"; // country code + number, no + or spaces

const contactForm = document.getElementById("contactForm");
if (contactForm) {
  const formStatus = document.getElementById("formStatus");

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = contactForm.name.value.trim();
    const phone = contactForm.phone.value.trim();
    const reason = contactForm.reason.value;
    const message = contactForm.message.value.trim();

    const lines = [
      `Hi BP Mobiles Hub, I'm ${name}.`,
      `Reason: ${reason}`,
      `My number: ${phone}`,
    ];
    if (message) lines.push(`Message: ${message}`);

    const waText = encodeURIComponent(lines.join("\n"));
    const waLink = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${waText}`;

    formStatus.hidden = false;
    window.open(waLink, "_blank");
    contactForm.reset();
  });
}

// =====================================================================
// Login / Create Account system
//
// Accounts now live in Firestore (collection "customers", one document
// per mobile number) instead of localStorage. This is what actually
// fixes "my account disappeared after closing the browser" — before,
// the account itself only ever existed inside that one browser's
// storage, so clearing site data, using a private window, or opening
// the site on another device/browser genuinely had no account to find.
// Now the account is saved centrally, so logging back in from anywhere
// works as long as the mobile number + password match.
//
// localStorage is still used, but only to remember WHICH mobile number
// is currently logged in on this device/browser (the session) — not
// the account itself. Losing that just logs the device out; it can log
// back in immediately since the account still exists in Firestore.
//
// NOTE — this reuses the same trust model the original prototype had:
// there's still no real backend validating anything, so the Firestore
// rule for "customers" is open (read/write: if true) and password
// hashes could technically be read by anyone who looks. That's an
// unavoidable trade-off without adding a real backend (e.g. Cloud
// Functions), and matches the security level the browser-only version
// already had — it's just shared now instead of per-browser.
// =====================================================================
const CUSTOMERS_COLLECTION = "customers";
const SESSION_KEY = "bp_session";

async function findCustomer(mobile) {
  const doc = await db.collection(CUSTOMERS_COLLECTION).doc(mobile).get();
  return doc.exists ? doc.data() : null;
}

async function saveCustomer(mobile, data) {
  await db.collection(CUSTOMERS_COLLECTION).doc(mobile).set(data, { merge: true });
}

// One-way hash so we never store the plain password.
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getCurrentUser() {
  const mobile = localStorage.getItem(SESSION_KEY);
  if (!mobile) return null;
  return await findCustomer(mobile);
}

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "account.html";
}

// =====================================================================
// Page guard — website ku login pannathavanga inside pages ku poga
// mudiyathu. Login illama edhavadhu page open panna, account.html ku
// automatic redirect aagum. account.html mattum ellarukum open.
// admin.html has its own separate Firebase-based guard (see admin.js).
//
// This now needs a Firestore read to check the session, so the page
// stays hidden until that check finishes (avoids flashing protected
// content before a redirect can happen).
// =====================================================================
const PUBLIC_PAGES = ["account.html"];
document.body.style.visibility = "hidden";

// Keeps the header "Login" / "Hi, Name" link in sync.
function updateAccountLink(user) {
  const link = document.getElementById("accountLink");
  if (!link) return;
  link.textContent = user ? `👤 Hi, ${user.name.split(" ")[0]}` : "👤 Login";
}

// ===== Render: account page (login / create account) =====
const authSection = document.getElementById("authSection");

function renderAuthPage(user) {
  if (!authSection) return;

  if (user) {
    authSection.innerHTML = `
      <div class="auth-card auth-profile">
        <h1>Hi, ${user.name} 👋</h1>
        <p class="auth-sub">You're logged in with ${user.mobile}.</p>
        <button type="button" class="btn btn-ghost" id="logoutBtn">Log out</button>
      </div>
    `;
    document.getElementById("logoutBtn").addEventListener("click", logoutUser);
    return;
  }

  authSection.innerHTML = `
    <div class="auth-card">
      <div class="auth-tabs">
        <button type="button" class="auth-tab active" data-tab="login">Login</button>
        <button type="button" class="auth-tab" data-tab="signup">Create Account</button>
      </div>

      <form class="auth-form" id="loginForm">
        <label>Mobile number
          <input type="tel" name="mobile" placeholder="10-digit mobile number" required>
        </label>
        <label>Password
          <input type="password" name="password" required>
        </label>
        <p class="auth-error" id="loginError" hidden></p>
        <button type="submit" class="btn btn-primary">Login</button>
        <p class="auth-forgot"><button type="button" class="auth-link-btn" id="forgotPasswordBtn">Forgot password?</button></p>
      </form>

      <div class="auth-forgot-flow" id="forgotFlow" hidden>
        <button type="button" class="auth-link-btn" id="backToLoginBtn">← Back to login</button>

        <form class="auth-form" id="forgotMobileForm">
          <h2>Forgot password</h2>
          <label>Mobile number
            <input type="tel" name="mobile" placeholder="10-digit mobile number" required>
          </label>
          <p class="auth-error" id="forgotMobileError" hidden></p>
          <button type="submit" class="btn btn-primary">Send OTP</button>
        </form>

        <form class="auth-form" id="forgotOtpForm" hidden>
          <h2>Enter OTP</h2>
          <p class="otp-demo-note" id="otpDemoNote"></p>
          <label>OTP
            <input type="text" name="otp" inputmode="numeric" maxlength="4" placeholder="4-digit OTP" required>
          </label>
          <p class="auth-error" id="forgotOtpError" hidden></p>
          <button type="submit" class="btn btn-primary">Verify OTP</button>
        </form>

        <form class="auth-form" id="forgotResetForm" hidden>
          <h2>Set new password</h2>
          <label>New password
            <input type="password" name="password" required>
          </label>
          <label>Confirm new password
            <input type="password" name="confirmPassword" required>
          </label>
          <p class="auth-error" id="forgotResetError" hidden></p>
          <button type="submit" class="btn btn-primary">Reset password</button>
        </form>
      </div>

      <form class="auth-form" id="signupForm" hidden>
        <label>Name
          <input type="text" name="name" required>
        </label>
        <label>Mobile number
          <input type="tel" name="mobile" placeholder="10-digit mobile number" required>
        </label>
        <label>Your Mobile Model
          <input type="text" name="deviceModel" placeholder="e.g. Redmi Note 12 5G" required>
        </label>
        <label>Password
          <input type="password" name="password" required>
        </label>
        <label>Confirm password
          <input type="password" name="confirmPassword" required>
        </label>
        <p class="auth-error" id="signupError" hidden></p>
        <button type="submit" class="btn btn-primary">Create Account</button>
      </form>

      <p class="auth-note">Your account is saved to the shop's database — logging in works from any device.</p>
    </div>
  `;

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabs = authSection.querySelectorAll(".auth-tab");
  const authTabsWrap = authSection.querySelector(".auth-tabs");

  // ---- Forgot password flow ----
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const forgotFlow = document.getElementById("forgotFlow");
  const forgotMobileForm = document.getElementById("forgotMobileForm");
  const forgotOtpForm = document.getElementById("forgotOtpForm");
  const forgotResetForm = document.getElementById("forgotResetForm");
  const otpDemoNote = document.getElementById("otpDemoNote");

  let resetState = { mobile: null, otp: null };

  function showForgotStep(step) {
    forgotMobileForm.hidden = step !== "mobile";
    forgotOtpForm.hidden = step !== "otp";
    forgotResetForm.hidden = step !== "reset";
  }

  function openForgotFlow() {
    resetState = { mobile: null, otp: null };
    showForgotStep("mobile");
    forgotMobileForm.reset();
    forgotOtpForm.reset();
    forgotResetForm.reset();
    document.getElementById("forgotMobileError").hidden = true;
    document.getElementById("forgotOtpError").hidden = true;
    document.getElementById("forgotResetError").hidden = true;
    authTabsWrap.hidden = true;
    loginForm.hidden = true;
    signupForm.hidden = true;
    forgotFlow.hidden = false;
  }

  function closeForgotFlow() {
    forgotFlow.hidden = true;
    authTabsWrap.hidden = false;
    tabs.forEach((t) => t.classList.remove("active"));
    authSection.querySelector('.auth-tab[data-tab="login"]').classList.add("active");
    loginForm.hidden = false;
    signupForm.hidden = true;
  }

  forgotPasswordBtn.addEventListener("click", openForgotFlow);
  backToLoginBtn.addEventListener("click", closeForgotFlow);

  forgotMobileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("forgotMobileError");
    errorEl.hidden = true;

    const mobile = forgotMobileForm.mobile.value.trim();
    const user = await findCustomer(mobile);
    if (!user) {
      errorEl.textContent = "No account found with this mobile number.";
      errorEl.hidden = false;
      return;
    }

    // No SMS gateway is connected yet, so the OTP is generated and shown
    // right here instead of being texted. Once an SMS API is wired up,
    // swap this block to actually send it.
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    resetState = { mobile, otp };
    otpDemoNote.textContent = `Demo mode — SMS isn't connected yet, so here's your OTP: ${otp}`;

    showForgotStep("otp");
  });

  forgotOtpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("forgotOtpError");
    errorEl.hidden = true;

    const entered = forgotOtpForm.otp.value.trim();
    if (entered !== resetState.otp) {
      errorEl.textContent = "That OTP doesn't match — check and try again.";
      errorEl.hidden = false;
      return;
    }

    showForgotStep("reset");
  });

  forgotResetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("forgotResetError");
    errorEl.hidden = true;

    const password = forgotResetForm.password.value;
    const confirmPassword = forgotResetForm.confirmPassword.value;

    if (password.length < 4) {
      errorEl.textContent = "Password should be at least 4 characters.";
      errorEl.hidden = false;
      return;
    }
    if (password !== confirmPassword) {
      errorEl.textContent = "Passwords don't match.";
      errorEl.hidden = false;
      return;
    }

    const passwordHash = await hashPassword(password);
    await saveCustomer(resetState.mobile, { passwordHash });

    closeForgotFlow();
    loginForm.mobile.value = resetState.mobile;
    loginForm.password.value = "";
    const loginErrorEl = document.getElementById("loginError");
    loginErrorEl.textContent = "Password updated — enter it below to log in.";
    loginErrorEl.style.color = "var(--success)";
    loginErrorEl.style.background = "transparent";
    loginErrorEl.style.border = "none";
    loginErrorEl.hidden = false;
    loginForm.password.focus();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const showLogin = tab.dataset.tab === "login";
      loginForm.hidden = !showLogin;
      signupForm.hidden = showLogin;
    });
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("loginError");
    errorEl.style.color = "";
    errorEl.style.background = "";
    errorEl.style.border = "";
    errorEl.hidden = true;
    const submitBtn = loginForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    const mobile = loginForm.mobile.value.trim();
    const password = loginForm.password.value;

    try {
      const user = await findCustomer(mobile);
      const hashed = await hashPassword(password);

      if (!user || user.passwordHash !== hashed) {
        errorEl.textContent = "Mobile number or password is incorrect.";
        errorEl.hidden = false;
        submitBtn.disabled = false;
        return;
      }

      localStorage.setItem(SESSION_KEY, mobile);
      window.location.href = "index.html";
    } catch (err) {
      errorEl.textContent = "Something went wrong — " + err.message;
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("signupError");
    errorEl.hidden = true;

    const name = signupForm.name.value.trim();
    const mobile = signupForm.mobile.value.trim();
    const deviceModel = signupForm.deviceModel.value.trim();
    const password = signupForm.password.value;
    const confirmPassword = signupForm.confirmPassword.value;

    if (!/^\d{10}$/.test(mobile)) {
      errorEl.textContent = "Enter a valid 10-digit mobile number.";
      errorEl.hidden = false;
      return;
    }
    if (password.length < 4) {
      errorEl.textContent = "Password should be at least 4 characters.";
      errorEl.hidden = false;
      return;
    }
    if (password !== confirmPassword) {
      errorEl.textContent = "Passwords don't match.";
      errorEl.hidden = false;
      return;
    }

    const submitBtn = signupForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    try {
      const existing = await findCustomer(mobile);
      if (existing) {
        errorEl.textContent = "An account with this mobile number already exists — try logging in.";
        errorEl.hidden = false;
        submitBtn.disabled = false;
        return;
      }

      const passwordHash = await hashPassword(password);
      await saveCustomer(mobile, { name, mobile, deviceModel, passwordHash });
      localStorage.setItem(SESSION_KEY, mobile);

      window.location.href = "index.html";
    } catch (err) {
      errorEl.textContent = "Something went wrong — " + err.message;
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });
}

// ===== Run the page guard, then reveal the page =====
(async function bootstrapAuth() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isPublic = PUBLIC_PAGES.includes(currentPage);
  const user = await getCurrentUser();

  if (!isPublic && !user) {
    window.location.href = "account.html";
    return;
  }

  document.body.style.visibility = "visible";
  updateAccountLink(user);
  renderAuthPage(user);
})();

// ===== Render: product detail page =====
const productDetail = document.getElementById("productDetail");
if (productDetail) {
  productDetail.innerHTML = loadingHTML("Loading phone details…");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  db.collection("products").doc(id).get().then((doc) => {
    if (!doc.exists) {
      productDetail.innerHTML = `
        <div class="detail-not-found">
          <h1>Phone not found</h1>
          <p>That listing may have been sold or removed.</p>
          <a href="products.html" class="btn btn-primary">Back to all phones</a>
        </div>
      `;
      return;
    }

    const phone = { id: doc.id, ...doc.data() };
    document.title = `${phone.name} — BP Mobiles Hub`;
    const stockLabel = phone.stock === "in" ? "In stock" : "Only 2 left — hurry!";
    const conditionBadge = phone.condition === "Second-hand"
      ? `<span class="condition-badge">Second-hand</span>` : `<span class="condition-badge new">New</span>`;

    const waMsg = encodeURIComponent(
      `Hi BP Mobiles Hub, I'm interested in the ${phone.name} (${formatPrice(phone.price)}). Is it still available?`
    );
    const waLink = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${waMsg}`;

    const hasImages = Array.isArray(phone.images) && phone.images.length > 0;

    const visualHTML = hasImages
      ? `
        <div class="detail-gallery">
          <div class="detail-main-image">
            <img id="detailMainImg" src="${phone.images[0]}" alt="${phone.name}">
          </div>
          ${phone.images.length > 1 ? `
            <div class="detail-thumbs">
              ${phone.images.map((src, i) => `
                <button type="button" class="detail-thumb ${i === 0 ? "active" : ""}" data-src="${src}">
                  <img src="${src}" alt="${phone.name} photo ${i + 1}">
                </button>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `
      : `
        <div class="detail-main-image empty">
          <span class="no-photo-label">Photo coming soon</span>
        </div>
      `;

    productDetail.innerHTML = `
      <a href="products.html" class="back-link">← Back to all phones</a>
      <div class="product-detail-grid">
        ${visualHTML}
        <div class="detail-info">
          <div class="detail-top">
            <span class="product-brand">${phone.brand}</span>
            ${conditionBadge}
          </div>
          <h1 class="detail-name">${phone.name}</h1>
          <div class="detail-price-row">
            <span class="detail-price">${formatPrice(phone.price)}</span>
            <span class="stock-badge ${phone.stock}">${stockLabel}</span>
          </div>

          <div class="detail-spec-table">
            <div class="detail-spec-row"><span>RAM</span><span>${phone.ram}</span></div>
            <div class="detail-spec-row"><span>Storage</span><span>${phone.storage}</span></div>
            <div class="detail-spec-row"><span>Battery</span><span>${phone.battery}</span></div>
            <div class="detail-spec-row"><span>Condition</span><span>${phone.condition}</span></div>
          </div>

          ${phone.description ? `
            <div class="detail-description">
              <h2>About this phone</h2>
              <p>${escapeHTML(phone.description).replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}

          <div class="detail-actions">
            <a href="${waLink}" target="_blank" class="btn btn-primary">Enquire on WhatsApp</a>
            <a href="tel:+919363510957" class="btn btn-ghost">Call Shop</a>
          </div>
          <p class="detail-note">* Second-hand units are checked and certified before sale. All repairs and phones carry warranty as stated at purchase.</p>
        </div>
      </div>
    `;

    // Thumbnail click → swap main image
    if (hasImages && phone.images.length > 1) {
      const mainImg = document.getElementById("detailMainImg");
      productDetail.querySelectorAll(".detail-thumb").forEach((btn) => {
        btn.addEventListener("click", () => {
          mainImg.src = btn.dataset.src;
          productDetail.querySelectorAll(".detail-thumb").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }
  }).catch(() => {
    productDetail.innerHTML = errorHTML("Couldn't load this phone — check your connection and try again.");
  });
}

// ===== Render: accessory detail page =====
const accessoryDetail = document.getElementById("accessoryDetail");
if (accessoryDetail) {
  accessoryDetail.innerHTML = loadingHTML("Loading accessory details…");

  const accParams = new URLSearchParams(window.location.search);
  const accId = accParams.get("id");

  db.collection("accessories").doc(accId).get().then((doc) => {
    if (!doc.exists) {
      accessoryDetail.innerHTML = `
        <div class="detail-not-found">
          <h1>Accessory not found</h1>
          <p>That item may have been sold or removed.</p>
          <a href="accessories.html" class="btn btn-primary">Back to accessories</a>
        </div>
      `;
      return;
    }

    const accessory = { id: doc.id, ...doc.data() };
    document.title = `${accessory.name} — BP Mobiles Hub`;

    const waMsg = encodeURIComponent(
      `Hi BP Mobiles Hub, I'm interested in the ${accessory.name} (${formatPrice(accessory.price)}). Is it still available?`
    );
    const waLink = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${waMsg}`;

    const hasImages = Array.isArray(accessory.images) && accessory.images.length > 0;

    const visualHTML = hasImages
      ? `
        <div class="detail-gallery">
          <div class="detail-main-image">
            <img id="detailMainImg" src="${accessory.images[0]}" alt="${accessory.name}">
          </div>
          ${accessory.images.length > 1 ? `
            <div class="detail-thumbs">
              ${accessory.images.map((src, i) => `
                <button type="button" class="detail-thumb ${i === 0 ? "active" : ""}" data-src="${src}">
                  <img src="${src}" alt="${accessory.name} photo ${i + 1}">
                </button>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `
      : `
        <div class="detail-main-image empty">
          <span class="no-photo-label">${accessory.icon || "🎧"}</span>
        </div>
      `;

    accessoryDetail.innerHTML = `
      <a href="accessories.html" class="back-link">← Back to accessories</a>
      <div class="product-detail-grid">
        ${visualHTML}
        <div class="detail-info">
          <div class="detail-top">
            <span class="product-brand">${accessory.category}</span>
          </div>
          <h1 class="detail-name">${accessory.name}</h1>
          <div class="detail-price-row">
            <span class="detail-price">${formatPrice(accessory.price)}</span>
          </div>

          <div class="detail-actions">
            <a href="${waLink}" target="_blank" class="btn btn-primary">Enquire on WhatsApp</a>
            <a href="tel:+919363510957" class="btn btn-ghost">Call Shop</a>
          </div>
          <p class="detail-note">* Genuine, quality-checked accessories — ask us in-store for compatibility with your phone model.</p>
        </div>
      </div>
    `;

    // Thumbnail click → swap main image
    if (hasImages && accessory.images.length > 1) {
      const mainImg = document.getElementById("detailMainImg");
      accessoryDetail.querySelectorAll(".detail-thumb").forEach((btn) => {
        btn.addEventListener("click", () => {
          mainImg.src = btn.dataset.src;
          accessoryDetail.querySelectorAll(".detail-thumb").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }
  }).catch(() => {
    accessoryDetail.innerHTML = errorHTML("Couldn't load this accessory — check your connection and try again.");
  });
}

// ===== Render: laptop detail page =====
const laptopDetail = document.getElementById("laptopDetail");
if (laptopDetail) {
  laptopDetail.innerHTML = loadingHTML("Loading laptop details…");

  const laptopParams = new URLSearchParams(window.location.search);
  const laptopId = laptopParams.get("id");

  db.collection("laptops").doc(laptopId).get().then((doc) => {
    if (!doc.exists) {
      laptopDetail.innerHTML = `
        <div class="detail-not-found">
          <h1>Laptop not found</h1>
          <p>That item may have been sold or removed.</p>
          <a href="laptops.html" class="btn btn-primary">Back to all laptops</a>
        </div>
      `;
      return;
    }

    const laptop = { id: doc.id, ...doc.data() };
    document.title = `${laptop.name} — BP Mobiles Hub`;
    const stockLabel = laptop.stock === "in" ? "In stock" : "Only 2 left — hurry!";
    const conditionBadge = laptop.condition === "Second-hand"
      ? `<span class="condition-badge">Second-hand</span>` : `<span class="condition-badge new">New</span>`;

    const waMsg = encodeURIComponent(
      `Hi BP Mobiles Hub, I'm interested in the ${laptop.name} (${formatPrice(laptop.price)}). Is it still available?`
    );
    const waLink = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${waMsg}`;

    const hasImages = Array.isArray(laptop.images) && laptop.images.length > 0;

    const visualHTML = hasImages
      ? `
        <div class="detail-gallery">
          <div class="detail-main-image">
            <img id="detailMainImg" src="${laptop.images[0]}" alt="${laptop.name}">
          </div>
          ${laptop.images.length > 1 ? `
            <div class="detail-thumbs">
              ${laptop.images.map((src, i) => `
                <button type="button" class="detail-thumb ${i === 0 ? "active" : ""}" data-src="${src}">
                  <img src="${src}" alt="${laptop.name} photo ${i + 1}">
                </button>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `
      : `
        <div class="detail-main-image empty">
          <span class="no-photo-label">Photo coming soon</span>
        </div>
      `;

    laptopDetail.innerHTML = `
      <a href="laptops.html" class="back-link">← Back to all laptops</a>
      <div class="product-detail-grid">
        ${visualHTML}
        <div class="detail-info">
          <div class="detail-top">
            <span class="product-brand">${laptop.brand}</span>
            ${conditionBadge}
          </div>
          <h1 class="detail-name">${laptop.name}</h1>
          <div class="detail-price-row">
            <span class="detail-price">${formatPrice(laptop.price)}</span>
            <span class="stock-badge ${laptop.stock}">${stockLabel}</span>
          </div>

          <div class="detail-spec-table">
            <div class="detail-spec-row"><span>Processor</span><span>${laptop.processor}</span></div>
            <div class="detail-spec-row"><span>RAM</span><span>${laptop.ram}</span></div>
            <div class="detail-spec-row"><span>Storage</span><span>${laptop.storage}</span></div>
            <div class="detail-spec-row"><span>Screen Size</span><span>${laptop.screen}</span></div>
            <div class="detail-spec-row"><span>Condition</span><span>${laptop.condition}</span></div>
          </div>

          ${laptop.description ? `
            <div class="detail-description">
              <h2>About this laptop</h2>
              <p>${escapeHTML(laptop.description).replace(/\n/g, "<br>")}</p>
            </div>
          ` : ""}

          <div class="detail-actions">
            <a href="${waLink}" target="_blank" class="btn btn-primary">Enquire on WhatsApp</a>
            <a href="tel:+919363510957" class="btn btn-ghost">Call Shop</a>
          </div>
          <p class="detail-note">* Second-hand units are checked and certified before sale. All repairs and laptops carry warranty as stated at purchase.</p>
        </div>
      </div>
    `;

    // Thumbnail click → swap main image
    if (hasImages && laptop.images.length > 1) {
      const mainImg = document.getElementById("detailMainImg");
      laptopDetail.querySelectorAll(".detail-thumb").forEach((btn) => {
        btn.addEventListener("click", () => {
          mainImg.src = btn.dataset.src;
          laptopDetail.querySelectorAll(".detail-thumb").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }
  }).catch(() => {
    laptopDetail.innerHTML = errorHTML("Couldn't load this laptop — check your connection and try again.");
  });
}
