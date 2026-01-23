import Joi from "joi";
import { RISK_WORKSHEET_STATUSES } from "../config/constant.js";

export const unitKerjaIdSchema = Joi.object({
  unitKerjaId: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),
});

export const worksheetIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID kertas kerja tidak boleh kosong",
    "any.required": "ID kertas kerja wajib diisi",
  }),
});

export const createRiskWorksheetSchema = Joi.object({
  konteksId: Joi.string().required().messages({
    "string.empty": "ID konteks tidak boleh kosong",
    "any.required": "ID konteks wajib diisi",
  }),

  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nama kertas kerja tidak boleh kosong",
    "string.min": "Nama kertas kerja minimal 3 karakter",
    "string.max": "Nama kertas kerja maksimal 255 karakter",
    "any.required": "Nama kertas kerja wajib diisi",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  status: Joi.string()
    .valid(...Object.values(RISK_WORKSHEET_STATUSES))
    .default(RISK_WORKSHEET_STATUSES.INACTIVE)
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(RISK_WORKSHEET_STATUSES).join(", ")}`,
    }),
});

export const updateRiskWorksheetSchema = Joi.object({
  name: Joi.string().min(3).max(255).messages({
    "string.empty": "Nama kertas kerja tidak boleh kosong",
    "string.min": "Nama kertas kerja minimal 3 karakter",
    "string.max": "Nama kertas kerja maksimal 255 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),
}).min(1);

export const searchRiskWorksheetSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  konteksId: Joi.string().messages({
    "string.base": "ID konteks harus berupa string",
  }),

  status: Joi.string()
    .valid(...Object.values(RISK_WORKSHEET_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(RISK_WORKSHEET_STATUSES).join(", ")}`,
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
