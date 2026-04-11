const Joi = require('joi');

exports.moduleCreateSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  module_name: Joi.string().min(2).required(),
  // Module ordering is 1-based so clients cannot create a zero or negative position.
  sequence_order: Joi.number().integer().min(1).required()
});

// PATCH requests must send at least one field, but every field remains individually optional.
exports.modulePatchSchema = Joi.object({
  course_id: Joi.number().integer().optional(),
  module_name: Joi.string().min(2).optional(),
  sequence_order: Joi.number().integer().min(1).optional()
}).min(1);
