import riskWorksheetService from "../services/risk-worksheet.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskWorksheetService.create(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.search(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.getById(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.update(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.submit(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.approve(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.reject(
      req.params.unitKerjaId,
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
    const result = await riskWorksheetService.archive(
      req.params.unitKerjaId,
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
