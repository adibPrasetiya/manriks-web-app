import { NODE_ENV, REFRESH_TOKEN_EXPIRY_HOURS } from "../config/constant.js";
import userService from "../services/user.service.js";
import { extractIpAddress } from "../utils/device.utils.js";

const registration = async (req, res, next) => {
  try {
    const result = await userService.registration(req.body);
    res
      .status(201)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = extractIpAddress(req);

    const result = await userService.login(req.body, userAgent, ipAddress);

    res
      .cookie("refreshToken", result.data.refreshToken, {
        httpOnly: true, // Mencegah akses via JavaScript (XSS protection)
        secure: NODE_ENV === "production", // Hanya HTTPS di production
        sameSite: "strict", // CSRF protection
        maxAge: REFRESH_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000, // 1 jam
      })
      .status(200)
      .json({
        message: result.message,
        data: {
          user: result.data.user,
          accessToken: result.data.accessToken,
        },
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await userService.updatePassword(userId, req.body);

    res
      .clearCookie("refreshToken")
      .status(200)
      .json({
        message: result.message,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await userService.search(req.query);

    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
        pagination: result.pagination,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken =
      (req.cookies && req.cookies.refreshToken) ||
      (req.body && req.body.refreshToken);

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token tidak ditemukan. Silakan login kembali.",
      });
    }

    const result = await userService.refreshToken({ refreshToken });

    res
      .status(200)
      .json({
        message: result.message,
        data: result.data,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await userService.logout(userId);

    res
      .clearCookie("refreshToken")
      .status(200)
      .json({
        message: result.message,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

export default {
  registration,
  login,
  updatePassword,
  search,
  refreshToken,
  logout,
};
