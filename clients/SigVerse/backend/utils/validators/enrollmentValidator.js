const Joi = require('joi');

exports.enrollmentCreateSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  course_id: Joi.number().integer().required(),
  status: Joi.string().valid('active', 'completed').optional()
});

exports.enrollmentUpdateSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  course_id: Joi.number().integer().required(),
  status: Joi.string().valid('active', 'completed').required()
});

exports.enrollmentPatchSchema = Joi.object({
  status: Joi.string().valid('active', 'completed').optional(),
  user_id: Joi.number().integer().optional(),
  course_id: Joi.number().integer().optional()
}).min(1);
