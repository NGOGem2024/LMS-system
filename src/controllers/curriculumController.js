const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Chapter = require('../models/Chapter');
const Video = require('../models/Video');
const Quiz = require('../models/Quiz');

// Subject Controller
exports.createSubject = asyncHandler(async (req, res) => {
    const { subject, board, grade, medium } = req.body;
    
    // Convert medium to array if it's not already
    const mediumArray = Array.isArray(medium) ? medium : medium ? [medium] : [];
    
    // Add tenant to req.body
    req.body.tenantId = req.tenantId;
    
    const subjectObj = await Subject.create({
        subject,
        board,
        grade,
        medium: mediumArray,
        tenantId: req.tenantId
    });
    
    res.status(201).json({
        success: true,
        data: subjectObj
    });
});

exports.getSubjects = asyncHandler(async (req, res) => {
    const { board, grade, medium } = req.query;
    let query = { tenantId: req.tenantId };
    
    if (board) query.board = board;
    if (grade) query.grade = grade;
    if (medium) {
        query.medium = Array.isArray(medium) ? { $in: medium } : medium;
    }
    
    const subjects = await Subject.find(query);
    res.json({
        success: true,
        count: subjects.length,
        data: subjects
    });
});

exports.getSubjectById = asyncHandler(async (req, res) => {
    const subject = await Subject.findOne({
        _id: req.params.id,
        tenantId: req.tenantId
    });
    
    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found'
        });
    }
    
    res.json({
        success: true,
        data: subject
    });
});

exports.updateSubject = asyncHandler(async (req, res) => {
    const { subject, board, grade, medium } = req.body;
    
    const updatedSubject = await Subject.findOneAndUpdate(
        {
            _id: req.params.id,
            tenantId: req.tenantId
        },
        {
            subject,
            board,
            grade,
            medium: Array.isArray(medium) ? medium : medium ? [medium] : []
        },
        { new: true, runValidators: true }
    );
    
    if (!updatedSubject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found'
        });
    }
    
    res.json({
        success: true,
        data: updatedSubject
    });
});

exports.deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findOneAndDelete({
        _id: req.params.id,
        tenantId: req.tenantId
    });
    
    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found'
        });
    }
    
    res.json({
        success: true,
        data: {}
    });
});

// Topic Controller
exports.createTopic = asyncHandler(async (req, res) => {
    const { subjectId, chapterId, topicName } = req.body;
    
    const topic = await Topic.create({
        subjectId,
        chapterId,
        topicName,
        tenantId: req.tenantId
    });
    
    res.status(201).json({
        success: true,
        data: topic
    });
});

exports.getTopicsBySubject = asyncHandler(async (req, res) => {
    const topics = await Topic.find({ 
        subjectId: req.params.subjectId,
        tenantId: req.tenantId
    });
    
    res.json({
        success: true,
        count: topics.length,
        data: topics
    });
});

// Subtopic Controller
exports.createSubtopic = asyncHandler(async (req, res) => {
    const { subName, chapterName, topicName, subtopicName } = req.body;
    
    const subtopic = await Subtopic.create({
        subName,
        chapterName,
        topicName,
        subtopicName,
        tenantId: req.tenantId
    });
    
    res.status(201).json({
        success: true,
        data: subtopic
    });
});

exports.getSubtopicsByTopic = asyncHandler(async (req, res) => {
    const subtopics = await Subtopic.find({ 
        topicId: req.params.topicId,
        tenantId: req.tenantId
    });
    
    res.json({
        success: true,
        count: subtopics.length,
        data: subtopics
    });
});

// Chapter Controller
exports.createChapter = asyncHandler(async (req, res) => {
    const { subject, chapterName, board, grade, medium } = req.body;
    
    const mediumArray = Array.isArray(medium) ? medium : medium ? [medium] : [];
    
    const chapter = await Chapter.create({
        subject,
        chapterName,
        board,
        grade,
        medium: mediumArray,
        tenantId: req.tenantId
    });
    
    res.status(201).json({
        success: true,
        data: chapter
    });
});

exports.getChaptersBySubtopic = asyncHandler(async (req, res) => {
    const chapters = await Chapter.find({ 
        subtopicId: req.params.subtopicId,
        tenantId: req.tenantId
    });
    
    res.json({
        success: true,
        count: chapters.length,
        data: chapters
    });
});

// Video Controller
exports.createVideo = asyncHandler(async (req, res) => {
    const { subName, topicName, chapterName, subtopicName, videoUrl } = req.body;
    
    const video = await Video.create({
        subName,
        topicName,
        chapterName,
        subtopicName,
        videoUrl,
        tenantId: req.tenantId
    });
    
    res.status(201).json({
        success: true,
        data: video
    });
});

exports.getVideosByChapter = asyncHandler(async (req, res) => {
    const videos = await Video.find({ 
        chapterId: req.params.chapterId,
        tenantId: req.tenantId
    });
    
    res.json({
        success: true,
        count: videos.length,
        data: videos
    });
});

// Quiz Controller
exports.createQuiz = asyncHandler(async (req, res) => {
    const { videoId, videoUrl, board, grade, medium, subName, topicName, chapterName, subtopicName, questions } = req.body;
    
    const mediumArray = Array.isArray(medium) ? medium : medium ? [medium] : [];
    
    const quiz = await Quiz.create({
        videoId,
        videoUrl,
        board,
        grade,
        medium: mediumArray,
        subName,
        topicName,
        chapterName,
        subtopicName,
        questions,
        tenantId: req.tenantId
    });
    
    res.status(201).json({
        success: true,
        data: quiz
    });
});

exports.getQuizByVideo = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findOne({ 
        videoId: req.params.videoId,
        tenantId: req.tenantId
    });
    
    if (!quiz) {
        return res.status(404).json({
            success: false,
            message: 'Quiz not found for this video'
        });
    }
    
    res.json({
        success: true,
        data: quiz
    });
});

// Curriculum Structure
exports.getCurriculumStructure = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ tenantId: req.tenantId }).lean();
    const topics = await Topic.find({ tenantId: req.tenantId }).lean();
    const subtopics = await Subtopic.find({ tenantId: req.tenantId }).lean();
    const chapters = await Chapter.find({ tenantId: req.tenantId }).lean();
    const videos = await Video.find({ tenantId: req.tenantId }).lean();
    
    const structure = subjects.map(subject => {
        const subjectTopics = topics.filter(t => t.subjectId.toString() === subject._id.toString());
        
        return {
            ...subject,
            topics: subjectTopics.map(topic => {
                const topicSubtopics = subtopics.filter(st => st.topicId && st.topicId.toString() === topic._id.toString());
                
                return {
                    ...topic,
                    subtopics: topicSubtopics.map(subtopic => {
                        const subtopicChapters = chapters.filter(c => c.subtopicId && c.subtopicId.toString() === subtopic._id.toString());
                        
                        return {
                            ...subtopic,
                            chapters: subtopicChapters.map(chapter => {
                                const chapterVideos = videos.filter(v => v.chapterId && v.chapterId.toString() === chapter._id.toString());
                                
                                return {
                                    ...chapter,
                                    videos: chapterVideos
                                };
                            })
                        };
                    })
                };
            })
        };
    });
    
    res.json({
        success: true,
        data: structure
    });
});

// Get unique board values
exports.getBoards = asyncHandler(async (req, res) => {
  try {
    const boards = await Subject.find({ tenantId: req.tenantId }, { board: 1 }).lean();
    const uniqueBoards = [...new Set(boards.map(s => s.board).filter(Boolean))];

    res.json({
      success: true,
      data: uniqueBoards
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching boards',
      error: err.message
    });
  }
});

// Get unique medium values
exports.getMediums = asyncHandler(async (req, res) => {
  try {
    const subjects = await Subject.find({ tenantId: req.tenantId }, { medium: 1 }).lean();

    const allMediums = subjects.flatMap(s =>
      Array.isArray(s.medium) ? s.medium : s.medium ? [s.medium] : []
    );

    const uniqueMediums = [...new Set(allMediums)];

    res.json({
      success: true,
      data: uniqueMediums
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mediums',
      error: err.message
    });
  }
});

exports.postCurriculumForm = asyncHandler(async (req, res) => {
  try {
    const { subject, board, grade, medium, chapters } = req.body;

    if (!subject || !board || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, board, or grade'
      });
    }

    const mediumArray = Array.isArray(medium) ? medium : medium ? [medium] : [];

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Create Subject
      const subjectObj = await Subject.create([{
        subject,
        board,
        grade,
        medium: mediumArray,
        tenantId: req.tenantId
      }], { session });

      // Step 2: Process Chapters
      for (const chapter of chapters) {
        // Create Chapter
        const chapterDoc = await Chapter.create([{
          subject,
          board,
          grade,
          medium: mediumArray,
          chapterName: chapter.chapterName,
          tenantId: req.tenantId
        }], { session });

        // Step 3: Create Topic (if topicName exists)
        let topicDoc = null;
        if (chapter.topicName && chapter.topicName.trim()) {
          topicDoc = await Topic.create([{
            subjectId: subjectObj[0]._id,
            chapterId: chapterDoc[0]._id,
            topicName: chapter.topicName,
            tenantId: req.tenantId
          }], { session });
        }

        // Step 4: Create Subtopic (if subtopicName exists)
        let subtopicDoc = null;
        if (chapter.subtopicName && chapter.subtopicName.trim()) {
          subtopicDoc = await Subtopic.create([{
            subName: subject,
            chapterName: chapter.chapterName,
            topicName: chapter.topicName || 'General',
            subtopicName: chapter.subtopicName,
            tenantId: req.tenantId
          }], { session });
        }

        // Step 5: Process Videos
        for (const video of chapter.videos) {
          if (!video.videoUrl) continue;
          
          const videoDocs = await Video.create([{
            subName: subject,
            topicName: chapter.topicName || 'General',
            chapterName: chapter.chapterName,
            subtopicName: chapter.subtopicName || 'General',
            videoUrl: video.videoUrl,
            tenantId: req.tenantId
          }], { session });

          // Step 6: Create Quiz under Video
          if (video.quiz && Array.isArray(video.quiz.questions) && video.quiz.questions.length > 0) {
            await Quiz.create([{
              videoId: videoDocs[0]._id.toString(),
              videoUrl: video.videoUrl,
              board,
              grade,
              medium: mediumArray,
              subName: subject,
              topicName: chapter.topicName || 'General',
              chapterName: chapter.chapterName,
              subtopicName: chapter.subtopicName || 'General',
              questions: video.quiz.questions,
              tenantId: req.tenantId
            }], { session });
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        data: subjectObj[0]
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create curriculum (transaction error)',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Error in postCurriculumForm:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create curriculum',
      error: error.message
    });
  }
}); 