import profileService from "../services/profile.service.js";

const create = async (req, res, next) => {
  try {
    const result = await profileService.create(req.body, req.user.userId);
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

const update = async (req, res, next) => {
  try {
    const result = await profileService.update(req.body, req.user.userId);
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

const get = async (req, res, next) => {
  try {
    const result = await profileService.get(req.user);
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

export default { create, update, get };
