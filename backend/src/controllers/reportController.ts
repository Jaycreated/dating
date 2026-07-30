import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { MessageModel } from '../models/Message';
import { ReportModel } from '../models/Report';
import { UserModel } from '../models/User';
import { moderateContent } from '../services/moderationService';
import { NotificationService } from '../services/notificationService';

const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL || 'support@pairfect.com.ng';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || `Safety Alert <${MODERATOR_EMAIL}>`;

async function sendSafetyAlertEmail(subject: string, html: string) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP is not configured. Report alert email will not be sent.');
    console.log('Safety alert email payload:', { subject, html });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: MODERATOR_EMAIL,
    subject,
    html,
  });
}

export class ReportController {
  static async createReport(req: Request, res: Response) {
    try {
      const reporterId = req.userId!;
      const reportedUserId = Number(req.body.reportedUserId);
      const contentType = req.body.contentType as 'message' | 'profile';
      const contentId = req.body.contentId ? String(req.body.contentId) : undefined;
      const content = req.body.content?.trim();
      const reason = req.body.reason?.trim();

      if (!reportedUserId || isNaN(reportedUserId) || !contentType) {
        return res.status(400).json({ success: false, message: 'Missing required parameters.' });
      }

      const targetUser = await UserModel.findById(reportedUserId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Reported user not found' });
      }

      let moderationScore = 0;
      let autoFlagged = false;
      let moderationProvider: 'openai' | 'perspective' | 'none' = 'none';

      if (content && content.length > 0) {
        const moderationResult = await moderateContent(content);
        moderationScore = moderationResult.score;
        autoFlagged = moderationResult.flagged;
        moderationProvider = moderationResult.provider;
      }

      const reportId = crypto.randomUUID();
      await ReportModel.create({
        id: reportId,
        reporter_user_id: reporterId,
        reported_user_id: reportedUserId,
        content_type: contentType,
        content_id: contentId,
        content,
        reason,
        status: autoFlagged ? 'actioned' : 'pending',
        moderation_score: moderationScore,
        auto_flagged: autoFlagged,
        provider: moderationProvider,
      });

      if (autoFlagged) {
        await pool.query(
          `UPDATE users SET has_chat_access = FALSE, is_suspended = TRUE WHERE id = $1`,
          [reportedUserId]
        );

        if (contentType === 'message' && contentId) {
          const messageId = parseInt(contentId, 10);
          if (!Number.isNaN(messageId)) {
            await MessageModel.deleteById(messageId);
          }
        }

        await NotificationService.sendPushNotification(reportedUserId, {
          title: 'Account restricted pending review',
          body: 'A report has been filed against your account and access has been temporarily limited while our safety team reviews it.',
          data: { type: 'safety_action', reportId },
        });
      }

      const alertSubject = `🚨 UGC Safety Alert [${contentType.toUpperCase()}] - Action Required within 24h`;
      const alertHtml = `
        <h2>Safety Report Received</h2>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p><strong>Reporter ID:</strong> ${reporterId}</p>
        <p><strong>Reported User ID:</strong> ${reportedUserId}</p>
        <p><strong>Content Type:</strong> ${contentType}</p>
        <p><strong>Reported Text:</strong> ${content ? content : 'Not provided'}</p>
        <p><strong>Reason:</strong> ${reason || 'Not provided'}</p>
        <p><strong>Moderation Provider:</strong> ${moderationProvider}</p>
        <p><strong>Moderation Score:</strong> ${moderationScore}</p>
        <p><strong>Auto Flagged:</strong> ${autoFlagged ? 'Yes' : 'No'}</p>
        <p><strong>Status:</strong> ${autoFlagged ? 'actioned' : 'pending'}</p>
        <p><strong>Reported At:</strong> ${new Date().toISOString()}</p>
      `;

      await sendSafetyAlertEmail(alertSubject, alertHtml);

      return res.status(201).json({
        success: true,
        message: autoFlagged
          ? 'Report received and automatically actioned pending review.'
          : 'Report submitted successfully and is pending moderator review.',
        reportId,
        autoFlagged,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ success: false, message: 'Unable to create report.' });
    }
  }

  static async resolveReport(req: Request, res: Response) {
    try {
      const reportId = req.params.id;
      const status = req.body.status as 'reviewed' | 'actioned' | 'dismissed';

      if (!reportId || !status) {
        return res.status(400).json({ success: false, message: 'Report id and status are required.' });
      }

      const report = await ReportModel.getById(reportId);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      const updatedReport = await ReportModel.updateStatus(reportId, status);
      if (!updatedReport) {
        return res.status(500).json({ success: false, message: 'Unable to update report status.' });
      }

      if (status === 'actioned') {
        await pool.query(
          `UPDATE users SET has_chat_access = FALSE, is_suspended = TRUE WHERE id = $1`,
          [report.reported_user_id]
        );

        if (report.content_type === 'message' && report.content_id) {
          const messageId = parseInt(report.content_id, 10);
          if (!Number.isNaN(messageId)) {
            await MessageModel.deleteById(messageId);
          }
        }
      }

      return res.json({ success: true, report: updatedReport });
    } catch (error) {
      console.error('Error resolving report:', error);
      return res.status(500).json({ success: false, message: 'Unable to resolve report.' });
    }
  }
}
