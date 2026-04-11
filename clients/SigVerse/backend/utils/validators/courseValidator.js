const Joi = require('joi');

// Shared between create and patch so both endpoints enforce the same YouTube-only URL rules.
const youtubeUrlSchema = Joi.string()
  .trim()
  .uri({ scheme: ['http', 'https'] })
  .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i)
  .allow('')
  .messages({
    'string.uri': 'YouTube video URL must be a valid URL',
    'string.pattern.base': 'YouTube video URL must be a valid youtube.com or youtu.be link'
  });

exports.courseCreateSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional().allow(''),
  youtube_video_url: youtubeUrlSchema.optional(),
  instructor_id: Joi.number().integer().required()
});

// PATCH requests must send at least one field, but every field remains individually optional.
exports.coursePatchSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().optional().allow(''),
  youtube_video_url: youtubeUrlSchema.optional(),
  instructor_id: Joi.number().integer().optional()
}).min(1);
