const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    subName: {
        type: String,
        required: true,
        trim: true
    },
    topicName: {
        type: String,
        required: true,
        trim: true
    },
    chapterName: {
        type: String,
        required: true,
        trim: true
    },
    subtopicName: {
        type: String,
        required: true,
        trim: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    collection: 'Videos',
    timestamps: true
});

module.exports = mongoose.model('Video', videoSchema); 