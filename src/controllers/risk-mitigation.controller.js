import riskMitigationService from "../services/risk-mitigation.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskMitigationService.create(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
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
    const result = await riskMitigationService.search(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
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
    const result = await riskMitigationService.getById(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.params.mitigationId,
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
    const result = await riskMitigationService.update(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.params.mitigationId,
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
    const result = await riskMitigationService.remove(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.params.mitigationId,
      req.user
    );
    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const validate = async (req, res, next) => {
  try {
    const result = await riskMitigationService.validate(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.params.mitigationId,
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

const reject = async (req, res, next) => {
  try {
    const result = await riskMitigationService.reject(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.params.mitigationId,
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

const getPendingValidations = async (req, res, next) => {
  try {
    const result = await riskMitigationService.getPendingValidations(
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

const resubmit = async (req, res, next) => {
  try {
    const result = await riskMitigationService.resubmit(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.itemId,
      req.params.mitigationId,
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

export default {
  create,
  search,
  getById,
  update,
  remove,
  validate,
  reject,
  resubmit,
  getPendingValidations,
};
