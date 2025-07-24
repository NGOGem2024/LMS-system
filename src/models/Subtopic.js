const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
    subName: {
        type: String,
        required: true,
        trim: true
    },
    chapterName: {
        type: String,
        required: true,
        trim: true
    },
    topicName: {
        type: String,
        required: true,
        trim: true
    },
    subtopicName: {
        type: String,
        required: true,
        trim: true
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    collection: 'Subtopics',
    timestamps: true
});

module.exports = mongoose.model('Subtopic', subtopicSchema); 