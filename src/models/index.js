const User = require('./User');
const Tenant = require('./Tenant');
const Course = require('./Course');
const Assignment = require('./Assignment');
const Quiz = require('./Quiz');
const UserProgress = require('./UserProgress');
const Institution = require('./Institution');
const { Certification, IssuedCertification } = require('./Certification');

module.exports = {
  User,
  Tenant,
  Course,
  Assignment,
  Quiz,
  UserProgress,
  Institution,
  Certification,
  IssuedCertification
}; 