import Joi from "joi";

const createLikelihoodScaleSchema = Joi.object({
  level: Joi.number().integer().min(1).required().messages({
    "number.base": "Level harus berupa angka",
    "number.integer": "Level harus berupa bilangan bulat",
    "number.min": "Level minimal 1",
    "any.required": "Level wajib diisi",
  }),

  label: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Label tidak boleh kosong",
    "string.min": "Label minimal 2 karakter",
    "string.max": "Label maksimal 100 karakter",
    "any.required": "Label wajib diisi",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Deskripsi tidak boleh kosong",
    "any.required": "Deskripsi wajib diisi",
  }),
});

const updateLikelihoodScaleSchema = Joi.object({
  level: Joi.number().integer().min(1).messages({
    "number.base": "Level harus berupa angka",
    "number.integer": "Level harus berupa bilangan bulat",
    "number.min": "Level minimal 1",
  }),

  label: Joi.string().min(2).max(100).messages({
    "string.empty": "Label tidak boleh kosong",
    "string.min": "Label minimal 2 karakter",
    "string.max": "Label maksimal 100 karakter",
  }),

  description: Joi.string().messages({
    "string.empty": "Deskripsi tidak boleh kosong",
  }),
})
  .min(1)
  .messages({
    "object.min": "Minimal harus ada 1 field yang diupdate",
  });

const searchLikelihoodScaleSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page harus berupa angka",
    "number.integer": "Page harus berupa bilangan bulat",
    "number.min": "Page minimal 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": "Limit maksimal 100",
  }),
});

const likelihoodScaleIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID skala kemungkinan tidak boleh kosong",
    "any.required": "ID skala kemungkinan wajib diisi",
  }),
});

const konteksIdSchema = Joi.object({
  konteksId: Joi.string().required().messages({
    "string.empty": "ID konteks tidak boleh kosong",
    "any.required": "ID konteks wajib diisi",
  }),
});

export {
  createLikelihoodScaleSchema,
  updateLikelihoodScaleSchema,
  searchLikelihoodScaleSchema,
  likelihoodScaleIdSchema,
  konteksIdSchema,
};
