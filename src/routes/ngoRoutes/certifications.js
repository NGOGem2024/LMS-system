const express = require('express');
const router = express.Router();
const {
  getCertifications,
  getCertification,
  createCertification,
  updateCertification,
  deleteCertification,
  verifyCertification
} = require('../../controllers/ngoControllers/Certifications');
const { protect } = require('../../middleware/authMiddleware');


// Base route: /api/ngo/certificates

// GET all certificates
// POST new certificate
router.route('/')
  .get(protect, getCertifications)
  .post(protect, createCertification);

// GET/PUT/DELETE single certificate
router.route('/:id')
  .get(protect, getCertification)
  .put(protect, updateCertification)
  .delete(protect, deleteCertification);

// PUT verify certificate
router.route('/:id/verify')
  .put(protect, verifyCertification);

module.exports = router;