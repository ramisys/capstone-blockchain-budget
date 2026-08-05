import { timelineService } from '../services/timelineService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

class TimelineController {
  /**
   * Get the merged financial activity timeline.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getTimeline(req, res, next) {
    try {
      const filters = {
        kind: req.query.kind,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const pagination = { page: req.query.page, limit: req.query.limit };
      const ordering = { sortBy: req.query.sortBy, sortOrder: req.query.sortOrder };

      const result = await timelineService.getTimeline(filters, pagination, ordering);
      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Financial activity timeline retrieved successfully', {
            timeline: result.timeline,
            pagination: result.pagination,
          })
        );
    } catch (error) {
      next(error);
    }
  }
}

export const timelineController = new TimelineController();
