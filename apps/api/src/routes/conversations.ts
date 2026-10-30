// src/routes/conversations.ts
// Communications inbox. Conversations are enquiries — they never become
// projects here; only POST /api/visits/confirm does that.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  addMessage,
  createConversation,
  getConversation,
  listConversations,
  updateConversation,
} from '../services/conversation.service.js';
import {
  AddMessageSchema,
  ConversationListQuery,
  CreateConversationSchema,
  IdParamSchema,
  UpdateConversationSchema,
} from './schemas.js';
import { getParam } from './request.js';

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth, requireStaff);

conversationsRouter.get(
  '/',
  validate(ConversationListQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof ConversationListQuery>['query'];
    const result = await listConversations(actorFromRequest(req), {
      status: query.status,
      assignedStaffId: query.assignedStaffId,
      search: query.q,
      skip: query.skip,
      take: query.take,
    });
    res.json(result);
  }),
);

conversationsRouter.post(
  '/',
  validate(CreateConversationSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof CreateConversationSchema>['body'];
    const conversation = await createConversation(
      actorFromRequest(req),
      {
        contactId: body.contactId,
        contact: body.contact,
        channel: body.channel,
        subject: body.subject,
        assignedStaffId: body.assignedStaffId,
        externalThreadId: body.externalThreadId,
        initialMessage: body.initialMessage,
        followUpAt: body.followUpAt,
      },
      req,
    );
    res.status(201).json({ conversation });
  }),
);

conversationsRouter.get(
  '/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const conversation = await getConversation(actorFromRequest(req), getParam(req, 'id'));
    res.json({ conversation });
  }),
);

conversationsRouter.patch(
  '/:id',
  validate(UpdateConversationSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof UpdateConversationSchema>['body'];
    const conversation = await updateConversation(
      actorFromRequest(req),
      getParam(req, 'id'),
      {
        assignedStaffId: body.assignedStaffId,
        status: body.status,
        subject: body.subject,
        followUpAt: body.followUpAt,
      },
      req,
    );
    res.json({ conversation });
  }),
);

conversationsRouter.post(
  '/:id/messages',
  validate(AddMessageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof AddMessageSchema>['body'];
    const message = await addMessage(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.content,
      body.isNote ?? false,
      req,
    );
    res.status(201).json({ message });
  }),
);
