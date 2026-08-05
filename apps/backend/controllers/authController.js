import { authService } from '../services/authService.js';
import { formatSuccessResponse } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../constants/auditActions.js';

class AuthController {
  /**
   * Handle user login HTTP POST request.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.AUTH_LOGIN,
        result: AUDIT_RESULTS.SUCCESS,
        actor: result.user,
        resource: { type: 'User', id: result.user.id, email: result.user.email },
        details: { email: result.user.email, role: result.user.role },
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Login successful', {
            user: result.user,
            token: result.token,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.AUTH_LOGIN,
        result: AUDIT_RESULTS.FAILURE,
        resource: { type: 'User', email: req.body?.email },
        details: { email: req.body?.email },
        error,
      });
      next(error);
    }
  }

  /**
   * Handle refresh access token HTTP POST request.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.AUTH_REFRESH_TOKEN,
        result: AUDIT_RESULTS.SUCCESS,
        actor: req.user,
        resource: req.user ? { type: 'User', id: req.user.id } : null,
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('Token refreshed successfully', {
            token: result.token,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          })
        );
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.AUTH_REFRESH_TOKEN,
        result: AUDIT_RESULTS.FAILURE,
        error,
      });
      next(error);
    }
  }

  /**
   * Handle user logout HTTP POST request.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async logout(req, res, next) {
    try {
      await authService.logout(req.user?.id, req.body?.refreshToken);

      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        result: AUDIT_RESULTS.SUCCESS,
        resource: req.user ? { type: 'User', id: req.user.id } : null,
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(formatSuccessResponse('Logout successful', {}));
    } catch (error) {
      auditLogger.logFromReq(req, {
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        result: AUDIT_RESULTS.FAILURE,
        resource: req.user ? { type: 'User', id: req.user.id } : null,
        error,
      });
      next(error);
    }
  }

  /**
   * Handle get current user profile HTTP GET request.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async me(req, res, next) {
    try {
      const userProfile = await authService.getCurrentUserProfile(req.user.id);

      return res
        .status(HTTP_STATUS.OK)
        .json(
          formatSuccessResponse('User profile retrieved successfully', {
            user: userProfile,
          })
        );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

