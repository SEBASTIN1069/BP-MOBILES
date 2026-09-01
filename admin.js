// =====================================================================
// Admin panel logic — ONLY the shop owner should ever load admin.html.
// Access is controlled by Firebase Authentication: nobody can add,
// edit, or delete a product/accessory without logging in with the
// admin account created in the Firebase console. Firestore security
// rules (see firestore.rules.txt) enforce this on the server side too
// — this file alone is not the security boundary, the rules are.
//
// Images are uploaded to Cloudinary (free image hosting) instead of
// Firebase Storage — only the resulting image URL is saved to
// Firestore. See the CLOUDINARY_* constants below.
// =====================================================================

// =====================================================================
// PASTE YOUR CLOUDINARY DETAILS HERE
//
// cloudinary.com > Dashboard > "Cloud name" (top of the page)
// cloudinary.com > Settings (gear icon) > Upload tab > Upload presets
//   > Add upload preset > Signing Mode: "Unsigned" > Save > copy the
//   preset name it gives you.
// =====================================================================
const CLOUDINARY_CLOUD_NAME = "mke0ubyi";
const CLOUDINARY_UPLOAD_PRESET = "BP MOBILES HUB";

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("adminLoginForm");
const loginError = document.getElementById("adminLoginError");
const logoutBtn = document.getElementById("adminLogoutBtn");
const adminEmailLabel = document.getElementById("adminEmailLabel");

// ---- Auth state: show login screen or dashboard ----
auth.onAuthStateChanged((user) => {
  if (user) {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    adminEmailLabel.textContent = user.email;
    loadProductsTable();
    loadAccessoriesTable();
    loadLaptopsTable();
  } else {
    loginScreen.hidden = false;
    dashboard.hidden = true;
  }
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  auth.signInWithEmailAndPassword(email, password).catch((err) => {
    loginError.textContent = err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
      ? "Email or password is incorrect."
      : "Login failed — " + err.message;
    loginError.hidden = false;
  });
});

logoutBtn.addEventListener("click", () => auth.signOut());

// ---- Admin tabs: Phones / Accessories / Laptops ----
const adminTabs = document.querySelectorAll(".admin-tab");
const adminBlocks = {
  phonesBlock: document.getElementById("phonesBlock"),
  accessoriesBlock: document.getElementById("accessoriesBlock"),
  laptopsBlock: document.getElementById("laptopsBlock"),
};

adminTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    adminTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    Object.keys(adminBlocks).forEach((id) => {
      adminBlocks[id].hidden = id !== tab.dataset.tab;
    });
  });
});

// ---- Helpers ----
function formatPriceAdmin(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// Shows 10 rows per page in admin tables. Renders "‹ Prev  1 2 3  Next ›"
// controls into the given container and wires up page-change clicks.
const ADMIN_PAGE_SIZE = 10;

function renderPaginationControls(container, totalItems, currentPage, onPageChange) {
  const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_PAGE_SIZE));
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let html = `<button type="button" class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹ Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button type="button" class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Next ›</button>`;
  container.innerHTML = html;
  container.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      onPageChange(Number(btn.dataset.page));
    });
  });
}

// Uploads each file to Cloudinary and returns an array of hosted URLs.
async function uploadImages(files, folder) {
  const urls = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      throw new Error((data.error && data.error.message) || "Image upload failed — check your Cloudinary cloud name and upload preset.");
    }
    urls.push(data.secure_url);
  }
  return urls;
}

// =====================================================================
// PRODUCTS (phones)
// =====================================================================
const productForm = document.getElementById("productForm");
const productTableBody = document.querySelector("#productTable tbody");
const productFormTitle = document.getElementById("productFormTitle");
const productFormStatus = document.getElementById("productFormStatus");
const cancelProductEditBtn = document.getElementById("cancelProductEdit");

let editingProductId = null;

let _unsubProducts = null;
let allProductsData = [];
let productPage = 1;
let productSearchQuery = "";
const productPagination = document.getElementById("productPagination");
const productSearchInput = document.getElementById("productSearchInput");

productSearchInput.addEventListener("input", () => {
  productSearchQuery = productSearchInput.value.trim().toLowerCase();
  productPage = 1;
  renderProductsPage();
});

function loadProductsTable() {
  if (_unsubProducts) return; // listener already running
  productTableBody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  _unsubProducts = db.collection("products").orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      allProductsData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderProductsPage();
    }, () => {
      productTableBody.innerHTML = `<tr><td colspan="6">Couldn't load phones.</td></tr>`;
    });
}

function renderProductsPage() {
  const filtered = productSearchQuery
    ? allProductsData.filter((p) =>
        p.name.toLowerCase().includes(productSearchQuery) ||
        p.brand.toLowerCase().includes(productSearchQuery))
    : allProductsData;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  if (productPage > totalPages) productPage = totalPages;

  if (filtered.length === 0) {
    productTableBody.innerHTML = `<tr><td colspan="6">${productSearchQuery ? "No phones match that search." : "No phones added yet."}</td></tr>`;
    productPagination.innerHTML = "";
    return;
  }

  const start = (productPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + ADMIN_PAGE_SIZE);

  productTableBody.innerHTML = pageItems.map((p) => {
    const thumb = p.images && p.images[0]
      ? `<img class="admin-thumb" src="${p.images[0]}" alt="">`
      : `<span class="admin-thumb admin-thumb-empty"></span>`;
    return `
      <tr>
        <td>${thumb}</td>
        <td>${p.brand}<br><strong>${p.name}</strong></td>
        <td>${p.condition}</td>
        <td>${formatPriceAdmin(p.price)}</td>
        <td>${p.stock === "in" ? "In stock" : "Low stock"}</td>
        <td class="admin-row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-product="${p.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-delete-product="${p.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  productTableBody.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.addEventListener("click", () => startEditProduct(btn.dataset.editProduct));
  });
  productTableBody.querySelectorAll("[data-delete-product]").forEach((btn) => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.deleteProduct));
  });

  renderPaginationControls(productPagination, filtered.length, productPage, (page) => {
    productPage = page;
    renderProductsPage();
  });
}

async function startEditProduct(id) {
  const doc = await db.collection("products").doc(id).get();
  if (!doc.exists) return;
  const p = doc.data();

  editingProductId = id;
  productFormTitle.textContent = "Edit phone";
  productForm.brand.value = p.brand;
  productForm.name.value = p.name;
  productForm.ram.value = p.ram;
  productForm.storage.value = p.storage;
  productForm.battery.value = p.battery;
  productForm.price.value = p.price;
  productForm.stock.value = p.stock;
  productForm.condition.value = p.condition;
  productForm.networkType.value = p.networkType || "4G";
  productForm.description.value = p.description || "";
  cancelProductEditBtn.hidden = false;
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProductForm() {
  editingProductId = null;
  productForm.reset();
  productFormTitle.textContent = "Add a new phone";
  cancelProductEditBtn.hidden = true;
  productFormStatus.hidden = true;
}

cancelProductEditBtn.addEventListener("click", resetProductForm);

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = productForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  productFormStatus.hidden = true;

  try {
    const data = {
      brand: productForm.brand.value.trim(),
      name: productForm.name.value.trim(),
      ram: productForm.ram.value.trim(),
      storage: productForm.storage.value.trim(),
      battery: productForm.battery.value.trim(),
      price: Number(productForm.price.value),
      stock: productForm.stock.value,
      condition: productForm.condition.value,
      networkType: productForm.networkType.value,
      description: productForm.description.value.trim(),
    };

    const files = Array.from(productForm.images.files || []);
    if (files.length) {
      productFormStatus.hidden = false;
      productFormStatus.textContent = "Uploading photos…";
      data.images = await uploadImages(files, "products");
    }

    if (editingProductId) {
      await db.collection("products").doc(editingProductId).update(data);
    } else {
      data.images = data.images || [];
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("products").add(data);
    }

    _productsCacheBust();
    resetProductForm();
  } catch (err) {
    productFormStatus.hidden = false;
    productFormStatus.textContent = "Something went wrong — " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

async function deleteProduct(id) {
  if (!confirm("Delete this phone? This can't be undone.")) return;
  await db.collection("products").doc(id).delete();
}

// =====================================================================
// ACCESSORIES
// =====================================================================
const accessoryForm = document.getElementById("accessoryForm");
const accessoryTableBody = document.querySelector("#accessoryTable tbody");
const accessoryFormTitle = document.getElementById("accessoryFormTitle");
const accessoryFormStatus = document.getElementById("accessoryFormStatus");
const cancelAccessoryEditBtn = document.getElementById("cancelAccessoryEdit");

let editingAccessoryId = null;

let _unsubAccessories = null;
let allAccessoriesData = [];
let accessoryPage = 1;
let accessorySearchQuery = "";
const accessoryPagination = document.getElementById("accessoryPagination");
const accessorySearchInputAdmin = document.getElementById("accessorySearchInputAdmin");

accessorySearchInputAdmin.addEventListener("input", () => {
  accessorySearchQuery = accessorySearchInputAdmin.value.trim().toLowerCase();
  accessoryPage = 1;
  renderAccessoriesPage();
});

function loadAccessoriesTable() {
  if (_unsubAccessories) return; // listener already running
  accessoryTableBody.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
  _unsubAccessories = db.collection("accessories").orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      allAccessoriesData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderAccessoriesPage();
    }, () => {
      accessoryTableBody.innerHTML = `<tr><td colspan="4">Couldn't load accessories.</td></tr>`;
    });
}

function renderAccessoriesPage() {
  const filtered = accessorySearchQuery
    ? allAccessoriesData.filter((a) =>
        a.name.toLowerCase().includes(accessorySearchQuery) ||
        a.category.toLowerCase().includes(accessorySearchQuery))
    : allAccessoriesData;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  if (accessoryPage > totalPages) accessoryPage = totalPages;

  if (filtered.length === 0) {
    accessoryTableBody.innerHTML = `<tr><td colspan="4">${accessorySearchQuery ? "No accessories match that search." : "No accessories added yet."}</td></tr>`;
    accessoryPagination.innerHTML = "";
    return;
  }

  const start = (accessoryPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + ADMIN_PAGE_SIZE);

  accessoryTableBody.innerHTML = pageItems.map((a) => {
    const firstImg = (a.images && a.images[0]) || a.image || null;
    const thumb = firstImg
      ? `<img class="admin-thumb" src="${firstImg}" alt="">`
      : `<span class="admin-thumb admin-thumb-empty">${a.icon || "🎧"}</span>`;
    return `
      <tr>
        <td>${thumb}</td>
        <td>${a.category}<br><strong>${a.name}</strong></td>
        <td>${formatPriceAdmin(a.price)}</td>
        <td class="admin-row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-accessory="${a.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-delete-accessory="${a.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  accessoryTableBody.querySelectorAll("[data-edit-accessory]").forEach((btn) => {
    btn.addEventListener("click", () => startEditAccessory(btn.dataset.editAccessory));
  });
  accessoryTableBody.querySelectorAll("[data-delete-accessory]").forEach((btn) => {
    btn.addEventListener("click", () => deleteAccessory(btn.dataset.deleteAccessory));
  });

  renderPaginationControls(accessoryPagination, filtered.length, accessoryPage, (page) => {
    accessoryPage = page;
    renderAccessoriesPage();
  });
}

async function startEditAccessory(id) {
  const doc = await db.collection("accessories").doc(id).get();
  if (!doc.exists) return;
  const a = doc.data();

  editingAccessoryId = id;
  accessoryFormTitle.textContent = "Edit accessory";
  accessoryForm.category.value = a.category;
  accessoryForm.name.value = a.name;
  accessoryForm.price.value = a.price;
  accessoryForm.icon.value = a.icon || "";
  cancelAccessoryEditBtn.hidden = false;
  accessoryForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAccessoryForm() {
  editingAccessoryId = null;
  accessoryForm.reset();
  accessoryFormTitle.textContent = "Add a new accessory";
  cancelAccessoryEditBtn.hidden = true;
  accessoryFormStatus.hidden = true;
}

cancelAccessoryEditBtn.addEventListener("click", resetAccessoryForm);

accessoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = accessoryForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  accessoryFormStatus.hidden = true;

  try {
    const data = {
      category: accessoryForm.category.value.trim(),
      name: accessoryForm.name.value.trim(),
      price: Number(accessoryForm.price.value),
      icon: accessoryForm.icon.value.trim() || "🎧",
    };

    const files = Array.from(accessoryForm.images.files || []);
    if (files.length) {
      accessoryFormStatus.hidden = false;
      accessoryFormStatus.textContent = "Uploading photos…";
      data.images = await uploadImages(files, "accessories");
    }

    if (editingAccessoryId) {
      await db.collection("accessories").doc(editingAccessoryId).update(data);
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("accessories").add(data);
    }

    resetAccessoryForm();
  } catch (err) {
    accessoryFormStatus.hidden = false;
    accessoryFormStatus.textContent = "Something went wrong — " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

async function deleteAccessory(id) {
  if (!confirm("Delete this accessory? This can't be undone.")) return;
  await db.collection("accessories").doc(id).delete();
}

// No-op placeholder: the public site (script.js) caches product lists
// per page-load, so no live cache to bust here — kept for clarity if
// admin.html and the public site ever share a tab via localStorage.
function _productsCacheBust() {}

// =====================================================================
// LAPTOPS
// Separate Firestore collection ("laptops") — does NOT touch
// "products" or "accessories", so existing phone/accessory data is
// completely unaffected by this block.
// =====================================================================
const laptopForm = document.getElementById("laptopForm");
const laptopTableBody = document.querySelector("#laptopTable tbody");
const laptopFormTitle = document.getElementById("laptopFormTitle");
const laptopFormStatus = document.getElementById("laptopFormStatus");
const cancelLaptopEditBtn = document.getElementById("cancelLaptopEdit");

let editingLaptopId = null;

let _unsubLaptops = null;
let allLaptopsData = [];
let laptopPage = 1;
let laptopSearchQuery = "";
const laptopPagination = document.getElementById("laptopPagination");
const laptopSearchInputAdmin = document.getElementById("laptopSearchInputAdmin");

laptopSearchInputAdmin.addEventListener("input", () => {
  laptopSearchQuery = laptopSearchInputAdmin.value.trim().toLowerCase();
  laptopPage = 1;
  renderLaptopsPage();
});

function loadLaptopsTable() {
  if (_unsubLaptops) return; // listener already running
  laptopTableBody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  _unsubLaptops = db.collection("laptops").orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      allLaptopsData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderLaptopsPage();
    }, () => {
      laptopTableBody.innerHTML = `<tr><td colspan="6">Couldn't load laptops.</td></tr>`;
    });
}

function renderLaptopsPage() {
  const filtered = laptopSearchQuery
    ? allLaptopsData.filter((l) =>
        l.name.toLowerCase().includes(laptopSearchQuery) ||
        l.brand.toLowerCase().includes(laptopSearchQuery))
    : allLaptopsData;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  if (laptopPage > totalPages) laptopPage = totalPages;

  if (filtered.length === 0) {
    laptopTableBody.innerHTML = `<tr><td colspan="6">${laptopSearchQuery ? "No laptops match that search." : "No laptops added yet."}</td></tr>`;
    laptopPagination.innerHTML = "";
    return;
  }

  const start = (laptopPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + ADMIN_PAGE_SIZE);

  laptopTableBody.innerHTML = pageItems.map((l) => {
    const thumb = l.images && l.images[0]
      ? `<img class="admin-thumb" src="${l.images[0]}" alt="">`
      : `<span class="admin-thumb admin-thumb-empty"></span>`;
    return `
      <tr>
        <td>${thumb}</td>
        <td>${l.brand}<br><strong>${l.name}</strong></td>
        <td>${l.condition}</td>
        <td>${formatPriceAdmin(l.price)}</td>
        <td>${l.stock === "in" ? "In stock" : "Low stock"}</td>
        <td class="admin-row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-laptop="${l.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm" data-delete-laptop="${l.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  laptopTableBody.querySelectorAll("[data-edit-laptop]").forEach((btn) => {
    btn.addEventListener("click", () => startEditLaptop(btn.dataset.editLaptop));
  });
  laptopTableBody.querySelectorAll("[data-delete-laptop]").forEach((btn) => {
    btn.addEventListener("click", () => deleteLaptop(btn.dataset.deleteLaptop));
  });

  renderPaginationControls(laptopPagination, filtered.length, laptopPage, (page) => {
    laptopPage = page;
    renderLaptopsPage();
  });
}

async function startEditLaptop(id) {
  const doc = await db.collection("laptops").doc(id).get();
  if (!doc.exists) return;
  const l = doc.data();

  editingLaptopId = id;
  laptopFormTitle.textContent = "Edit laptop";
  laptopForm.brand.value = l.brand;
  laptopForm.name.value = l.name;
  laptopForm.processor.value = l.processor;
  laptopForm.ram.value = l.ram;
  laptopForm.storage.value = l.storage;
  laptopForm.screen.value = l.screen;
  laptopForm.price.value = l.price;
  laptopForm.stock.value = l.stock;
  laptopForm.condition.value = l.condition;
  laptopForm.description.value = l.description || "";
  cancelLaptopEditBtn.hidden = false;
  laptopForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetLaptopForm() {
  editingLaptopId = null;
  laptopForm.reset();
  laptopFormTitle.textContent = "Add a new laptop";
  cancelLaptopEditBtn.hidden = true;
  laptopFormStatus.hidden = true;
}

cancelLaptopEditBtn.addEventListener("click", resetLaptopForm);

laptopForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = laptopForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  laptopFormStatus.hidden = true;

  try {
    const data = {
      brand: laptopForm.brand.value.trim(),
      name: laptopForm.name.value.trim(),
      processor: laptopForm.processor.value.trim(),
      ram: laptopForm.ram.value.trim(),
      storage: laptopForm.storage.value.trim(),
      screen: laptopForm.screen.value.trim(),
      price: Number(laptopForm.price.value),
      stock: laptopForm.stock.value,
      condition: laptopForm.condition.value,
      description: laptopForm.description.value.trim(),
    };

    const files = Array.from(laptopForm.images.files || []);
    if (files.length) {
      laptopFormStatus.hidden = false;
      laptopFormStatus.textContent = "Uploading photos…";
      data.images = await uploadImages(files, "laptops");
    }

    if (editingLaptopId) {
      await db.collection("laptops").doc(editingLaptopId).update(data);
    } else {
      data.images = data.images || [];
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("laptops").add(data);
    }

    resetLaptopForm();
  } catch (err) {
    laptopFormStatus.hidden = false;
    laptopFormStatus.textContent = "Something went wrong — " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

async function deleteLaptop(id) {
  if (!confirm("Delete this laptop? This can't be undone.")) return;
  await db.collection("laptops").doc(id).delete();
}
