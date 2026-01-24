import assetService from "../services/asset.service.js";

const create = async (req, res, next) => {
  try {
    const result = await assetService.create(
      req.params.unitKerjaId,
      req.body,
      req.user
    );
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
    const result = await assetService.search(
      req.params.unitKerjaId,
      req.query,
      req.user
    );
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
    const result = await assetService.getById(
      req.params.unitKerjaId,
      req.params.id,
      req.user
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

const update = async (req, res, next) => {
  try {
    const result = await assetService.update(
      req.params.unitKerjaId,
      req.params.id,
      req.body,
      req.user
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
    const result = await assetService.setActive(
      req.params.unitKerjaId,
      req.params.id,
      req.user
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

const setInactive = async (req, res, next) => {
  try {
    const result = await assetService.setInactive(
      req.params.unitKerjaId,
      req.params.id,
      req.user
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

const archive = async (req, res, next) => {
  try {
    const result = await assetService.archive(
      req.params.unitKerjaId,
      req.params.id,
      req.user
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

export default {
  create,
  search,
  getById,
  update,
  setActive,
  setInactive,
  archive,
};
