const Joi = require('joi');

const ratingSchema = Joi.number()
  .integer()
  .min(1)
  .max(5)
  .required()
  .messages({
    'number.base': 'Ratings must be numeric values between 1 and 5',
    'number.min': 'Ratings must be at least 1',
    'number.max': 'Ratings must be at most 5'
  });

exports.courseFeedbackUpsertSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  course_rating: ratingSchema,
  instructor_rating: ratingSchema,
  feedback: Joi.string().trim().min(8).max(1000).required()
});
