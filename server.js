const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Predefined dummy data
const INITIAL_BOOKS = [
    {
        id: "1",
        title: "1984",
        author: "George Orwell",
        category: "fiction",
        isbn: "9780451524935",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        notes: "",
        borrowed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: "2",
        title: "Sapiens",
        author: "Yuval Noah Harari",
        category: "non-fiction",
        isbn: "9780062316097",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        notes: "",
        borrowed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: "3",
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        category: "science",
        isbn: "9780553380163",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
        notes: "",
        borrowed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: "4",
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "technology",
        isbn: "9780132350884",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
        notes: "",
        borrowed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: "5",
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        category: "non-fiction",
        isbn: "9780374533557",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
        notes: "",
        borrowed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: "6",
        title: "Steve Jobs",
        author: "Walter Isaacson",
        category: "biography",
        isbn: "9781451648539",
        coverUrl: "https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg",
        notes: "",
        borrowed: false,
        createdAt: new Date().toISOString()
    }
];

// Initialize with dummy data if no books exist
function initializeData() {
    if (!fs.existsSync(BOOKS_FILE) || fs.readFileSync(BOOKS_FILE, 'utf8') === '[]') {
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(INITIAL_BOOKS, null, 2));
        console.log('Initialized with dummy books data');
    }
    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
    }
}

initializeData();

// Helper functions to read/write data
function readBooks() {
    try {
        if (fs.existsSync(BOOKS_FILE)) {
            const data = fs.readFileSync(BOOKS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading books:', error);
    }
    return [];
}

function writeBooks(books) {
    try {
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));
    } catch (error) {
        console.error('Error writing books:', error);
    }
}

function readHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading history:', error);
    }
    return [];
}

function writeHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Error writing history:', error);
    }
}

// ============ API Routes ============

// GET /api/books - Get all books
app.get('/api/books', (req, res) => {
    const books = readBooks();
    res.json(books);
});

// GET /api/books/:id - Get a single book
app.get('/api/books/:id', (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
});

// POST /api/books - Add a new book
app.post('/api/books', (req, res) => {
    const books = readBooks();
    const { title, author, category, isbn, coverUrl, notes } = req.body;
    
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    
    const newBook = {
        id: Date.now().toString(),
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
    writeBooks(books);
    res.status(201).json(newBook);
});

// PUT /api/books/:id - Update a book
app.put('/api/books/:id', (req, res) => {
    const books = readBooks();
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
    
    writeBooks(books);
    res.json(books[index]);
});

// DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', (req, res) => {
    let books = readBooks();
    let history = readHistory();
    
    const initialLength = books.length;
    books = books.filter(b => b.id !== req.params.id);
    
    if (books.length === initialLength) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    // Also remove related history
    history = history.filter(h => h.bookId !== req.params.id);
    
    writeBooks(books);
    writeHistory(history);
    res.json({ success: true });
});

// POST /api/borrow - Borrow a book
app.post('/api/borrow', (req, res) => {
    const books = readBooks();
    const history = readHistory();
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
    writeBooks(books);
    
    // Add to history
    const historyEntry = {
        id: Date.now().toString(),
        bookId,
        borrower,
        dateBorrowed: new Date().toISOString().split('T')[0],
        returnDate: returnDate || null,
        notes: notes || '',
        status: 'active',
        dateReturned: null
    };
    
    history.push(historyEntry);
    writeHistory(history);
    
    res.status(201).json(historyEntry);
});

// POST /api/return - Return a book
app.post('/api/return', (req, res) => {
    const books = readBooks();
    const history = readHistory();
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
    writeBooks(books);
    
    // Update history
    const historyEntry = history.find(h => h.bookId === bookId && h.status === 'active');
    if (historyEntry) {
        historyEntry.status = 'returned';
        historyEntry.dateReturned = new Date().toISOString().split('T')[0];
        writeHistory(history);
        return res.json(historyEntry);
    }
    
    res.json({ success: true });
});

// GET /api/history - Get borrowing history
app.get('/api/history', (req, res) => {
    const history = readHistory();
    const books = readBooks();
    
    // Enrich history with book details
    const enrichedHistory = history.map(entry => {
        const book = books.find(b => b.id === entry.bookId);
        return {
            ...entry,
            bookTitle: book ? book.title : 'Unknown Book'
        };
    });
    
    // Sort by date (newest first)
    enrichedHistory.sort((a, b) => new Date(b.dateBorrowed) - new Date(a.dateBorrowed));
    
    res.json(enrichedHistory);
});

// GET /api/stats - Get statistics
app.get('/api/stats', (req, res) => {
    const books = readBooks();
    const history = readHistory();
    
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
