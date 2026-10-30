// src/routes/bookings.ts
// Site-visit bookings. POST /confirm (also reachable as /api/visits/confirm)
// is the only endpoint that creates a project.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  cancelBooking,
  checkInToVisit,
  checkOutOfVisit,
  confirmVisitBooking,
  getBooking,
  getBookingFeeSummary,
  listBookings,
  recordVisitFee,
  rescheduleBooking,
} from '../services/project.service.js';
import {
  BookingListQuery,
  CancelBookingSchema,
  ConfirmBookingSchema,
  GpsBodySchema,
  IdParamSchema,
  RecordVisitFeeSchema,
  RescheduleBookingSchema,
} from './schemas.js';
import { getParam } from './request.js';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth, requireStaff);

const confirmHandler = asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof ConfirmBookingSchema>['body'];
  const result = await confirmVisitBooking(
    actorFromRequest(req),
    {
      idempotencyKey: body.idempotencyKey,
      scheduledAt: body.scheduledAt,
      site: body.site,
      conversationId: body.conversationId,
      contactId: body.contactId,
      contact: body.contact,
      assignedOfficerId: body.assignedOfficerId,
      visitFeeKes: body.visitFeeKes,
      specialInstructions: body.specialInstructions,
    },
    req,
  );
  res.status(result.created ? 201 : 200).json(result);
});

bookingsRouter.post('/confirm', validate(ConfirmBookingSchema), confirmHandler);
bookingsRouter.post('/', validate(ConfirmBookingSchema), confirmHandler);

bookingsRouter.get(
  '/',
  validate(BookingListQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof BookingListQuery>['query'];
    const result = await listBookings(actorFromRequest(req), {
      status: query.status,
      officerId: query.officerId,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.take,
    });
    res.json(result);
  }),
);

bookingsRouter.get(
  '/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const booking = await getBooking(actorFromRequest(req), getParam(req, 'id'));
    res.json({ booking });
  }),
);

bookingsRouter.get(
  '/:id/fee',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const actor = actorFromRequest(req);
    const id = getParam(req, 'id');
    // getBooking performs the project-scope authorization check.
    await getBooking(actor, id);
    res.json(await getBookingFeeSummary(id));
  }),
);

bookingsRouter.patch(
  '/:id/fee',
  validate(RecordVisitFeeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof RecordVisitFeeSchema>['body'];
    const booking = await recordVisitFee(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.paymentStatus,
      req,
    );
    res.json({ booking });
  }),
);

bookingsRouter.post(
  '/:id/reschedule',
  validate(RescheduleBookingSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof RescheduleBookingSchema>['body'];
    const booking = await rescheduleBooking(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.scheduledAt,
      body.reason,
      req,
    );
    res.json({ booking });
  }),
);

bookingsRouter.post(
  '/:id/cancel',
  validate(CancelBookingSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof CancelBookingSchema>['body'];
    const booking = await cancelBooking(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.reason,
      req,
    );
    res.json({ booking });
  }),
);

bookingsRouter.post(
  '/:id/check-in',
  validate(GpsBodySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof GpsBodySchema>['body'];
    const booking = await checkInToVisit(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.gps,
      req,
    );
    res.json({ booking });
  }),
);

bookingsRouter.post(
  '/:id/check-out',
  validate(GpsBodySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof GpsBodySchema>['body'];
    const booking = await checkOutOfVisit(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.gps,
      req,
    );
    res.json({ booking });
  }),
);
