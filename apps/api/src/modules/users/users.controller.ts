import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import type { User } from '../auth/models/user.model';
import { authenticate, requireRoles } from '@api/middlewares/auth.middleware';
import { asyncHandler } from '@api/middlewares/async.handler';
import { UserModel } from '../auth/models/user.model';
import { ClinicModel } from '../clinics/clinic.model';

const router = Router();
router.use(authenticate);

// GET /users/me
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.user!.userId).lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found or deactivated' });
    }

    const clinic = await ClinicModel.findById(user.clinicId).lean();

    res.set('Cache-Control', 'private, max-age=60');
    return res.json({
      status: 'success',
      data: {
        userId:     String(user._id),
        fullName:   user.fullName,
        email:      user.email,
        role:       user.role,
        clinicId:   String(user.clinicId),
        clinicName: clinic?.name ?? null,
      },
    });
  }),
);

// GET /users — list all active users in caller's clinic (CLINIC_ADMIN only)
router.get(
  '/',
  requireRoles('CLINIC_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const users = await UserModel.find({
      clinicId: req.user!.clinicId,
      isActive: true,
    })
      .select('-password -refreshTokenHash -mfaSecret -resetPasswordTokenHash -resetPasswordExpiresAt')
      .lean();

    return res.json({
      status: 'success',
      data: users.map((u: User & { _id: Types.ObjectId }) => ({
        userId:   String(u._id),
        fullName: u.fullName,
        email:    u.email,
        role:     u.role,
        clinicId: String(u.clinicId),
        isActive: u.isActive,
      })),
    });
  }),
);

// GET /users/:id — get single user (CLINIC_ADMIN only, same clinic)
router.get(
  '/:id',
  requireRoles('CLINIC_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid user ID' });
    }

    const user = await UserModel.findOne({
      _id: req.params.id,
      clinicId: req.user!.clinicId,
    })
      .select('-password -refreshTokenHash -mfaSecret -resetPasswordTokenHash -resetPasswordExpiresAt')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    return res.json({
      status: 'success',
      data: {
        userId:   String(user._id),
        fullName: user.fullName,
        email:    user.email,
        role:     user.role,
        clinicId: String(user.clinicId),
        isActive: user.isActive,
      },
    });
  }),
);

// PATCH /users/:id — update fullName or role only (CLINIC_ADMIN only)
router.patch(
  '/:id',
  requireRoles('CLINIC_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid user ID' });
    }

    // Explicitly block email/password changes — use auth endpoints for those
    const { fullName, role } = req.body as { fullName?: string; role?: string };

    if (!fullName && !role) {
      return res.status(400).json({ error: 'Bad Request', message: 'Provide fullName or role to update' });
    }

    const VALID_ROLES = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'NURSE', 'ASSISTANT', 'READ_ONLY'];
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Bad Request', message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const update: Record<string, string> = {};
    if (fullName) update.fullName = fullName;
    if (role) update.role = role;

    const user = await UserModel.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.user!.clinicId },
      { $set: update },
      { new: true, select: '-password -refreshTokenHash -mfaSecret -resetPasswordTokenHash -resetPasswordExpiresAt' },
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    return res.json({
      status: 'success',
      data: {
        userId:   String(user._id),
        fullName: user.fullName,
        email:    user.email,
        role:     user.role,
        clinicId: String(user.clinicId),
        isActive: user.isActive,
      },
    });
  }),
);

// DELETE /users/:id — soft-deactivate (sets isActive=false, CLINIC_ADMIN only)
router.delete(
  '/:id',
  requireRoles('CLINIC_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid user ID' });
    }

    // Prevent self-deactivation
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot deactivate your own account' });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.user!.clinicId },
      { $set: { isActive: false, refreshTokenHash: null } },
      { new: true },
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    return res.json({ status: 'success', message: 'User deactivated' });
  }),
);

export { router as userRoutes };
