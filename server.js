require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store (works on Vercel)
// Note: Data will reset on each deployment/reload (use MongoDB for persistence)
let books = [];
let history = [];
let bookIdCounter = 1;
let historyIdCounter = 1;

// Predefined dummy data
const INITIAL_BOOKS = [
    {
        title: "1984",
        author: "George Orwell",
        category: "fiction",
        isbn: "9780451524935",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        notes: "",
        borrowed: false
    },
    {
        title: "Sapiens",
        author: "Yuval Noah Harari",
        category: "non-fiction",
        isbn: "9780062316097",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        notes: "",
        borrowed: false
    },
    {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        category: "science",
        isbn: "9780553380163",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
        notes: "",
        borrowed: false
    },
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "technology",
        isbn: "9780132350884",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
        notes: "",
        borrowed: false
    },
    {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        category: "non-fiction",
        isbn: "9780374533557",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
        notes: "",
        borrowed: false
    },
    {
        title: "Steve Jobs",
        author: "Walter Isaacson",
        category: "biography",
        isbn: "9781451648539",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg",
        notes: "",
        borrowed: false
    }
];

// Initialize with dummy data
function initializeData() {
    if (books.length === 0) {
        books = INITIAL_BOOKS.map(book => ({
            ...book,
            id: (bookIdCounter++).toString()
        }));
        console.log('Initialized with dummy books data');
    }
}

initializeData();

// ============ API Routes ============

// GET /api/books - Get all books
app.get('/api/books', (req, res) => {
    res.json(books);
});

// GET /api/books/:id - Get a single book
app.get('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === req.params.id);
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
});

// POST /api/books - Add a new book
app.post('/api/books', (req, res) => {
    const { title, author, category, isbn, coverUrl, notes } = req.body;
    
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    
    const newBook = {
        id: (bookIdCounter++).toString(),
        title,
        author,
        category: category || 'other',
        isbn: isbn || '',
        coverUrl: coverUrl || '',
        notes: notes || '',
        borrowed: false,
        createdAt: new Date().toISOString()
    };
    
    books.push(newBook);
    res.status(201).json(newBook);
});

// PUT /api/books/:id - Update a book
app.put('/api/books/:id', (req, res) => {
    const index = books.findIndex(b => b.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    const { title, author, category, isbn, coverUrl, notes } = req.body;
    
    books[index] = {
        ...books[index],
        title: title || books[index].title,
        author: author || books[index].author,
        category: category || books[index].category,
        isbn: isbn !== undefined ? isbn : books[index].isbn,
        coverUrl: coverUrl !== undefined ? coverUrl : books[index].coverUrl,
        notes: notes !== undefined ? notes : books[index].notes
    };
    
    res.json(books[index]);
});

// DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', (req, res) => {
    const initialLength = books.length;
    books = books.filter(b => b.id !== req.params.id);
    
    if (books.length === initialLength) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    // Also remove related history
    history = history.filter(h => h.bookId !== req.params.id);
    
    res.json({ success: true });
});

// POST /api/borrow - Borrow a book
app.post('/api/borrow', (req, res) => {
    const { bookId, borrower, returnDate, notes } = req.body;
    
    if (!bookId || !borrower) {
        return res.status(400).json({ error: 'Book ID and borrower name are required' });
    }
    
    const book = books.find(b => b.id === bookId);
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    if (book.borrowed) {
        return res.status(400).json({ error: 'Book is already borrowed' });
    }
    
    // Update book status
    book.borrowed = true;
    
    // Add to history
    const historyEntry = {
        id: (historyIdCounter++).toString(),
        bookId,
        bookTitle: book.title,
        borrower,
        dateBorrowed: new Date().toISOString().split('T')[0],
        returnDate: returnDate || null,
        notes: notes || '',
        status: 'active',
        dateReturned: null
    };
    
    history.push(historyEntry);
    res.status(201).json(historyEntry);
});

// POST /api/return - Return a book
app.post('/api/return', (req, res) => {
    const { bookId } = req.body;
    
    if (!bookId) {
        return res.status(400).json({ error: 'Book ID is required' });
    }
    
    const book = books.find(b => b.id === bookId);
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    // Update book status
    book.borrowed = false;
    
    // Update history
    const historyEntry = history.find(h => h.bookId === bookId && h.status === 'active');
    if (historyEntry) {
        historyEntry.status = 'returned';
        historyEntry.dateReturned = new Date().toISOString().split('T')[0];
        return res.json(historyEntry);
    }
    
    res.json({ success: true });
});

// GET /api/history - Get borrowing history
app.get('/api/history', (req, res) => {
    // Sort by date (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.dateBorrowed) - new Date(a.dateBorrowed));
    res.json(sortedHistory);
});

// GET /api/stats - Get statistics
app.get('/api/stats', (req, res) => {
    const stats = {
        totalBooks: books.length,
        totalBorrows: history.length,
        activeBorrows: history.filter(h => h.status === 'active').length,
        returnedBorrows: history.filter(h => h.status === 'returned').length,
        categories: {}
    };
    
    // Count books by category
    const categories = ['fiction', 'non-fiction', 'science', 'history', 'technology', 'biography', 'other'];
    categories.forEach(cat => {
        stats.categories[cat] = {
            total: books.filter(b => b.category === cat).length,
            borrowed: books.filter(b => b.category === cat && b.borrowed).length
        };
    });
    
    res.json(stats);
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
