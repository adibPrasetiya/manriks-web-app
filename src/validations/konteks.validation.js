import Joi from "joi";
import { KONTEKS_STATUSES } from "../config/constant.js";

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

  // Risk Appetite (required)
  riskAppetiteLevel: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
    .required()
    .messages({
      "any.only":
        "Risk appetite level harus salah satu dari: LOW, MEDIUM, HIGH, CRITICAL",
      "any.required": "Risk appetite level wajib diisi",
    }),
  riskAppetiteDescription: Joi.string().min(1).max(500).required().messages({
    "string.empty": "Deskripsi risk appetite tidak boleh kosong",
    "any.required": "Deskripsi risk appetite wajib diisi",
  }),

  // Matrix size (ukuran matriks risiko, e.g., 5 = 5x5)
  matrixSize: Joi.number().integer().min(3).max(10).required().messages({
    "number.base": "Ukuran matriks harus berupa angka",
    "number.integer": "Ukuran matriks harus berupa bilangan bulat",
    "number.min": "Ukuran matriks minimal 3",
    "number.max": "Ukuran matriks maksimal 10",
    "any.required": "Ukuran matriks wajib diisi",
  }),

  // Menandakan konteks yang disediakan sistem vs buatan pengguna
  isSystemDefault: Joi.boolean().default(false).messages({
    "boolean.base": "isSystemDefault harus berupa boolean",
  }),
});

const updateKonteksSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow("", null),

  periodStart: Joi.number().integer().min(2000).max(2100),
  periodEnd: Joi.number().integer().min(2000).max(2100),

  riskAppetiteLevel: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
    .messages({
      "any.only":
        "Risk appetite level harus salah satu dari: LOW, MEDIUM, HIGH, CRITICAL",
    }),
  riskAppetiteDescription: Joi.string().min(1).messages({
    "string.empty": "Deskripsi risk appetite tidak boleh kosong",
  }),

  // Matrix size (validasi apakah bisa diubah dilakukan di service layer)
  matrixSize: Joi.number().integer().min(3).max(10).messages({
    "number.base": "Ukuran matriks harus berupa angka",
    "number.integer": "Ukuran matriks harus berupa bilangan bulat",
    "number.min": "Ukuran matriks minimal 3",
    "number.max": "Ukuran matriks maksimal 10",
  }),

  // Menandakan konteks yang disediakan sistem vs buatan pengguna
  isSystemDefault: Joi.boolean().messages({
    "boolean.base": "isSystemDefault harus berupa boolean",
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
  status: Joi.string()
    .valid(...Object.values(KONTEKS_STATUSES))
    .messages({
      "any.only": "Status harus salah satu dari: ACTIVE, INACTIVE, ARCHIVED",
    }),
  isSystemDefault: Joi.boolean().messages({
    "boolean.base": "isSystemDefault harus berupa boolean",
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export {
  createKonteksSchema,
  updateKonteksSchema,
  konteksIdSchema,
  searchKonteksSchema,
};
