const mongoose = require('mongoose');
const AssessmentVideo = require('../models/AssessmentVideo');

const getAssessmentModel = (tenantConnection) =>
  tenantConnection
    ? tenantConnection.model('AssessmentVideo', AssessmentVideo.schema, 'assessmentvideos')
    : AssessmentVideo;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 📌 Create new assessment video
exports.createAssessmentVideo = async (req, res) => {
  try {
    const { tenantId, tenantConnection, user } = req;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const AssessmentModel = getAssessmentModel(tenantConnection);

    req.body.tenantId = tenantId;
    req.body.createdBy = user.id;

    const video = await AssessmentModel.create(req.body);

    res.status(201).json({ success: true, data: video });
  } catch (err) {
    console.error('createAssessmentVideo error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// 📌 Get all assessment videos (optional filters: category, section)
exports.getAssessmentVideos = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const AssessmentModel = getAssessmentModel(tenantConnection);

    const filter = { tenantId };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.section) filter.section = req.query.section;

    const videos = await AssessmentModel.find(filter)
      .sort({ order: 1 })
      .populate('category', 'title')
      .populate('section', 'title')
      .lean();

    res.status(200).json({ success: true, total: videos.length, data: videos });
  } catch (err) {
    console.error('getAssessmentVideos error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// 📌 Get single video by ID
exports.getAssessmentVideo = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const videoId = req.params.id;

    if (!isValidObjectId(videoId)) {
      return res.status(400).json({ success: false, error: 'Invalid video ID' });
    }

    const AssessmentModel = getAssessmentModel(tenantConnection);

    const video = await AssessmentModel.findOne({ _id: videoId, tenantId })
      .populate('category', 'title')
      .populate('section', 'title');

    if (!video) {
      return res.status(404).json({ success: false, error: 'Assessment video not found' });
    }

    res.status(200).json({ success: true, data: video });
  } catch (err) {
    console.error('getAssessmentVideo error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// 📌 Update assessment video
exports.updateAssessmentVideo = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const videoId = req.params.id;

    if (!isValidObjectId(videoId)) {
      return res.status(400).json({ success: false, error: 'Invalid video ID' });
    }

    const AssessmentModel = getAssessmentModel(tenantConnection);

    const updateFields = { ...req.body, updatedAt: new Date() };
    delete updateFields._id;
    delete updateFields.tenantId;

    const updated = await AssessmentModel.findOneAndUpdate(
      { _id: videoId, tenantId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Assessment video not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateAssessmentVideo error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// 📌 Delete assessment video
exports.deleteAssessmentVideo = async (req, res) => {
  try {
    const { tenantId, tenantConnection } = req;
    const videoId = req.params.id;

    if (!isValidObjectId(videoId)) {
      return res.status(400).json({ success: false, error: 'Invalid video ID' });
    }

    const AssessmentModel = getAssessmentModel(tenantConnection);

    const deleted = await AssessmentModel.findOneAndDelete({ _id: videoId, tenantId });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Video not found or already deleted' });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment video deleted successfully',
      data: { _id: deleted._id, topic: deleted.topic }
    });
  } catch (err) {
    console.error('deleteAssessmentVideo error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
