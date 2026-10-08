const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const defaultCategories = [
  { id: 'cat-1', name: 'Academic', description: 'Conferences, symposia, research showcases, and faculty lectures', icon: 'BookOpen', count: 12 },
  { id: 'cat-2', name: 'Workshop', description: 'Hands-on technical coding sessions, lab experiments, and skills training', icon: 'Code', count: 8 },
  { id: 'cat-3', name: 'Seminar', description: 'Industry expert panels, career advice, and keynote presentations', icon: 'Users', count: 5 },
  { id: 'cat-4', name: 'Sports', description: 'Inter-faculty tournaments, athletics, football, and fitness sessions', icon: 'Trophy', count: 9 },
  { id: 'cat-5', name: 'Career Fair', description: 'Networking with corporate partners, resume reviews, and internship hiring', icon: 'Briefcase', count: 4 },
  { id: 'cat-6', name: 'Social & Cultural', description: 'Music concerts, drama club performances, movie nights, and art workshops', icon: 'Film', count: 6 }
];

function getCategories() {
  const db = readLocalData();
  if (!db.categories || db.categories.length === 0) {
    db.categories = defaultCategories;
    writeLocalData(db);
  }
  return db.categories;
}

// GET /api/categories - Public list of event categories
router.get('/', (req, res) => {
  const categories = getCategories();
  res.json({ success: true, count: categories.length, data: categories });
});

// GET /api/categories/:id - Public category details
router.get('/:id', (req, res) => {
  const categories = getCategories();
  const category = categories.find(c => c.id === req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }
  res.json({ success: true, data: category });
});

// POST /api/categories - Create category (Admin & Organizer only)
router.post('/', requireRole(['admin', 'organizer']), (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  const db = readLocalData();
  db.categories = db.categories || defaultCategories;

  const newCategory = {
    id: `cat-${Date.now()}`,
    name,
    description: description || '',
    icon: icon || 'Tag',
    count: 0,
    createdAt: new Date().toISOString()
  };

  db.categories.push(newCategory);
  writeLocalData(db);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: newCategory
  });
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  db.categories = db.categories || defaultCategories;

  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }

  db.categories[index] = {
    ...db.categories[index],
    ...req.body,
    id: req.params.id
  };

  writeLocalData(db);

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: db.categories[index]
  });
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  db.categories = db.categories || defaultCategories;

  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }

  const deleted = db.categories.splice(index, 1);
  writeLocalData(db);

  res.json({
    success: true,
    message: 'Category deleted successfully',
    data: deleted[0]
  });
});

module.exports = router;
