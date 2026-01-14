import impactScaleService from "../services/impact-scale.service.js";

const create = async (req, res, next) => {
  try {
    const konteksId = req.params.konteksId;
    const riskCategoryId = req.params.riskCategoryId;
    const result = await impactScaleService.create(
      konteksId,
      riskCategoryId,
      req.body
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
    const konteksId = req.params.konteksId;
    const riskCategoryId = req.params.riskCategoryId;
    const result = await impactScaleService.search(
      konteksId,
      riskCategoryId,
      req.query
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
    const konteksId = req.params.konteksId;
    const riskCategoryId = req.params.riskCategoryId;
    const id = req.params.id;
    const result = await impactScaleService.getById(
      konteksId,
      riskCategoryId,
      id
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
    const konteksId = req.params.konteksId;
    const riskCategoryId = req.params.riskCategoryId;
    const id = req.params.id;
    const result = await impactScaleService.update(
      konteksId,
      riskCategoryId,
      id,
      req.body
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

const remove = async (req, res, next) => {
  try {
    const konteksId = req.params.konteksId;
    const riskCategoryId = req.params.riskCategoryId;
    const id = req.params.id;
    const result = await impactScaleService.remove(
      konteksId,
      riskCategoryId,
      id
    );
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
  remove,
};
