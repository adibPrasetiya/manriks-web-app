import Joi from "joi";
import { RISK_ASSESSMENT_STATUSES } from "../config/constant.js";

export const unitKerjaIdSchema = Joi.object({
  unitKerjaId: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),
});

export const worksheetIdSchema = Joi.object({
  worksheetId: Joi.string().required().messages({
    "string.empty": "ID kertas kerja tidak boleh kosong",
    "any.required": "ID kertas kerja wajib diisi",
  }),
});

export const assessmentIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID assessment tidak boleh kosong",
    "any.required": "ID assessment wajib diisi",
  }),
});

export const createRiskAssessmentSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nama assessment tidak boleh kosong",
    "string.min": "Nama assessment minimal 3 karakter",
    "string.max": "Nama assessment maksimal 255 karakter",
    "any.required": "Nama assessment wajib diisi",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  assessmentDate: Joi.date().iso().messages({
    "date.base": "Tanggal assessment tidak valid",
    "date.format": "Format tanggal assessment tidak valid",
  }),
});

export const updateRiskAssessmentSchema = Joi.object({
  name: Joi.string().min(3).max(255).messages({
    "string.empty": "Nama assessment tidak boleh kosong",
    "string.min": "Nama assessment minimal 3 karakter",
    "string.max": "Nama assessment maksimal 255 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  assessmentDate: Joi.date().iso().messages({
    "date.base": "Tanggal assessment tidak valid",
    "date.format": "Format tanggal assessment tidak valid",
  }),
}).min(1);

export const searchRiskAssessmentSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  status: Joi.string()
    .valid(...Object.values(RISK_ASSESSMENT_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(RISK_ASSESSMENT_STATUSES).join(", ")}`,
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

export const rejectRiskAssessmentSchema = Joi.object({
  reviewNotes: Joi.string().min(10).required().messages({
    "string.empty": "Alasan penolakan tidak boleh kosong",
    "string.min": "Alasan penolakan minimal 10 karakter",
    "any.required": "Alasan penolakan wajib diisi",
  }),
});

export const approveRiskAssessmentSchema = Joi.object({
  reviewNotes: Joi.string().allow("", null).messages({
    "string.base": "Catatan review harus berupa teks",
  }),
});
