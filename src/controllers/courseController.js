const Category = require('../models/Category');
const mongoose = require('mongoose');

// Helper: Get correct tenant-specific model
const getCategoryModel = (tenantConnection) => {
  return tenantConnection
    ? tenantConnection.model('Category', Category.schema, 'categories')
    : Category;
};

// Helper: Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create new category
exports.createCategory = async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const CategoryModel = getCategoryModel(req.tenantConnection);
    req.body.tenantId = req.tenantId;

    const category = await CategoryModel.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (err) {
    console.error('createCategory error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get all categories for tenant
exports.getCategories = async (req, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const CategoryModel = getCategoryModel(req.tenantConnection);

    const categories = await CategoryModel.find({ tenantId: req.tenantId }).sort('-createdAt');

    res.status(200).json({
      success: true,
      total: categories.length,
      data: categories,
    });
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get single category by ID
exports.getCategory = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const categoryId = req.params.id;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID format' });
    }

    const CategoryModel = getCategoryModel(tenantConnection);

    const category = await CategoryModel.findOne({ _id: categoryId, tenantId });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('getCategory error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const categoryId = req.params.id;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID format' });
    }

    const updateData = { ...req.body, updatedAt: new Date() };
    const excludedFields = ['_id', 'tenantId', 'createdAt', '__v'];
    excludedFields.forEach(field => delete updateData[field]);

    const CategoryModel = getCategoryModel(tenantConnection);

    const updatedCategory = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ success: false, error: 'Category not found for this tenant' });
    }

    res.status(200).json({ success: true, data: updatedCategory, message: 'Category updated successfully' });
  } catch (err) {
    console.error('updateCategory error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const categoryId = req.params.id;

    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID format' });
    }

    const CategoryModel = getCategoryModel(tenantConnection);

    const deleted = await CategoryModel.findOneAndDelete({ _id: categoryId, tenantId });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Category not found or already deleted' });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: { _id: deleted._id, title: deleted.title },
    });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
