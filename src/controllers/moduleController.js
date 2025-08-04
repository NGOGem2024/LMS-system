const mongoose = require('mongoose');
const Section = require('../models/Section');

// Utility to get tenant-scoped model
const getSectionModel = (tenantConnection) => {
  return tenantConnection
    ? tenantConnection.model('Section', Section.schema, 'sections')
    : Section;
};

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create new Section
exports.createSection = async (req, res) => {
  try {
    const { tenantId, tenantConnection, user } = req;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const SectionModel = getSectionModel(tenantConnection);
    
    req.body.tenantId = tenantId;
    req.body.createdBy = user.id;

    const section = await SectionModel.create(req.body);

    res.status(201).json({ success: true, data: section });
  } catch (err) {
    console.error('createSection error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get all Sections for a Category
exports.getSections = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const SectionModel = getSectionModel(tenantConnection);

    const filter = { tenantId };
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const sections = await SectionModel.find(filter).sort('order').lean();

    res.status(200).json({ success: true, total: sections.length, data: sections });
  } catch (err) {
    console.error('getSections error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get a single section
exports.getSection = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const sectionId = req.params.id;

    if (!isValidObjectId(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID format' });
    }

    const SectionModel = getSectionModel(tenantConnection);

    const section = await SectionModel.findOne({ _id: sectionId, tenantId });

    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    res.status(200).json({ success: true, data: section });
  } catch (err) {
    console.error('getSection error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update section
exports.updateSection = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const sectionId = req.params.id;

    if (!isValidObjectId(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID format' });
    }

    const SectionModel = getSectionModel(tenantConnection);

    const updateFields = { ...req.body, updatedAt: new Date() };
    delete updateFields._id;
    delete updateFields.tenantId;

    const updated = await SectionModel.findOneAndUpdate(
      { _id: sectionId, tenantId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateSection error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete section
exports.deleteSection = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const sectionId = req.params.id;

    if (!isValidObjectId(sectionId)) {
      return res.status(400).json({ success: false, error: 'Invalid section ID format' });
    }

    const SectionModel = getSectionModel(tenantConnection);

    const deleted = await SectionModel.findOneAndDelete({ _id: sectionId, tenantId });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Section not found or already deleted' });
    }

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
      data: { _id: deleted._id, title: deleted.title }
    });
  } catch (err) {
    console.error('deleteSection error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
