import riskAssessmentService from "../services/risk-assessment.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskAssessmentService.create(
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
    const result = await riskAssessmentService.search(
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
    const result = await riskAssessmentService.getById(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.id,
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
    const result = await riskAssessmentService.update(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.id,
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

const submit = async (req, res, next) => {
  try {
    const result = await riskAssessmentService.submit(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.id,
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

const approve = async (req, res, next) => {
  try {
    const result = await riskAssessmentService.approve(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.id,
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
    const result = await riskAssessmentService.reject(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.id,
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

const archive = async (req, res, next) => {
  try {
    const result = await riskAssessmentService.archive(
      req.params.unitKerjaId,
      req.params.worksheetId,
      req.params.id,
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
  submit,
  approve,
  reject,
  archive,
};
