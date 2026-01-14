import sessionService from "../services/session.service.js";

const search = async (req, res, next) => {
  try {
    const result = await sessionService.search(req.query);
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

const getById = async (req, res, next) => {
  try {
    const result = await sessionService.getById(req.params.id);

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

const getByUserId = async (req, res, next) => {
  try {
    const result = await sessionService.getByUserId(req.params.userId);

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

const removeById = async (req, res, next) => {
  try {
    // Extract admin user ID from authenticated user
    const adminUserId = req.user.userId;

    const result = await sessionService.removeById(req.params.id, adminUserId);

    res
      .status(200)
      .json({
        message: result.message,
      })
      .end();
  } catch (error) {
    next(error);
  }
};

const removeByUserId = async (req, res, next) => {
  try {
    // Extract admin user ID from authenticated user
    const adminUserId = req.user.userId;

    const result = await sessionService.removeByUserId(
      req.params.userId,
      adminUserId
    );

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

const bulkRemoveExpired = async (req, res, next) => {
  try {
    const result = await sessionService.bulkRemoveExpired(req.body);

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

export default {
  search,
  getById,
  getByUserId,
  removeById,
  removeByUserId,
  bulkRemoveExpired,
};
