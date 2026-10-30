// src/routes/directory.ts
// Minimal staff directory for assignment pickers. Clients are never listed.
import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../db/client.js';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest, assertStaff } from '../services/access.service.js';

export const directoryRouter = Router();
directoryRouter.use(requireAuth, requireStaff);

const DirectoryQuery = z.object({
  query: z.object({
    role: z.nativeEnum(UserRole).optional(),
  }),
});

directoryRouter.get(
  '/users',
  validate(DirectoryQuery),
  asyncHandler(async (req, res) => {
    const actor = actorFromRequest(req);
    assertStaff(actor);
    const query = req.query as unknown as z.infer<typeof DirectoryQuery>['query'];

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: query.role ?? { not: UserRole.CLIENT },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ items: users });
  }),
);
