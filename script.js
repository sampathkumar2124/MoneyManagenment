const API_BASE = "http://localhost:5000/api/transactions";

let currentPeriod = "week";
let isCustomFilter = false;
let customStartDate = null;
let customEndDate = null;
let customCategory = null;

// ────────────────────────────────────────────────
// Check if lifetime balance is negative → show popup once
// ────────────────────────────────────────────────
async function checkNegativeBalance() {
  try {
    const res = await fetch(`${API_BASE}/summary/lifetime`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.balance < 0) {
      alert(
        `⚠️ Warning: Your total balance is negative!\n` +
          `Current deficit: ₹${Math.abs(data.balance).toLocaleString("en-IN")}`,
      );
    }
  } catch (err) {
    // Silent fail
  }
}

// ────────────────────────────────────────────────
// Load lifetime summary (top cards)
// ────────────────────────────────────────────────
async function loadTopSummary() {
  try {
    const res = await fetch(`${API_BASE}/summary/lifetime`);
    if (!res.ok) return;
    const d = await res.json();

    document.getElementById("top-income").textContent =
      `₹${d.income.toLocaleString("en-IN")}`;
    document.getElementById("top-expense").textContent =
      `₹${d.expense.toLocaleString("en-IN")}`;

    const balanceEl = document.getElementById("top-balance");
    const balance = d.balance;
    balanceEl.textContent = `₹${Math.abs(balance).toLocaleString("en-IN")}`;
    balanceEl.className =
      balance >= 0
        ? "text-4xl font-bold text-green-600 mt-2"
        : "text-4xl font-bold text-red-600 mt-2";
  } catch (err) {
    // Silent fail
  }
}

// ────────────────────────────────────────────────
// Load transactions filtered by current period or custom filters
// ────────────────────────────────────────────────
async function loadHistory() {
  const periodTitles = {
    today: "Today's Transactions",
    week: "Last 7 Days Transactions",
    month: "This Month's Transactions",
    year: "This Year's Transactions",
    all: "All Transactions",
  };

  let title = periodTitles[currentPeriod] || "Transactions";
  let url = API_BASE;
  const now = new Date();

  if (isCustomFilter && customStartDate && customEndDate) {
    // Custom date range + optional category
    url += `?startDate=${customStartDate}&endDate=${customEndDate}`;
    if (customCategory) {
      url += `&category=${encodeURIComponent(customCategory)}`;
    }
    title = `Filtered Transactions${customCategory ? ` (${customCategory})` : ""} from ${customStartDate} to ${customEndDate}`;
  } else {
    // Standard period filter
    let startDate = null;

    if (currentPeriod === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (currentPeriod === "week") {
      // Last 7 days including today
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
    } else if (currentPeriod === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (currentPeriod === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    if (startDate) {
      const startISO = startDate.toISOString().split("T")[0];
      const endISO = now.toISOString().split("T")[0];
      url += `?startDate=${startISO}&endDate=${endISO}`;
    }
    // For "all", no date params
  }

  document.querySelector("h2.text-2xl").textContent = title;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load transactions");

    const transactions = await res.json();

    const list = document.getElementById("history-list");
    list.innerHTML = "";

    if (transactions.length === 0) {
      list.innerHTML =
        '<p class="text-center py-12 text-gray-500">No transactions found in this filter</p>';
      return;
    }

    transactions.forEach((t) => {
      const item = document.createElement("div");
      item.className = `p-4 rounded-lg border-l-4 flex justify-between items-center ${
        t.type === "income"
          ? "bg-green-50 border-green-500"
          : "bg-red-50 border-red-500"
      }`;
      item.innerHTML = `
        <div>
          <div class="font-medium">${t.description || t.category || "—"}</div>
          <div class="text-sm text-gray-600">
            ${new Date(t.date).toLocaleString("en-IN")} • ${t.division || "—"} • ${t.category || "—"}
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold text-lg ${t.type === "income" ? "text-green-700" : "text-red-700"}">
            ${t.type === "income" ? "+" : "−"} ₹${t.amount.toLocaleString("en-IN")}
          </div>
        </div>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    document.getElementById("history-list").innerHTML =
      '<p class="text-center py-12 text-red-500">Error loading transactions</p>';
  }
}

// ────────────────────────────────────────────────
// Save new transaction & refresh view
// ────────────────────────────────────────────────
document.getElementById("transaction-form").onsubmit = async (e) => {
  e.preventDefault();

  const payload = {
    type: document.getElementById("form-type").value,
    amount: Number(document.getElementById("form-amount").value),
    category: document.getElementById("form-category").value,
    description: document.getElementById("form-description").value.trim(),
    division: document.getElementById("form-division").value,
    date: document.getElementById("form-date").value,
  };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to save transaction");
    }

    modal.close();
    document.getElementById("transaction-form").reset();

    await loadTopSummary();
    await loadHistory();

    alert("Transaction added successfully!");
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// ────────────────────────────────────────────────
// Period tab switching (clears custom filter)
// ────────────────────────────────────────────────
function setPeriod(period) {
  currentPeriod = period;
  isCustomFilter = false;
  customStartDate = null;
  customEndDate = null;
  customCategory = null;

  document.querySelectorAll('[id^="tab-"]').forEach((btn) => {
    btn.classList.remove("tab-active");
    btn.classList.add("tab-inactive");
  });

  document.getElementById(`tab-${period}`).classList.remove("tab-inactive");
  document.getElementById(`tab-${period}`).classList.add("tab-active");

  loadHistory();
}

document.getElementById("tab-today").onclick = () => setPeriod("today");
document.getElementById("tab-week").onclick = () => setPeriod("week");
document.getElementById("tab-month").onclick = () => setPeriod("month");
document.getElementById("tab-year").onclick = () => setPeriod("year");
document.getElementById("tab-all").onclick = () => setPeriod("all");

// ────────────────────────────────────────────────
// Custom filter handling
// ────────────────────────────────────────────────
document.getElementById("apply-custom").onclick = () => {
  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;
  const cat = document.getElementById("filter-category").value.trim();

  if (!from || !to) {
    alert("Please select both From and To dates.");
    return;
  }

  customStartDate = from;
  customEndDate = to;
  customCategory = cat || null;
  isCustomFilter = true;

  loadHistory();
};

document.getElementById("clear-custom").onclick = () => {
  document.getElementById("filter-from").value = "";
  document.getElementById("filter-to").value = "";
  document.getElementById("filter-category").value = "";

  isCustomFilter = false;
  customStartDate = null;
  customEndDate = null;
  customCategory = null;

  loadHistory(); // Reload current period
};

// ────────────────────────────────────────────────
// Modal income/expense tab switching
// ────────────────────────────────────────────────
document.getElementById("tab-income").onclick = () => {
  document.getElementById("form-type").value = "income";
  document.getElementById("tab-income").classList.add("tab-active");
  document.getElementById("tab-expense").classList.remove("tab-active");
};

document.getElementById("tab-expense").onclick = () => {
  document.getElementById("form-type").value = "expense";
  document.getElementById("tab-expense").classList.add("tab-active");
  document.getElementById("tab-income").classList.remove("tab-active");
};

// ────────────────────────────────────────────────
// Modal open / close
// ────────────────────────────────────────────────
const modal = document.getElementById("add-modal");
document.getElementById("add-btn").onclick = () => modal.showModal();
document.getElementById("close-modal").onclick = () => modal.close();

// ────────────────────────────────────────────────
// Initial load
// ────────────────────────────────────────────────
loadTopSummary();
checkNegativeBalance();
setPeriod("week");
