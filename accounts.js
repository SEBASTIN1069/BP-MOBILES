// =====================================================================
// Total Accounts page — admin-only, read-only view of the "customers"
// collection (created by the public site's signup form in script.js).
// This file never writes, updates, or deletes any customer document —
// it only reads and displays.
// =====================================================================

const checkingAuth = document.getElementById("checkingAuth");
const accountsPage = document.getElementById("accountsPage");
const backBtn = document.getElementById("backBtn");
const accountsCount = document.getElementById("accountsCount");
const accountsSearchInput = document.getElementById("accountsSearchInput");
const accountsTableBody = document.querySelector("#accountsTable tbody");
const accountsPagination = document.getElementById("accountsPagination");

// ---- Admin-only guard: bounce to the admin login if not signed in ----
auth.onAuthStateChanged((user) => {
  if (user) {
    checkingAuth.hidden = true;
    accountsPage.hidden = false;
    loadAccounts();
  } else {
    window.location.href = "admin.html";
  }
});

// Goes back exactly one step in browser history — wherever the admin
// came from (admin.html dashboard, most likely) — rather than a fixed link.
backBtn.addEventListener("click", () => {
  history.back();
});

// ---- Load + render (paginated, searchable) ----
const PAGE_SIZE = 10;
let allCustomers = [];
let currentPage = 1;
let searchQuery = "";

function loadAccounts() {
  db.collection("customers").onSnapshot((snap) => {
    allCustomers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    accountsCount.textContent = allCustomers.length;
    renderAccountsPage();
  }, () => {
    accountsCount.textContent = "!";
    accountsTableBody.innerHTML = `<tr><td colspan="3">Couldn't load accounts.</td></tr>`;
  });
}

accountsSearchInput.addEventListener("input", () => {
  searchQuery = accountsSearchInput.value.trim().toLowerCase();
  currentPage = 1;
  renderAccountsPage();
});

function renderAccountsPage() {
  const filtered = searchQuery
    ? allCustomers.filter((c) =>
        (c.name || "").toLowerCase().includes(searchQuery) ||
        (c.mobile || c.id).includes(searchQuery) ||
        (c.deviceModel || "").toLowerCase().includes(searchQuery))
    : allCustomers;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  if (filtered.length === 0) {
    accountsTableBody.innerHTML = `<tr><td colspan="3">${searchQuery ? "No matching accounts." : "No accounts created yet."}</td></tr>`;
    accountsPagination.innerHTML = "";
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  accountsTableBody.innerHTML = pageItems.map((c) => `
    <tr>
      <td>${c.name || "—"}</td>
      <td>${c.mobile || c.id}</td>
      <td>${c.deviceModel || "—"}</td>
    </tr>
  `).join("");

  renderPagination(filtered.length);
}

function renderPagination(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (totalPages <= 1) {
    accountsPagination.innerHTML = "";
    return;
  }
  let html = `<button type="button" class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹ Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button type="button" class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Next ›</button>`;
  accountsPagination.innerHTML = html;
  accountsPagination.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      currentPage = Number(btn.dataset.page);
      renderAccountsPage();
    });
  });
}
