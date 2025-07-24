const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subject: {
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
    timestamps: true,
    collection: 'Subjects' // Collection names start with capital letters
});

// Add index for faster queries
subjectSchema.index({ board: 1, grade: 1 });

module.exports = mongoose.model('Subject', subjectSchema); 