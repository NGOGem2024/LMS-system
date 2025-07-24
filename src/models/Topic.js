const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        required: true
    },
    topicName: {
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
    collection: 'Topics',
    timestamps: true
});

module.exports = mongoose.model('Topic', topicSchema); 