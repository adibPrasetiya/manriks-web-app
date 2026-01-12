import profileService from "../services/profile.service.js";

const create = async (req, res, next) => {
  try {
    const result = await profileService.create(req.body, req.userId);
    res.status(201).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export default { create };
