const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    chapterName: {
        type: String,
        required: true,
        trim: true
    },
    board: {
        type: String,
        required: true,
        trim: true
    },
    grade: {
        type: String,
        required: true,
        trim: true
    },
    medium: {
        type: [String], // Array of strings
        required: false,
        default: []
    },
    tenantId: {
        type: String,
        required: true,
        index: true
    }
}, {
    collection: 'Chapters',
    timestamps: true
});

module.exports = mongoose.model('Chapter', chapterSchema); 