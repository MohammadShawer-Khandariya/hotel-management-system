import { Request, Response } from 'express';
import { AuditLog } from '../models';
import logger from '../utils/logger';

export class AuditController {
  // Get audit logs with filtering and pagination
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        entityType,
        entityId,
        userId,
        startDate,
        endDate,
        sortOrder = 'desc'
      } = req.query;

      const filter: any = {};
      
      if (action) filter.action = action;
      if (entityType) filter.entityType = entityType;
      if (entityId) filter.entityId = entityId;
      if (userId) filter.userId = userId;
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate as string);
        if (endDate) filter.timestamp.$lte = new Date(endDate as string);
      }

      const sortOptions: { [key: string]: 'asc' | 'desc' | 1 | -1 } = { timestamp: sortOrder === 'desc' ? -1 : 1 };
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit as string)),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            totalItems: total,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get audit log statistics
  async getAuditStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = new Date(startDate as string);
        if (endDate) matchStage.timestamp.$lte = new Date(endDate as string);
      }

      const pipeline = [
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 as const }
        }
      ];

      const stats = await AuditLog.aggregate(pipeline);

      // Get total count
      const totalCount = await AuditLog.countDocuments(matchStage);

      // Get recent activity (last 24 hours)
      const last24Hours = new Date();
      last24Hours.setDate(last24Hours.getDate() - 1);
      
      const recentActivity = await AuditLog.countDocuments({
        timestamp: { $gte: last24Hours }
      });

      res.json({
        success: true,
        data: {
          actionStats: stats,
          totalLogs: totalCount,
          recentActivity: recentActivity
        }
      });
    } catch (error) {
      logger.error('Error fetching audit statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get audit logs for a specific entity
  async getEntityAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const filter = { entityType, entityId };
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit as string)),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            totalItems: total,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching entity audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user activity logs
  async getUserActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, action } = req.query;

      const filter: any = { userId };
      if (action) filter.action = action;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit as string)),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            totalItems: total,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching user activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
