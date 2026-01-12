import Joi from "joi";

const createUnitKerjaSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama unit kerja tidak boleh kosong",
    "string.min": "Nama unit kerja minimal 2 karakter",
    "string.max": "Nama unit kerja maksimal 255 karakter",
    "any.required": "Nama unit kerja wajib diisi",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Kode unit kerja tidak boleh kosong",
      "string.min": "Kode unit kerja minimal 2 karakter",
      "string.max": "Kode unit kerja maksimal 100 karakter",
      "string.pattern.base":
        "Kode unit kerja hanya boleh berisi huruf kapital, angka, underscore, dan dash",
      "any.required": "Kode unit kerja wajib diisi",
    }),

  email: Joi.string().email().max(255).required().messages({
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
    "any.required": "Email wajib diisi",
  }),
});

const updateUnitKerjaSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama unit kerja tidak boleh kosong",
    "string.min": "Nama unit kerja minimal 2 karakter",
    "string.max": "Nama unit kerja maksimal 255 karakter",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .messages({
      "string.empty": "Kode unit kerja tidak boleh kosong",
      "string.min": "Kode unit kerja minimal 2 karakter",
      "string.max": "Kode unit kerja maksimal 100 karakter",
      "string.pattern.base":
        "Kode unit kerja hanya boleh berisi huruf kapital, angka, underscore, dan dash",
    }),

  email: Joi.string().email().max(255).messages({
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
  }),
}).min(1);

const searchUnitKerjaSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  code: Joi.string().max(100).messages({
    "string.max": "Kode maksimal 100 karakter",
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

const unitKerjaIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),
});

export {
  createUnitKerjaSchema,
  updateUnitKerjaSchema,
  searchUnitKerjaSchema,
  unitKerjaIdSchema,
};
