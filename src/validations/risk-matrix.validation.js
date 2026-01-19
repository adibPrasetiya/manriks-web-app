import Joi from "joi";

const riskMatrixItemSchema = Joi.object({
  likelihoodLevel: Joi.number().integer().min(1).required().messages({
    "number.base": "Likelihood level harus berupa angka",
    "number.integer": "Likelihood level harus berupa bilangan bulat",
    "number.min": "Likelihood level minimal 1",
    "any.required": "Likelihood level wajib diisi",
  }),

  impactLevel: Joi.number().integer().min(1).required().messages({
    "number.base": "Impact level harus berupa angka",
    "number.integer": "Impact level harus berupa bilangan bulat",
    "number.min": "Impact level minimal 1",
    "any.required": "Impact level wajib diisi",
  }),

  riskLevel: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
    .required()
    .messages({
      "string.empty": "Risk level tidak boleh kosong",
      "any.only": "Risk level harus salah satu dari: LOW, MEDIUM, HIGH, CRITICAL",
      "any.required": "Risk level wajib diisi",
    }),
});

const createRiskMatrixSchema = riskMatrixItemSchema;

const bulkCreateRiskMatrixSchema = Joi.object({
  matrices: Joi.array().items(riskMatrixItemSchema).min(1).max(100).required().messages({
    "array.base": "Matrices harus berupa array",
    "array.min": "Minimal harus ada 1 matriks",
    "array.max": "Maksimal 100 matriks dalam satu request",
    "any.required": "Matrices wajib diisi",
  }),
});

const updateRiskMatrixSchema = Joi.object({
  likelihoodLevel: Joi.number().integer().min(1).messages({
    "number.base": "Likelihood level harus berupa angka",
    "number.integer": "Likelihood level harus berupa bilangan bulat",
    "number.min": "Likelihood level minimal 1",
  }),

  impactLevel: Joi.number().integer().min(1).messages({
    "number.base": "Impact level harus berupa angka",
    "number.integer": "Impact level harus berupa bilangan bulat",
    "number.min": "Impact level minimal 1",
  }),

  riskLevel: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
    .messages({
      "string.empty": "Risk level tidak boleh kosong",
      "any.only": "Risk level harus salah satu dari: LOW, MEDIUM, HIGH, CRITICAL",
    }),
})
  .min(1)
  .messages({
    "object.min": "Minimal harus ada 1 field yang diupdate",
  });

const searchRiskMatrixSchema = Joi.object({
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

const riskMatrixIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID matriks risiko tidak boleh kosong",
    "any.required": "ID matriks risiko wajib diisi",
  }),
});

const konteksIdSchema = Joi.object({
  konteksId: Joi.string().required().messages({
    "string.empty": "ID konteks tidak boleh kosong",
    "any.required": "ID konteks wajib diisi",
  }),
});

export {
  createRiskMatrixSchema,
  bulkCreateRiskMatrixSchema,
  updateRiskMatrixSchema,
  searchRiskMatrixSchema,
  riskMatrixIdSchema,
  konteksIdSchema,
};
