import riskAssessmentItemService from "../services/risk-assessment-item.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskAssessmentItemService.create(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.body,
      req.user
    );
    res.status(201).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const result = await riskAssessmentItemService.search(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.query,
      req.user
    );
    res.status(200).json({
      message: result.message,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await riskAssessmentItemService.getById(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.user
    );
    res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await riskAssessmentItemService.update(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.body,
      req.user
    );
    res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await riskAssessmentItemService.remove(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.user
    );
    res.status(200).json({
      message: result.message,
    });
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
