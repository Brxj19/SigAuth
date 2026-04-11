// const ApprovalRequest = require('../models/mongo/ApprovalRequest');
// const LocalCredential = require('../models/mongo/LocalCredential');
// const UserRepository = require('../repositories/UserRepository');
// const CourseService = require('./CourseService');
// const ModuleService = require('./ModuleService');
// const LessonService = require('./LessonService');

// class ApprovalService {
//   static async listForUser(user) {
//     if (user.role === 'admin') {
//       return ApprovalRequest.find({}).sort({ created_at: -1 });
//     }

//     return ApprovalRequest.find({ requester_id: user.sub }).sort({ created_at: -1 });
//   }

//   static createRequest(data) {
//     return ApprovalRequest.create(data);
//   }

//   static async approve(id, reviewerId) {
//     const request = await ApprovalRequest.findById(id);
//     if (!request) {
//       const err = new Error('Approval request not found');
//       err.status = 404;
//       throw err;
//     }

//     if (request.status !== 'pending') {
//       const err = new Error('This request has already been reviewed');
//       err.status = 409;
//       throw err;
//     }

//     let result = null;

//     switch (request.request_type) {
//       case 'instructor_signup': {
//         const credential = await LocalCredential.findById(request.entity_id);
//         if (!credential) {
//           const err = new Error('Pending instructor credential not found');
//           err.status = 404;
//           throw err;
//         }

//         let user = await UserRepository.findByEmail(credential.email);
//         if (!user) {
//           user = await UserRepository.create({
//             name: credential.name,
//             email: credential.email,
//             role: 'instructor'
//           });
//         } else if (user.role !== 'instructor') {
//           user = await UserRepository.patch(user.id, { role: 'instructor' });
//         }

//         credential.user_id = user.id;
//         credential.status = 'active';
//         credential.requested_role = 'instructor';
//         await credential.save();
//         result = user;
//         break;
//       }
//       case 'course':
//         result = await this.applyResourceRequest(CourseService, request);
//         break;
//       case 'module':
//         result = await this.applyResourceRequest(ModuleService, request);
//         break;
//       case 'lesson':
//         result = await this.applyResourceRequest(LessonService, request);
//         break;
//       default: {
//         const err = new Error('Unsupported approval request type');
//         err.status = 400;
//         throw err;
//       }
//     }

//     request.status = 'approved';
//     request.reviewer_id = reviewerId;
//     request.reviewed_at = new Date();
//     await request.save();

//     return { request, result };
//   }

//   static async reject(id, reviewerId, note = '') {
//     const request = await ApprovalRequest.findById(id);
//     if (!request) {
//       const err = new Error('Approval request not found');
//       err.status = 404;
//       throw err;
//     }

//     if (request.status !== 'pending') {
//       const err = new Error('This request has already been reviewed');
//       err.status = 409;
//       throw err;
//     }

//     request.status = 'rejected';
//     request.reviewer_id = reviewerId;
//     request.note = note;
//     request.reviewed_at = new Date();
//     await request.save();

//     if (request.request_type === 'instructor_signup') {
//       const credential = await LocalCredential.findById(request.entity_id);
//       if (credential) {
//         credential.status = 'disabled';
//         await credential.save();
//       }
//     }

//     return request;
//   }

//   static async applyResourceRequest(service, request) {
//     if (request.action === 'create') {
//       return service.create(request.payload);
//     }

//     if (request.action === 'update') {
//       return service.patch(request.entity_id, request.payload);
//     }

//     if (request.action === 'delete') {
//       await service.remove(request.entity_id);
//       return true;
//     }

//     const err = new Error('Unsupported approval request action');
//     err.status = 400;
//     throw err;
//   }
// }

// module.exports = ApprovalService;



const ApprovalRequest = require('../models/mongo/ApprovalRequest');
const LocalCredential = require('../models/mongo/LocalCredential');
const UserRepository = require('../repositories/UserRepository');
const CourseService = require('./CourseService');
const ModuleService = require('./ModuleService');
const LessonService = require('./LessonService');
const EmailService = require('./EmailService');


// ApprovalService handles the logic for managing approval requests for instructor signups and course/module/lesson changes, including creating requests, approving/rejecting them, and sending notification emails to users about the outcomes of their requests.
class ApprovalService {
  static async listForUser(user) {
    if (user.role === 'admin') {
      return ApprovalRequest.find({}).sort({ created_at: -1 });
    }

    return ApprovalRequest.find({ requester_id: user.sub }).sort({ created_at: -1 });
  }

  static normalizeCourseTitle(title = '') {
    return String(title).trim().replace(/\s+/g, ' ').toLowerCase();
  }
  // This method checks if a course creation or update request is allowed based on existing courses and pending requests to prevent duplicates and conflicts. It throws a 409 error if a similar course already exists or if there is a pending request for the same course title.
  static async assertCourseRequestAllowed(data) {
    if (data.request_type !== 'course' || !data.requester_id) return;

    if (data.action === 'create') {
      const normalizedTitle = this.normalizeCourseTitle(data.payload?.title);

      if (!normalizedTitle) return;

      const existingCourses = await CourseService.getAll();
      const hasExistingCourse = existingCourses.some(
        (course) =>
          course.instructor_id === data.requester_id &&
          this.normalizeCourseTitle(course.title) === normalizedTitle
      );

      if (hasExistingCourse) {
        const err = new Error('You already have a course with this title. Edit the existing course instead of submitting a new request.');
        err.status = 409;
        throw err;
      }

      const pendingCreateRequests = await ApprovalRequest.find({
        requester_id: data.requester_id,
        request_type: 'course',
        action: 'create',
        status: 'pending'
      });

      const duplicatePendingCreate = pendingCreateRequests.some(
        (request) => this.normalizeCourseTitle(request.payload?.title) === normalizedTitle
      );

      if (duplicatePendingCreate) {
        const err = new Error('A pending course creation request with this title already exists. Please wait for admin review.');
        err.status = 409;
        throw err;
      }

      return;
    }

    if (data.entity_id == null) return;

    const pendingCourseRequest = await ApprovalRequest.findOne({
      requester_id: data.requester_id,
      request_type: 'course',
      entity_id: data.entity_id,
      status: 'pending'
    });

    if (!pendingCourseRequest) return;

    const err = new Error(
      pendingCourseRequest.action === data.action
        ? `A pending course ${data.action} request already exists for this course. Please wait for admin review.`
        : 'A pending course request already exists for this course. Please wait for admin review before submitting another change.'
    );
    err.status = 409;
    throw err;
  }
  // This method creates a new approval request after validating that it is allowed (for course requests) and returns the created request document.
  static async createRequest(data) {
    await this.assertCourseRequestAllowed(data);
    return ApprovalRequest.create(data);
  }
  // This method attempts to claim a pending approval request for review by setting a processing lock and reviewer information. If the request is already being processed or has been reviewed, it throws a 409 error. If the request does not exist, it throws a 404 error.
  static async claimPendingRequest(id, reviewerId) {
    const reviewTimestamp = new Date();
    const request = await ApprovalRequest.findOneAndUpdate(
      { _id: id, status: 'pending', processing_lock: { $ne: true } },
      {
        $set: {
          processing_lock: true,
          reviewer_id: reviewerId,
          reviewed_at: reviewTimestamp
        }
      },
      { new: true }
    );

    if (request) return request;

    const existing = await ApprovalRequest.findById(id);
    if (!existing) {
      const err = new Error('Approval request not found');
      err.status = 404;
      throw err;
    }

    const err = new Error(
      existing.status !== 'pending'
        ? 'This request has already been reviewed'
        : 'This request is already being reviewed'
    );
    err.status = 409;
    throw err;
  }
  // This method releases the processing lock on a pending approval request, allowing it to be claimed again for review. It is typically called if an error occurs during the approval process to ensure the request can be reviewed by another admin.
  static async releasePendingRequestLock(id) {
    await ApprovalRequest.updateOne(
      { _id: id, status: 'pending' },
      {
        $set: {
          processing_lock: false,
          reviewer_id: null,
          reviewed_at: null
        }
      }
    );
  }
  // This method handles the approval of an approval request by first claiming it for review, then performing the necessary actions based on the request type (e.g., activating an instructor account, creating/updating/deleting a course/module/lesson), and finally updating the request status to approved. It also sends notification emails to users about the outcome of their requests. If any error occurs during the process, it releases the processing lock on the request to allow other admins to review it.
  static async approve(id, reviewerId) {
    const request = await this.claimPendingRequest(id, reviewerId);

    let result = null;
    let instructorApprovalEmail = null;
    let courseApprovalEmail = null;

    try {
      switch (request.request_type) {
        case 'instructor_signup': {
          const credential = await LocalCredential.findById(request.entity_id);
          if (!credential) {
            const err = new Error('Pending instructor credential not found');
            err.status = 404;
            throw err;
          }

          let user = await UserRepository.findByEmail(credential.email);
          if (!user) {
            user = await UserRepository.create({
              name: credential.name,
              email: credential.email,
              role: 'instructor'
            });
          } else if (user.role !== 'instructor') {
            user = await UserRepository.patch(user.id, { role: 'instructor' });
          }

          credential.user_id = user.id;
          credential.status = 'active';
          credential.requested_role = 'instructor';
          await credential.save();
          result = user;
          instructorApprovalEmail = {
            name: credential.name,
            email: credential.email
          };
          break;
        }
        case 'course':
          result = await this.applyResourceRequest(CourseService, request);
          if (request.requester_id) {
            const instructor = await UserRepository.findById(request.requester_id);
            if (instructor?.email) {
              courseApprovalEmail = {
                name: instructor.name,
                email: instructor.email,
                title: result?.title || request.payload?.title || 'your course',
                action: request.action
              };
            }
          }
          break;
        case 'module':
          result = await this.applyResourceRequest(ModuleService, request);
          break;
        case 'lesson':
          result = await this.applyResourceRequest(LessonService, request);
          break;
        default: {
          const err = new Error('Unsupported approval request type');
          err.status = 400;
          throw err;
        }
      }

      request.status = 'approved';
      request.processing_lock = false;
      request.reviewer_id = reviewerId;
      request.reviewed_at = new Date();
      await request.save();

      // Send notification emails after successful approval
      if (instructorApprovalEmail) {
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
        await EmailService.sendEmail({
          to: instructorApprovalEmail.email,
          subject: '🎉 Welcome to Sigverse — Instructor Account Approved!',
          text: `Congratulations ${instructorApprovalEmail.name}!\n\nYour instructor account on Sigverse has been approved by our admin team. You now have full access to create courses, modules, and lessons on the platform.\n\nLog in here: ${loginUrl}\n\nWelcome aboard!\n— The Sigverse Team`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.25);">
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%); padding: 36px 32px 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Instructor Account Approved!</h1>
              </div>
              <div style="padding: 32px; color: #d1d5db; line-height: 1.7; font-size: 15px;">
                <p style="margin: 0 0 16px;">Hello <strong style="color: #ffffff;">${instructorApprovalEmail.name}</strong>,</p>
                <p style="margin: 0 0 16px;">Great news! Our admin team has reviewed and <strong style="color: #a78bfa;">approved</strong> your instructor application on <strong style="color: #ffffff;">Sigverse</strong>.</p>
                <p style="margin: 0 0 20px;">You now have full access to:</p>
                <ul style="margin: 0 0 24px; padding-left: 20px; color: #c4b5fd;">
                  <li style="margin-bottom: 6px;">Create and manage courses</li>
                  <li style="margin-bottom: 6px;">Add modules and lessons</li>
                  <li style="margin-bottom: 6px;">Track learner enrollments &amp; progress</li>
                </ul>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Log In to Sigverse</a>
                </div>
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">Welcome aboard — we're excited to have you! 🚀</p>
              </div>
              <div style="padding: 16px 32px; background: rgba(139, 92, 246, 0.08); text-align: center; font-size: 12px; color: #6b7280;">
                &copy; Sigverse Learning Platform
              </div>
            </div>
          `
        }).catch((emailErr) => console.error('[ApprovalService] Failed to send approval email:', emailErr.message));
      }

      // Send course approval email if applicable
      if (courseApprovalEmail) {
        const instructorUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/instructor`;
        const actionLabel = {
          create: 'created',
          update: 'updated',
          delete: 'removed'
        }[courseApprovalEmail.action] || 'approved';
        const actionTitle = {
          create: 'Course Approved',
          update: 'Course Update Approved',
          delete: 'Course Removal Approved'
        }[courseApprovalEmail.action] || 'Course Request Approved';

        await EmailService.sendEmail({
          to: courseApprovalEmail.email,
          subject: `Sigverse — ${actionTitle}`,
          text: `Hello ${courseApprovalEmail.name},\n\nYour course request for "${courseApprovalEmail.title}" has been approved by the admin team. The request has now been ${actionLabel} in Sigverse.\n\nOpen your instructor workspace here: ${instructorUrl}\n\n— The Sigverse Team`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(59, 130, 246, 0.25);">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0f172a 100%); padding: 32px 28px 24px; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 10px;">📚</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">${actionTitle}</h1>
              </div>
              <div style="padding: 28px; color: #dbeafe; line-height: 1.7; font-size: 15px;">
                <p style="margin: 0 0 14px;">Hello <strong style="color: #ffffff;">${courseApprovalEmail.name}</strong>,</p>
                <p style="margin: 0 0 14px;">Your course request for <strong style="color: #ffffff;">${courseApprovalEmail.title}</strong> has been approved by the admin team.</p>
                <p style="margin: 0 0 20px;">This request has now been <strong style="color: #93c5fd;">${actionLabel}</strong> in Sigverse. You can open your instructor workspace to continue managing your content.</p>
                <div style="text-align: center; margin: 24px 0 8px;">
                  <a href="${instructorUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 600;">Open Instructor Panel</a>
                </div>
              </div>
              <div style="padding: 14px 28px; background: rgba(37, 99, 235, 0.08); text-align: center; font-size: 12px; color: #93c5fd;">
                &copy; Sigverse Learning Platform
              </div>
            </div>
          `
        }).catch((emailErr) => console.error('[ApprovalService] Failed to send course approval email:', emailErr.message));
      }
    } catch (err) {
      await this.releasePendingRequestLock(request._id);
      throw err;
    }

    return { request, result };
  }
  // This method handles the rejection of an approval request by first claiming it for review, then updating the request status to rejected and adding any admin notes. If the request is for an instructor signup, it also disables the associated credential. Finally, it sends a notification email to the user about the rejection and any admin notes provided. If any error occurs during the process, it releases the processing lock on the request to allow other admins to review it.
  static async reject(id, reviewerId, note = '') {
    const request = await this.claimPendingRequest(id, reviewerId);

    try {
      request.status = 'rejected';
      request.processing_lock = false;
      request.reviewer_id = reviewerId;
      request.note = note;
      request.reviewed_at = new Date();
      await request.save();

      if (request.request_type === 'instructor_signup') {
        const credential = await LocalCredential.findById(request.entity_id);
        if (credential) {
          credential.status = 'disabled';
          await credential.save();

          // Send rejection notification email
          const noteText = note ? `\n\nAdmin note: ${note}` : '';

          await EmailService.sendEmail({
            to: credential.email,
            subject: 'Sigverse — Instructor Application Update',
            text: `Hello ${credential.name},\n\nThank you for your interest in becoming an instructor on Sigverse. After review, your application was not approved at this time.${noteText}\n\nYou can still use the platform as a learner. If you believe this was a mistake, feel free to reach out to our support team.\n\n— The Sigverse Team`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f1a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(239, 68, 68, 0.25);">
                <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%); padding: 36px 32px 28px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 8px;">📋</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Application Update</h1>
                </div>
                <div style="padding: 32px; color: #d1d5db; line-height: 1.7; font-size: 15px;">
                  <p style="margin: 0 0 16px;">Hello <strong style="color: #ffffff;">${credential.name}</strong>,</p>
                  <p style="margin: 0 0 16px;">Thank you for your interest in becoming an instructor on <strong style="color: #ffffff;">Sigverse</strong>. After careful review, your application was <strong style="color: #fca5a5;">not approved</strong> at this time.</p>
                  ${note ? `<div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #fca5a5;"><strong>Admin note:</strong> ${note}</p></div>` : ''}
                  <p style="margin: 16px 0 0;">You can still enjoy Sigverse as a learner. If you believe this was an error, you are welcome to reapply or contact our support team.</p>
                </div>
                <div style="padding: 16px 32px; background: rgba(239, 68, 68, 0.08); text-align: center; font-size: 12px; color: #6b7280;">
                  &copy; Sigverse Learning Platform
                </div>
              </div>
            `
          }).catch((emailErr) => console.error('[ApprovalService] Failed to send rejection email:', emailErr.message));
        }
      }
    } catch (err) {
      await this.releasePendingRequestLock(request._id);
      throw err;
    }

    return request;
  }
  // This helper method applies the changes specified in an approval request to the appropriate service (CourseService, ModuleService, or LessonService) based on the request type and action. It supports creating new resources, updating existing ones, and deleting resources as requested by the user. If the request action is not recognized, it throws a 400 error.
  static async applyResourceRequest(service, request) {
    if (request.action === 'create') {
      return service.create(request.payload);
    }

    if (request.action === 'update') {
      return service.patch(request.entity_id, request.payload);
    }

    if (request.action === 'delete') {
      await service.remove(request.entity_id);
      return true;
    }

    const err = new Error('Unsupported approval request action');
    err.status = 400;
    throw err;
  }
}

module.exports = ApprovalService;
