import Joi from "joi";

const createKonteksSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nama konteks tidak boleh kosong",
    "string.min": "Nama konteks minimal 3 karakter",
    "any.required": "Nama konteks wajib diisi",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Kode konteks tidak boleh kosong",
      "string.pattern.base":
        "Kode konteks hanya boleh berisi huruf kapital, angka, underscore, dan dash",
      "any.required": "Kode konteks wajib diisi",
    }),

  description: Joi.string().allow("", null).optional(),

  periodStart: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": "Periode mulai harus berupa angka",
    "number.min": "Periode mulai minimal tahun 2000",
    "any.required": "Periode mulai wajib diisi",
  }),

  periodEnd: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .greater(Joi.ref("periodStart"))
    .required()
    .messages({
      "number.base": "Periode akhir harus berupa angka",
      "number.greater": "Periode akhir harus lebih besar dari periode mulai",
      "any.required": "Periode akhir wajib diisi",
    }),

  // Risk Appetite (simple)
  riskAppetiteLevel: Joi.string().max(100).allow("", null).optional(),
  riskAppetiteDescription: Joi.string().allow("", null).optional(),

  // Matrix size (ukuran matriks risiko, e.g., 5 = 5x5)
  matrixSize: Joi.number().integer().min(3).max(10).required().messages({
    "number.base": "Ukuran matriks harus berupa angka",
    "number.integer": "Ukuran matriks harus berupa bilangan bulat",
    "number.min": "Ukuran matriks minimal 3",
    "number.max": "Ukuran matriks maksimal 10",
    "any.required": "Ukuran matriks wajib diisi",
  }),

  // Is Active (optional, defaults to false)
  isActive: Joi.boolean().default(false).optional(),
});

const updateKonteksSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow("", null),

  periodStart: Joi.number().integer().min(2000).max(2100),
  periodEnd: Joi.number().integer().min(2000).max(2100),

  riskAppetiteLevel: Joi.string().max(100).allow("", null),
  riskAppetiteDescription: Joi.string().allow("", null),

  // Matrix size (validasi apakah bisa diubah dilakukan di service layer)
  matrixSize: Joi.number().integer().min(3).max(10).messages({
    "number.base": "Ukuran matriks harus berupa angka",
    "number.integer": "Ukuran matriks harus berupa bilangan bulat",
    "number.min": "Ukuran matriks minimal 3",
    "number.max": "Ukuran matriks maksimal 10",
  }),
})
  .min(1)
  .messages({
    "object.min": "Minimal harus ada 1 field yang diupdate",
  });

const konteksIdSchema = Joi.object({
  konteksId: Joi.string().required(),
});

const searchKonteksSchema = Joi.object({
  name: Joi.string().max(255),
  code: Joi.string().max(100),
  periodStart: Joi.number().integer().min(2000).max(2100),
  periodEnd: Joi.number().integer().min(2000).max(2100),
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export {
  createKonteksSchema,
  updateKonteksSchema,
  konteksIdSchema,
  searchKonteksSchema,
};
