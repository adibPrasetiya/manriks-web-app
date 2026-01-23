import riskWorksheetService from "../services/risk-worksheet.service.js";

const create = async (req, res, next) => {
  try {
    const result = await riskWorksheetService.create(
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
    const result = await riskWorksheetService.search(
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
    const result = await riskWorksheetService.getById(
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
    const result = await riskWorksheetService.update(
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
    const result = await riskWorksheetService.setActive(
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
    const result = await riskWorksheetService.setInactive(
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
    const result = await riskWorksheetService.archive(
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
