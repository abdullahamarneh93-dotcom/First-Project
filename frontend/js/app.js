// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).

const API_URL = "http://localhost:3000/api/expenses";


let allExpenses = [];
let currentFilter = 'All';

const totalAmountEl = document.getElementById('totalAmount');
const expensesCountEl = document.getElementById('expensesCount');
const highestAmountEl = document.getElementById('highestAmount');
const highestTitleEl = document.getElementById('highestTitle');
const expensesTableBody = document.getElementById('expensesTableBody');
const filterCategory = document.getElementById('filterCategory');
const addExpenseForm = document.getElementById('addExpenseForm');
const loadingSpinner = document.getElementById('loadingSpinner');
const alertContainer = document.getElementById('alertContainer');

const editModalEl = document.getElementById('editModal');
const editModal = new bootstrap.Modal(editModalEl);
const editExpenseForm = document.getElementById('editExpenseForm');
const editIdInput = document.getElementById('editId');
const editTitleInput = document.getElementById('editTitle');
const editAmountInput = document.getElementById('editAmount');
const editCategoryInput = document.getElementById('editCategory');
const editDateInput = document.getElementById('editDate');

document.addEventListener('DOMContentLoaded', () => {
  fetchExpenses();
});

function showAlert(message, type = 'danger') {
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function clearAlert() {
  alertContainer.innerHTML = '';
}

async function fetchExpenses() {
  loadingSpinner.classList.remove('d-none');
  expensesTableBody.innerHTML = '';
  clearAlert();

  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    allExpenses = data;
    updateSummaryCards(allExpenses);
    renderTable();
  } catch (error) {
    console.error('Error fetching expenses:', error);
    showAlert('Failed to connect to the server. Please ensure the backend is running.');
  } finally {
    loadingSpinner.classList.add('d-none');
  }
}

function updateSummaryCards(expenses) {
  const count = expenses.length;
  expensesCountEl.textContent = count;

  if (count === 0) {
    totalAmountEl.textContent = '0.00';
    highestAmountEl.textContent = '0.00';
    highestTitleEl.textContent = '-';
    return;
  }

  const total = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  totalAmountEl.textContent = total.toFixed(2);

  const highest = expenses.reduce((max, item) => 
    parseFloat(item.amount) > parseFloat(max.amount) ? item : max
  , expenses[0]);

  highestAmountEl.textContent = parseFloat(highest.amount).toFixed(2);
  highestTitleEl.textContent = highest.title;
}

function renderTable() {
  expensesTableBody.innerHTML = '';

  const filtered = currentFilter === 'All' 
    ? allExpenses 
    : allExpenses.filter(item => item.category === currentFilter);

  if (filtered.length === 0) {
    expensesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">No expenses found</td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'border-bottom';

    const categoryBadgeClass = `badge-${item.category.toLowerCase()}`;

    tr.innerHTML = `
      <td class="fw-semibold text-dark">${item.title}</td>
      <td class="text-end fw-semibold">${parseFloat(item.amount).toFixed(2)}</td>
      <td>
        <span class="badge badge-category ${categoryBadgeClass}">${item.category}</span>
      </td>
      <td class="text-secondary">${item.date}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary me-1 btn-edit" data-id="${item.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${item.id}">Delete</button>
      </td>
    `;

    tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(item));
    tr.querySelector('.btn-delete').addEventListener('click', () => deleteExpense(item.id));

    expensesTableBody.appendChild(tr);
  });
}

addExpenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    showAlert('Please fill all fields with valid data.');
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, category, date })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.message || 'Failed to add expense');
      return;
    }

    addExpenseForm.reset();
    await fetchExpenses();
  } catch (error) {
    console.error('Error adding expense:', error);
    showAlert('Unable to reach the server to add expense.');
  }
});

function openEditModal(expense) {
  editIdInput.value = expense.id;
  editTitleInput.value = expense.title;
  editAmountInput.value = expense.amount;
  editCategoryInput.value = expense.category;
  editDateInput.value = expense.date;
  editModal.show();
}

editExpenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();

  const id = editIdInput.value;
  const title = editTitleInput.value.trim();
  const amount = parseFloat(editAmountInput.value);
  const category = editCategoryInput.value;
  const date = editDateInput.value;

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    showAlert('Please provide valid data for all fields.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, category, date })
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.message || 'Failed to update expense');
      return;
    }

    editModal.hide();
    await fetchExpenses();
  } catch (error) {
    console.error('Error updating expense:', error);
    showAlert('Unable to reach the server to update expense.');
  }
});

async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }

  clearAlert();

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.message || 'Failed to delete expense');
      return;
    }

    await fetchExpenses();
  } catch (error) {
    console.error('Error deleting expense:', error);
    showAlert('Unable to reach the server to delete expense.');
  }
}

filterCategory.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTable();
});