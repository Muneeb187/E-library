# Personal Book Library - Specification Document

## 1. Project Overview

**Project Name:** Personal Book Library Manager
**Type:** Web Application (Single Page Application)
**Core Functionality:** A personal book library management system with features for adding, searching, categorizing books, and tracking borrowing history.
**Target Users:** Individual book enthusiasts who want to manage their personal book collection and track loans to friends/family.

---

## 2. UI/UX Specification

### Layout Structure

**Page Sections:**
- **Header:** Logo, app title, and navigation tabs
- **Main Content Area:** Dynamic content based on selected tab
- **Modal Overlay:** For adding/editing books

**Views/Tabs:**
1. **Library View** - Grid/list of all books with search and filters
2. **Categories View** - Browse books by category
3. **Borrowing History** - Track who borrowed what and when
4. **Add Book Modal** - Form to add new books

**Responsive Breakpoints:**
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

### Visual Design

**Color Palette:**
- Background Primary: `#0f0f0f` (deep black)
- Background Secondary: `#1a1a1a` (card backgrounds)
- Background Tertiary: `#252525` (input fields, hover states)
- Accent Primary: `#e8c547` (golden yellow - for highlights, buttons)
- Accent Secondary: `#c9a83a` (darker gold for hover)
- Text Primary: `#f5f5f5` (off-white)
- Text Secondary: `#a0a0a0` (muted gray)
- Success: `#4ade80` (green)
- Warning: `#fbbf24` (amber)
- Danger: `#ef4444` (red)
- Category Colors:
  - Fiction: `#8b5cf6` (purple)
  - Non-Fiction: `#06b6d4` (cyan)
  - Science: `#22c55e` (green)
  - History: `#f97316` (orange)
  - Technology: `#3b82f6` (blue)
  - Biography: `#ec4899` (pink)
  - Other: `#6b7280` (gray)

**Typography:**
- Headings: 'Playfair Display', serif (elegant, classic feel)
- Body: 'Source Sans 3', sans-serif (clean, readable)
- Font Sizes:
  - H1: 2.5rem (40px)
  - H2: 1.75rem (28px)
  - H3: 1.25rem (20px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

**Spacing System:**
- Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

**Visual Effects:**
- Card shadows: `0 4px 20px rgba(0, 0, 0, 0.4)`
- Hover transitions: 0.3s ease
- Subtle gold glow on accent elements: `0 0 20px rgba(232, 197, 71, 0.3)`
- Border radius: 12px (cards), 8px (buttons/inputs)

### Components

**Navigation Tabs:**
- Horizontal tab bar with icons and labels
- Active state: gold underline with glow
- Hover: subtle background change

**Book Card:**
- Cover image (placeholder if none)
- Title, Author
- Category badge
- Status indicator (Available/Borrowed)
- Borrow button (if available)
- Edit/Delete actions on hover

**Search Bar:**
- Large, prominent search input
- Real-time filtering
- Search icon prefix

**Category Filter:**
- Horizontal scrollable pills
- Multi-select capability
- "All" option

**Add Book Form:**
- Title (required)
- Author (required)
- Category (dropdown)
- ISBN (optional)
- Cover URL (optional)
- Notes (textarea)

**Borrow Modal:**
- Borrower name input
- Date borrowed (auto-filled)
- Expected return date
- Notes

**History Table:**
- Sortable columns
- Book title, borrower, dates, status
- Return action button
- Pagination

---

## 3. Functionality Specification

### Core Features

**1. Book Management:**
- Add new books with details (title, author, category, ISBN, cover, notes)
- Edit existing book information
- Delete books from library
- Auto-generate book ID

**2. Book Search:**
- Real-time search by title, author, or ISBN
- Case-insensitive matching
- Highlight matching terms

**3. Categorization:**
- Predefined categories: Fiction, Non-Fiction, Science, History, Technology, Biography, Other
- Filter books by single or multiple categories
- Category count badges

**4. Borrowing System:**
- Mark book as borrowed (enter borrower name, expected return date)
- Mark book as returned
- Visual status indicators (Available = green, Borrowed = amber)

**5. Borrowing History:**
- Complete log of all borrowing transactions
- Shows: Book title, Borrower name, Date borrowed, Date returned, Status
- Filter by status (All, Active, Returned)
- Sort by any column

**6. Data Persistence:**
- All data stored in localStorage
- Automatic save on any change
- Data survives page refresh

### User Interactions

- Click tab to switch views
- Type in search to filter books instantly
- Click category pill to filter
- Click "Add Book" to open modal form
- Click book card "Borrow" to open borrow modal
- Click "Return" in history to mark as returned
- Click edit icon to modify book details
- Click delete icon with confirmation

### Edge Cases

- Empty library: Show welcoming message with add book CTA
- No search results: Show "No books found" message
- Invalid form submission: Show validation errors
- Duplicate book: Allow (users may have multiple copies)
- Long titles/authors: Truncate with ellipsis
- Missing cover image: Show elegant placeholder

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme with golden accents renders correctly
- [ ] All tabs navigate properly
- [ ] Book cards display in responsive grid
- [ ] Modals open/close smoothly
- [ ] Hover effects work on interactive elements
- [ ] Category badges show correct colors

### Functional Checkpoints
- [ ] Can add a new book with all fields
- [ ] Can edit existing book
- [ ] Can delete book with confirmation
- [ ] Search filters books in real-time
- [ ] Category filter works correctly
- [ ] Can mark book as borrowed
- [ ] Can mark book as returned
- [ ] History shows all transactions
- [ ] Data persists after page refresh
- [ ] Responsive on mobile/tablet/desktop

---

## 5. Technical Implementation

**Stack:** HTML5, CSS3, Vanilla JavaScript
**Data Storage:** localStorage
**No External Dependencies** - Fully self-contained
**Single HTML File** - All code in one file for simplicity
