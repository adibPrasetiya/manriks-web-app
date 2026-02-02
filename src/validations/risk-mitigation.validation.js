import Joi from "joi";
import {
  MITIGATION_STATUSES,
  MITIGATION_PRIORITIES,
} from "../config/constant.js";

export const mitigationIdSchema = Joi.object({
  mitigationId: Joi.string().required().messages({
    "string.empty": "ID mitigasi tidak boleh kosong",
    "any.required": "ID mitigasi wajib diisi",
  }),
});

export const createMitigationSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nama mitigasi tidak boleh kosong",
    "string.min": "Nama mitigasi minimal 3 karakter",
    "string.max": "Nama mitigasi maksimal 255 karakter",
    "any.required": "Nama mitigasi wajib diisi",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  priority: Joi.string()
    .valid(...Object.values(MITIGATION_PRIORITIES))
    .default("MEDIUM")
    .messages({
      "any.only": `Prioritas harus salah satu dari: ${Object.values(MITIGATION_PRIORITIES).join(", ")}`,
    }),

  plannedStartDate: Joi.date().iso().allow(null).messages({
    "date.base": "Tanggal mulai rencana harus berupa tanggal yang valid",
    "date.format": "Format tanggal mulai rencana harus ISO 8601",
  }),

  plannedEndDate: Joi.date()
    .iso()
    .min(Joi.ref("plannedStartDate"))
    .allow(null)
    .messages({
      "date.base": "Tanggal selesai rencana harus berupa tanggal yang valid",
      "date.format": "Format tanggal selesai rencana harus ISO 8601",
      "date.min":
        "Tanggal selesai rencana tidak boleh sebelum tanggal mulai rencana",
    }),

  responsiblePerson: Joi.string().max(255).allow("", null).messages({
    "string.base": "Penanggung jawab harus berupa teks",
    "string.max": "Penanggung jawab maksimal 255 karakter",
  }),

  responsibleUnit: Joi.string().max(255).allow("", null).messages({
    "string.base": "Unit penanggung jawab harus berupa teks",
    "string.max": "Unit penanggung jawab maksimal 255 karakter",
  }),
});

export const updateMitigationSchema = Joi.object({
  name: Joi.string().min(3).max(255).messages({
    "string.empty": "Nama mitigasi tidak boleh kosong",
    "string.min": "Nama mitigasi minimal 3 karakter",
    "string.max": "Nama mitigasi maksimal 255 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  priority: Joi.string()
    .valid(...Object.values(MITIGATION_PRIORITIES))
    .messages({
      "any.only": `Prioritas harus salah satu dari: ${Object.values(MITIGATION_PRIORITIES).join(", ")}`,
    }),

  plannedStartDate: Joi.date().iso().allow(null).messages({
    "date.base": "Tanggal mulai rencana harus berupa tanggal yang valid",
    "date.format": "Format tanggal mulai rencana harus ISO 8601",
  }),

  plannedEndDate: Joi.date().iso().allow(null).messages({
    "date.base": "Tanggal selesai rencana harus berupa tanggal yang valid",
    "date.format": "Format tanggal selesai rencana harus ISO 8601",
  }),

  actualStartDate: Joi.date().iso().allow(null).messages({
    "date.base": "Tanggal mulai aktual harus berupa tanggal yang valid",
    "date.format": "Format tanggal mulai aktual harus ISO 8601",
  }),

  actualEndDate: Joi.date().iso().allow(null).messages({
    "date.base": "Tanggal selesai aktual harus berupa tanggal yang valid",
    "date.format": "Format tanggal selesai aktual harus ISO 8601",
  }),

  responsiblePerson: Joi.string().max(255).allow("", null).messages({
    "string.base": "Penanggung jawab harus berupa teks",
    "string.max": "Penanggung jawab maksimal 255 karakter",
  }),

  responsibleUnit: Joi.string().max(255).allow("", null).messages({
    "string.base": "Unit penanggung jawab harus berupa teks",
    "string.max": "Unit penanggung jawab maksimal 255 karakter",
  }),

  status: Joi.string()
    .valid(...Object.values(MITIGATION_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(MITIGATION_STATUSES).join(", ")}`,
    }),

  progressPercentage: Joi.number().integer().min(0).max(100).messages({
    "number.base": "Persentase progres harus berupa angka",
    "number.integer": "Persentase progres harus berupa bilangan bulat",
    "number.min": "Persentase progres minimal 0",
    "number.max": "Persentase progres maksimal 100",
  }),

  progressNotes: Joi.string().allow("", null).messages({
    "string.base": "Catatan progres harus berupa teks",
  }),
}).min(1);

export const searchMitigationSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama mitigasi maksimal 255 karakter",
  }),

  priority: Joi.string()
    .valid(...Object.values(MITIGATION_PRIORITIES))
    .messages({
      "any.only": `Prioritas harus salah satu dari: ${Object.values(MITIGATION_PRIORITIES).join(", ")}`,
    }),

  status: Joi.string()
    .valid(...Object.values(MITIGATION_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(MITIGATION_STATUSES).join(", ")}`,
    }),

  isValidated: Joi.boolean().messages({
    "boolean.base": "isValidated harus berupa boolean",
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

export const validateMitigationSchema = Joi.object({
  validationNotes: Joi.string().max(500).allow("", null).messages({
    "string.base": "Catatan validasi harus berupa teks",
    "string.max": "Catatan validasi maksimal 500 karakter",
  }),
});

export const rejectMitigationSchema = Joi.object({
  validationNotes: Joi.string().min(10).max(500).required().messages({
    "string.empty": "Alasan penolakan tidak boleh kosong",
    "string.min": "Alasan penolakan minimal 10 karakter",
    "string.max": "Alasan penolakan maksimal 500 karakter",
    "any.required": "Alasan penolakan wajib diisi",
  }),
});

export const pendingValidationSearchSchema = Joi.object({
  unitKerjaId: Joi.string().messages({
    "string.base": "ID unit kerja harus berupa string",
  }),

  priority: Joi.string()
    .valid(...Object.values(MITIGATION_PRIORITIES))
    .messages({
      "any.only": `Prioritas harus salah satu dari: ${Object.values(MITIGATION_PRIORITIES).join(", ")}`,
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
