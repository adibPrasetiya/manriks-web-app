import konteksService from "../services/konteks.service.js";

const create = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await konteksService.create(req.body, userId);
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

const search = async (req, res, next) => {
  try {
    const result = await konteksService.search(req.query);
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
    const result = await konteksService.getById(req.params.konteksId);
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

const update = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await konteksService.update(
      req.params.konteksId,
      req.body,
      userId
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

const setActive = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await konteksService.setActive(req.params.konteksId, userId);
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

const remove = async (req, res, next) => {
  try {
    const result = await konteksService.remove(req.params.konteksId);
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

export default {
  create,
  search,
  getById,
  update,
  setActive,
  remove,
};
