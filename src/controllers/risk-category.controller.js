import riskCategoryService from "../services/risk-category.service.js";

const create = async (req, res, next) => {
  try {
    const konteksId = req.params.konteksId;
    const result = await riskCategoryService.create(konteksId, req.body);
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
    const result = await riskCategoryService.search(konteksId, req.query);
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
    const id = req.params.id;
    const result = await riskCategoryService.getById(konteksId, id);
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
    const id = req.params.id;
    const result = await riskCategoryService.update(konteksId, id, req.body);
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
    const id = req.params.id;
    const result = await riskCategoryService.remove(konteksId, id);
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
