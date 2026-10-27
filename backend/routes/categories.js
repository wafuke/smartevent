const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity } = require('../db');
const { requireRole } = require('../middleware/auth');

function withCounts(db, c) {
  return { ...c, count: (db.events || []).filter((e) => e.category === c.name && e.status !== 'Cancelled').length };
}

// GET /api/categories - public, with live event counts
router.get('/', (req, res) => {
  const db = readLocalData();
  const data = (db.categories || []).map((c) => withCounts(db, c));
  res.json({ success: true, count: data.length, data });
});

router.get('/:id', (req, res) => {
  const db = readLocalData();
  const category = (db.categories || []).find((c) => c.id === req.params.id);
  if (!category) return res.status(404).json({ success: false, error: 'Category not found.' });
  res.json({ success: true, data: withCounts(db, category) });
});

// POST /api/categories - ADMIN only
router.post('/', requireRole(['admin']), (req, res) => {
  const name = String((req.body || {}).name || '').trim();
  if (name.length < 2 || name.length > 40) {
    return res.status(400).json({ success: false, error: 'Category name must be 2-40 characters.' });
  }
  const db = readLocalData();
  db.categories = db.categories || [];
  if (db.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'A category with this name already exists.' });
  }
  const category = {
    id: `cat-${Date.now()}`,
    name,
    description: String(req.body.description || '').trim().slice(0, 200),
    color: /^#[0-9a-fA-F]{6}$/.test(req.body.color || '') ? req.body.color : '#003366',
    createdAt: new Date().toISOString()
  };
  db.categories.push(category);
  logActivity(db, 'CATEGORY_CREATED', `${req.user.name} created category "${name}"`);
  writeLocalData(db);
  res.status(201).json({ success: true, message: 'Category created successfully', data: withCounts(db, category) });
});

// PUT /api/categories/:id - ADMIN only (renaming cascades to events)
router.put('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const category = (db.categories || []).find((c) => c.id === req.params.id);
  if (!category) return res.status(404).json({ success: false, error: 'Category not found.' });

  const { name, description, color } = req.body || {};
  if (name !== undefined) {
    const n = String(name).trim();
    if (n.length < 2 || n.length > 40) return res.status(400).json({ success: false, error: 'Category name must be 2-40 characters.' });
    if (db.categories.some((c) => c.id !== category.id && c.name.toLowerCase() === n.toLowerCase())) {
      return res.status(409).json({ success: false, error: 'A category with this name already exists.' });
    }
    if (n !== category.name) {
      (db.events || []).forEach((e) => {
        if (e.category === category.name) e.category = n;
      });
      category.name = n;
    }
  }
  if (description !== undefined) category.description = String(description).trim().slice(0, 200);
  if (color !== undefined && /^#[0-9a-fA-F]{6}$/.test(color)) category.color = color;

  logActivity(db, 'CATEGORY_UPDATED', `${req.user.name} updated category "${category.name}"`);
  writeLocalData(db);
  res.json({ success: true, message: 'Category updated successfully', data: withCounts(db, category) });
});

// DELETE /api/categories/:id - ADMIN only, blocked while events use it
router.delete('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const index = (db.categories || []).findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Category not found.' });

  const category = db.categories[index];
  const inUse = (db.events || []).filter((e) => e.category === category.name).length;
  if (inUse > 0) {
    return res.status(409).json({
      success: false,
      error: `Cannot delete "${category.name}" - ${inUse} event(s) still use it. Re-categorise or delete them first.`
    });
  }
  db.categories.splice(index, 1);
  logActivity(db, 'CATEGORY_DELETED', `${req.user.name} deleted category "${category.name}"`);
  writeLocalData(db);
  res.json({ success: true, message: 'Category deleted successfully', data: category });
});

module.exports = router;
