require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-library';

// Mongoose Schemas
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, default: 'other' },
    isbn: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    borrowed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const historySchema = new mongoose.Schema({
    bookId: { type: String, required: true },
    bookTitle: { type: String, default: '' },
    borrower: { type: String, required: true },
    dateBorrowed: { type: String, required: true },
    returnDate: { type: String, default: null },
    notes: { type: String, default: '' },
    status: { type: String, default: 'active' },
    dateReturned: { type: String, default: null }
});

const Book = mongoose.model('Book', bookSchema);
const History = mongoose.model('History', historySchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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

// Initialize with dummy data if no books exist
async function initializeData() {
    try {
        const count = await Book.countDocuments();
        if (count === 0) {
            await Book.insertMany(INITIAL_BOOKS);
            console.log('Initialized with dummy books data');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

initializeData();

// ============ API Routes ============

// GET /api/books - Get all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/books/:id - Get a single book
app.get('/api/books/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/books - Add a new book
app.post('/api/books', async (req, res) => {
    try {
        const { title, author, category, isbn, coverUrl, notes } = req.body;
        
        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required' });
        }
        
        const newBook = new Book({
            title,
            author,
            category: category || 'other',
            isbn: isbn || '',
            coverUrl: coverUrl || '',
            notes: notes || '',
            borrowed: false
        });
        
        await newBook.save();
        res.status(201).json(newBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/books/:id - Update a book
app.put('/api/books/:id', async (req, res) => {
    try {
        const { title, author, category, isbn, coverUrl, notes } = req.body;
        
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            { title, author, category, isbn, coverUrl, notes },
            { new: true }
        );
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        // Also remove related history
        await History.deleteMany({ bookId: req.params.id });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/borrow - Borrow a book
app.post('/api/borrow', async (req, res) => {
    try {
        const { bookId, borrower, returnDate, notes } = req.body;
        
        if (!bookId || !borrower) {
            return res.status(400).json({ error: 'Book ID and borrower name are required' });
        }
        
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.borrowed) {
            return res.status(400).json({ error: 'Book is already borrowed' });
        }
        
        // Update book status
        book.borrowed = true;
        await book.save();
        
        // Add to history
        const historyEntry = new History({
            bookId,
            bookTitle: book.title,
            borrower,
            dateBorrowed: new Date().toISOString().split('T')[0],
            returnDate: returnDate || null,
            notes: notes || '',
            status: 'active'
        });
        
        await historyEntry.save();
        res.status(201).json(historyEntry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/return - Return a book
app.post('/api/return', async (req, res) => {
    try {
        const { bookId } = req.body;
        
        if (!bookId) {
            return res.status(400).json({ error: 'Book ID is required' });
        }
        
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        // Update book status
        book.borrowed = false;
        await book.save();
        
        // Update history
        const historyEntry = await History.findOne({ bookId, status: 'active' });
        if (historyEntry) {
            historyEntry.status = 'returned';
            historyEntry.dateReturned = new Date().toISOString().split('T')[0];
            await historyEntry.save();
            return res.json(historyEntry);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/history - Get borrowing history
app.get('/api/history', async (req, res) => {
    try {
        const history = await History.find().sort({ dateBorrowed: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/stats - Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const books = await Book.find();
        const history = await History.find();
        
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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
