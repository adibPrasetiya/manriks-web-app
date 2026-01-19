import profileRequestService from "../services/profile-request.service.js";

// User endpoints

const create = async (req, res, next) => {
  try {
    const result = await profileRequestService.create(
      req.user.userId,
      req.body
    );
    res.status(201).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const result = await profileRequestService.getMyRequests(
      req.user.userId,
      req.query
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMyRequestById = async (req, res, next) => {
  try {
    const result = await profileRequestService.getMyRequestById(
      req.user.userId,
      req.params.requestId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const cancelMyRequest = async (req, res, next) => {
  try {
    const result = await profileRequestService.cancelMyRequest(
      req.user.userId,
      req.params.requestId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Admin endpoints

const search = async (req, res, next) => {
  try {
    const result = await profileRequestService.search(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await profileRequestService.getById(req.params.requestId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const result = await profileRequestService.approve(
      req.params.requestId,
      req.user.userId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const result = await profileRequestService.reject(
      req.params.requestId,
      req.user.userId,
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getUnverifiedProfiles = async (req, res, next) => {
  try {
    const result = await profileRequestService.getUnverifiedProfiles(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getMyRequests,
  getMyRequestById,
  cancelMyRequest,
  search,
  getById,
  approve,
  reject,
  getUnverifiedProfiles,
};
