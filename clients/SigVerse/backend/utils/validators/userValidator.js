const Joi = require('joi');

const emailRule = Joi.string().email({ tlds: { allow: false } });

// Validation schema for updating a user
exports.userUpdateSchema = Joi.object({
  name: Joi.string().required(),
  email: emailRule.required(),
  role: Joi.string().valid('learner', 'instructor', 'admin').required()
});

// Validation schema for patching a user (partial update)
exports.userPatchSchema = Joi.object({
  name: Joi.string().optional(),
  email: emailRule.optional(),
  role: Joi.string().valid('learner', 'instructor', 'admin').optional()
}).min(1);

 