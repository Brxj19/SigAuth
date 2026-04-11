const Joi = require('joi');

exports.performanceCreateSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  course_id: Joi.number().integer().required(),
  score: Joi.number().min(0).max(100).required()
});

exports.performancePatchSchema = Joi.object({
  user_id: Joi.number().integer().optional(),
  course_id: Joi.number().integer().optional(),
  score: Joi.number().min(0).max(100).optional()
}).min(1);
