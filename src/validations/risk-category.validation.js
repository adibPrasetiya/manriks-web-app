import Joi from "joi";

const createRiskCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama kategori risiko tidak boleh kosong",
    "string.min": "Nama kategori risiko minimal 2 karakter",
    "string.max": "Nama kategori risiko maksimal 255 karakter",
    "any.required": "Nama kategori risiko wajib diisi",
  }),

  description: Joi.string().allow("", null).optional(),

  order: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Order harus berupa angka",
    "number.integer": "Order harus berupa bilangan bulat",
    "number.min": "Order minimal 0",
  }),
});

const updateRiskCategorySchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama kategori risiko tidak boleh kosong",
    "string.min": "Nama kategori risiko minimal 2 karakter",
    "string.max": "Nama kategori risiko maksimal 255 karakter",
  }),

  description: Joi.string().allow("", null),

  order: Joi.number().integer().min(0).messages({
    "number.base": "Order harus berupa angka",
    "number.integer": "Order harus berupa bilangan bulat",
    "number.min": "Order minimal 0",
  }),
})
  .min(1)
  .messages({
    "object.min": "Minimal harus ada 1 field yang diupdate",
  });

const searchRiskCategorySchema = Joi.object({
  name: Joi.string().max(255).optional().messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

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

const riskCategoryIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID kategori risiko tidak boleh kosong",
    "any.required": "ID kategori risiko wajib diisi",
  }),
});

const konteksIdSchema = Joi.object({
  konteksId: Joi.string().required().messages({
    "string.empty": "ID konteks tidak boleh kosong",
    "any.required": "ID konteks wajib diisi",
  }),
});

export {
  createRiskCategorySchema,
  updateRiskCategorySchema,
  searchRiskCategorySchema,
  riskCategoryIdSchema,
  konteksIdSchema,
};
