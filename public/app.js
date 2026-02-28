// API Base URL
const API_URL = '/api';

// State
let books = [];
let history = [];
let currentEditId = null;
let currentDeleteId = null;
let activeCategory = 'all';
let searchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadData();
    renderBooks();
    updateCategoryCounts();
    renderHistory();
    renderCategoryStats();
});

// API Functions
async function loadData() {
    try {
        const [booksRes, historyRes] = await Promise.all([
            fetch(`${API_URL}/books`),
            fetch(`${API_URL}/history`)
        ]);
        books = await booksRes.json();
        history = await historyRes.json();

        // Update total books in header
        document.getElementById('total-books-count').textContent = `Total: ${books.length} Books`;
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function saveBook() {
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();

    if (!title || !author) {
        alert('Please fill in required fields (Title and Author)');
        return;
    }

    const bookData = {
        title,
        author,
        category: document.getElementById('book-category').value,
        isbn: document.getElementById('book-isbn').value.trim(),
        coverUrl: document.getElementById('book-cover').value.trim(),
        notes: document.getElementById('book-notes').value.trim()
    };

    try {
        if (currentEditId) {
            // Update existing book
            const response = await fetch(`${API_URL}/books/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
            await response.json();
        } else {
            // Add new book
            await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        }

        await loadData();
        renderBooks();
        updateCategoryCounts();
        renderCategoryStats();
        closeModal('book-modal');
    } catch (error) {
        console.error('Error saving book:', error);
        alert('Error saving book');
    }
}

async function confirmDelete() {
    if (currentDeleteId) {
        try {
            await fetch(`${API_URL}/books/${currentDeleteId}`, {
                method: 'DELETE'
            });

            await loadData();
            renderBooks();
            updateCategoryCounts();
            renderCategoryStats();
            renderHistory();
            closeModal('delete-modal');
            currentDeleteId = null;
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Error deleting book');
        }
    }
}

async function confirmBorrow() {
    const borrower = document.getElementById('borrower-name').value.trim();
    if (!borrower) {
        alert('Please enter borrower name');
        return;
    }

    const bookId = document.getElementById('borrow-book-id').value;

    try {
        await fetch(`${API_URL}/borrow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookId,
                borrower,
                returnDate: document.getElementById('return-date').value || null,
                notes: document.getElementById('borrow-notes').value.trim()
            })
        });

        await loadData();
        renderBooks();
        renderHistory();
        closeModal('borrow-modal');
    } catch (error) {
        console.error('Error borrowing book:', error);
        alert('Error borrowing book');
    }
}

async function returnBook(bookId) {
    try {
        await fetch(`${API_URL}/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId })
        });

        await loadData();
        renderBooks();
        renderHistory();
    } catch (error) {
        console.error('Error returning book:', error);
        alert('Error returning book');
    }
}

async function markReturned(historyId) {
    const historyEntry = history.find(h => h.id === historyId);
    if (historyEntry) {
        await returnBook(historyEntry.bookId);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderBooks();
    });

    // Category Filter
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.dataset.category;
            renderBooks();
        });
    });

    // Set default borrow date
    document.getElementById('borrow-date').valueAsDate = new Date();
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${tabName}-view`).classList.add('active');

    if (tabName === 'history') {
        renderHistory();
    } else if (tabName === 'categories') {
        renderCategorySections();
    }
}

// Render Books
function renderBooks() {
    const grid = document.getElementById('book-grid');
    const emptyState = document.getElementById('empty-state');

    let filteredBooks = books;

    // Filter by category
    if (activeCategory !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.category === activeCategory);
    }

    // Filter by search
    if (searchQuery) {
        filteredBooks = filteredBooks.filter(book =>
            book.title.toLowerCase().includes(searchQuery) ||
            book.author.toLowerCase().includes(searchQuery) ||
            book.isbn.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredBooks.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = filteredBooks.map(book => {
        const status = book.borrowed ? 'borrowed' : 'available';
        const statusText = book.borrowed ? 'Borrowed' : 'Available';

        return `
            <div class="book-card">
                <div class="book-cover">
                    ${book.coverUrl ?
                `<img src="${book.coverUrl}" alt="${book.title}" onerror="this.style.display='none'; this.parentNode.innerHTML='<span class=\\'placeholder\\'>📖</span>'">` :
                '<span class="placeholder">📖</span>'
            }
                    <span class="book-status ${status}">${statusText}</span>
                </div>
                <div class="book-info">
                    <span class="book-category ${book.category}">${formatCategory(book.category)}</span>
                    <h3 class="book-title" title="${book.title}">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                </div>
                <div class="book-actions">
                    ${book.borrowed ?
                `<button class="btn-returned" onclick="returnBook('${book.id}')">Return</button>` :
                `<button class="btn-borrow" onclick="openBorrowModal('${book.id}')">Lend</button>`
            }
                    <button class="btn-edit" onclick="editBook('${book.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteBook('${book.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update Category Counts
function updateCategoryCounts() {
    const categories = ['all', 'fiction', 'non-fiction', 'science', 'history', 'technology', 'biography', 'other'];

    categories.forEach(cat => {
        const count = cat === 'all' ? books.length : books.filter(b => b.category === cat).length;
        const countElement = document.getElementById(`count-${cat}`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// Render Category Sections (for Categories View)
function renderCategorySections() {
    const container = document.getElementById('category-sections');
    if (!container) return;

    const categories = [
        { key: 'fiction', label: 'Fiction', color: 'var(--cat-fiction)' },
        { key: 'non-fiction', label: 'Non-Fiction', color: 'var(--cat-nonfiction)' },
        { key: 'science', label: 'Science', color: 'var(--cat-science)' },
        { key: 'history', label: 'History', color: 'var(--cat-history)' },
        { key: 'technology', label: 'Technology', color: 'var(--cat-technology)' },
        { key: 'biography', label: 'Biography', color: 'var(--cat-biography)' },
        { key: 'other', label: 'Other', color: 'var(--cat-other)' }
    ];

    let html = '';
    let hasBooks = false;

    categories.forEach(cat => {
        const catBooks = books.filter(b => b.category === cat.key);
        if (catBooks.length > 0) {
            hasBooks = true;
            html += `
                <div class="category-section" style="margin-bottom: 32px;">
                    <h3 style="color: ${cat.color}; margin-bottom: 16px; font-family: 'Playfair Display', serif; font-size: 1.5rem;">
                        ${cat.label} <span style="color: var(--text-secondary); font-size: 1rem;">(${catBooks.length} books)</span>
                    </h3>
                    <div class="book-grid">
                        ${catBooks.map(book => {
                const status = book.borrowed ? 'borrowed' : 'available';
                const statusText = book.borrowed ? 'Borrowed' : 'Available';
                return `
                                <div class="book-card">
                                    <div class="book-cover">
                                        ${book.coverUrl ?
                        `<img src="${book.coverUrl}" alt="${book.title}" onerror="this.style.display='none'; this.parentNode.innerHTML='<span class=\\'placeholder\\'>📖</span>'">` :
                        '<span class="placeholder">📖</span>'
                    }
                                        <span class="book-status ${status}">${statusText}</span>
                                    </div>
                                    <div class="book-info">
                                        <span class="book-category ${book.category}">${formatCategory(book.category)}</span>
                                        <h3 class="book-title" title="${book.title}">${book.title}</h3>
                                        <p class="book-author">by ${book.author}</p>
                                    </div>
                                    <div class="book-actions">
                                        ${book.borrowed ?
                        `<button class="btn-returned" onclick="returnBook('${book.id}')">Return</button>` :
                        `<button class="btn-borrow" onclick="openBorrowModal('${book.id}')">Lend</button>`
                    }
                                        <button class="btn-edit" onclick="editBook('${book.id}')">Edit</button>
                                        <button class="btn-delete" onclick="deleteBook('${book.id}')">Delete</button>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }
    });

    if (!hasBooks) {
        html = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
                <h2>No Books Yet</h2>
                <p>Add some books to your library to see them organized by category.</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Render History
function renderHistory() {
    const tbody = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty');

    // Sort by date (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.dateBorrowed) - new Date(a.dateBorrowed));

    // Update stats
    document.getElementById('total-borrows').textContent = history.length;
    document.getElementById('active-borrows').textContent = history.filter(h => h.status === 'active').length;
    document.getElementById('returned-borrows').textContent = history.filter(h => h.status === 'returned').length;

    if (sortedHistory.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = sortedHistory.map(item => {
        const bookTitle = item.bookTitle || 'Unknown Book';

        return `
            <tr>
                <td><strong>${bookTitle}</strong></td>
                <td>${item.borrower}</td>
                <td>${formatDate(item.dateBorrowed)}</td>
                <td>${item.returnDate ? formatDate(item.returnDate) : '-'}</td>
                <td><span class="status-badge ${item.status}">${item.status === 'active' ? 'Active' : 'Returned'}</span></td>
                <td>
                    ${item.status === 'active' ?
                `<button class="btn-returned" onclick="markReturned('${item.id}')" style="padding: 6px 12px; font-size: 0.8rem;">Mark Returned</button>` :
                `${item.dateReturned ? formatDate(item.dateReturned) : '-'}`
            }
                </td>
            </tr>
        `;
    }).join('');
}

// Render Category Stats
async function renderCategoryStats() {
    const container = document.getElementById('category-stats');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();

        const categories = [
            { key: 'fiction', label: 'Fiction', color: 'var(--cat-fiction)' },
            { key: 'non-fiction', label: 'Non-Fiction', color: 'var(--cat-nonfiction)' },
            { key: 'science', label: 'Science', color: 'var(--cat-science)' },
            { key: 'history', label: 'History', color: 'var(--cat-history)' },
            { key: 'technology', label: 'Technology', color: 'var(--cat-technology)' },
            { key: 'biography', label: 'Biography', color: 'var(--cat-biography)' },
            { key: 'other', label: 'Other', color: 'var(--cat-other)' }
        ];

        container.innerHTML = categories.map(cat => {
            const catStats = stats.categories[cat.key] || { total: 0, borrowed: 0 };

            return `
                <div class="stat-card">
                    <div class="stat-number" style="color: ${cat.color}">${catStats.total}</div>
                    <div class="stat-label">${cat.label} Books</div>
                    <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 8px;">
                        ${catStats.borrowed} borrowed
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// Add Book
function openAddModal() {
    currentEditId = null;
    document.getElementById('modal-title').textContent = 'Add New Book';
    document.getElementById('book-form').reset();
    document.getElementById('book-id').value = '';
    openModal('book-modal');
}

// Edit Book
function editBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    currentEditId = bookId;
    document.getElementById('modal-title').textContent = 'Edit Book';
    document.getElementById('book-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-author').value = book.author;
    document.getElementById('book-category').value = book.category;
    document.getElementById('book-isbn').value = book.isbn || '';
    document.getElementById('book-cover').value = book.coverUrl || '';
    document.getElementById('book-notes').value = book.notes || '';

    openModal('book-modal');
}

// Delete Book
function deleteBook(bookId) {
    currentDeleteId = bookId;
    openModal('delete-modal');
}

// Borrow/Lend Book
function openBorrowModal(bookId) {
    document.getElementById('borrow-book-id').value = bookId;
    document.getElementById('borrower-name').value = '';
    document.getElementById('borrow-date').valueAsDate = new Date();
    document.getElementById('return-date').value = '';
    document.getElementById('borrow-notes').value = '';
    openModal('borrow-modal');
}

// Utility Functions
function formatCategory(category) {
    const labels = {
        'fiction': 'Fiction',
        'non-fiction': 'Non-Fiction',
        'science': 'Science',
        'history': 'History',
        'technology': 'Technology',
        'biography': 'Biography',
        'other': 'Other'
    };
    return labels[category] || category;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Close modals on outside click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});
