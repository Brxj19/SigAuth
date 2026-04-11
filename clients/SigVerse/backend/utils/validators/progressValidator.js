const Joi = require('joi');

exports.progressCreateSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  course_id: Joi.number().integer().required(),
  completion_percentage: Joi.number().min(0).max(100).required()
});

exports.progressPatchSchema = Joi.object({
  user_id: Joi.number().integer().optional(),
  course_id: Joi.number().integer().optional(),
  completion_percentage: Joi.number().min(0).max(100).optional()
}).min(1);
