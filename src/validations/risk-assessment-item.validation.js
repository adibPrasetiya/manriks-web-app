import Joi from "joi";
import { CONTROL_EFFECTIVENESS, TREATMENT_OPTIONS } from "../config/constant.js";

export const assessmentIdSchema = Joi.object({
  assessmentId: Joi.string().required().messages({
    "string.empty": "ID assessment tidak boleh kosong",
    "any.required": "ID assessment wajib diisi",
  }),
});

export const itemIdSchema = Joi.object({
  itemId: Joi.string().required().messages({
    "string.empty": "ID item tidak boleh kosong",
    "any.required": "ID item wajib diisi",
  }),
});

export const createRiskAssessmentItemSchema = Joi.object({
  riskName: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nama risiko tidak boleh kosong",
    "string.min": "Nama risiko minimal 3 karakter",
    "string.max": "Nama risiko maksimal 255 karakter",
    "any.required": "Nama risiko wajib diisi",
  }),

  riskDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi risiko harus berupa teks",
  }),

  assetId: Joi.string().allow(null).messages({
    "string.base": "ID aset harus berupa string",
  }),

  riskCategoryId: Joi.string().required().messages({
    "string.empty": "ID kategori risiko tidak boleh kosong",
    "any.required": "ID kategori risiko wajib diisi",
  }),

  inherentLikelihood: Joi.number().integer().min(1).required().messages({
    "number.base": "Inherent likelihood harus berupa angka",
    "number.integer": "Inherent likelihood harus berupa bilangan bulat",
    "number.min": "Inherent likelihood minimal 1",
    "any.required": "Inherent likelihood wajib diisi",
  }),

  inherentImpact: Joi.number().integer().min(1).required().messages({
    "number.base": "Inherent impact harus berupa angka",
    "number.integer": "Inherent impact harus berupa bilangan bulat",
    "number.min": "Inherent impact minimal 1",
    "any.required": "Inherent impact wajib diisi",
  }),

  existingControls: Joi.string().allow("", null).messages({
    "string.base": "Existing controls harus berupa teks",
  }),

  controlEffectiveness: Joi.string()
    .valid(...Object.values(CONTROL_EFFECTIVENESS))
    .allow(null)
    .messages({
      "any.only": `Control effectiveness harus salah satu dari: ${Object.values(CONTROL_EFFECTIVENESS).join(", ")}`,
    }),

  residualLikelihood: Joi.number().integer().min(1).required().messages({
    "number.base": "Residual likelihood harus berupa angka",
    "number.integer": "Residual likelihood harus berupa bilangan bulat",
    "number.min": "Residual likelihood minimal 1",
    "any.required": "Residual likelihood wajib diisi",
  }),

  residualImpact: Joi.number().integer().min(1).required().messages({
    "number.base": "Residual impact harus berupa angka",
    "number.integer": "Residual impact harus berupa bilangan bulat",
    "number.min": "Residual impact minimal 1",
    "any.required": "Residual impact wajib diisi",
  }),

  treatmentOption: Joi.string()
    .valid(...Object.values(TREATMENT_OPTIONS))
    .allow(null)
    .messages({
      "any.only": `Treatment option harus salah satu dari: ${Object.values(TREATMENT_OPTIONS).join(", ")}`,
    }),

  treatmentRationale: Joi.string().allow("", null).messages({
    "string.base": "Treatment rationale harus berupa teks",
  }),

  order: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Order harus berupa angka",
    "number.integer": "Order harus berupa bilangan bulat",
    "number.min": "Order minimal 0",
  }),
});

export const updateRiskAssessmentItemSchema = Joi.object({
  riskName: Joi.string().min(3).max(255).messages({
    "string.empty": "Nama risiko tidak boleh kosong",
    "string.min": "Nama risiko minimal 3 karakter",
    "string.max": "Nama risiko maksimal 255 karakter",
  }),

  riskDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi risiko harus berupa teks",
  }),

  assetId: Joi.string().allow(null).messages({
    "string.base": "ID aset harus berupa string",
  }),

  inherentLikelihood: Joi.number().integer().min(1).messages({
    "number.base": "Inherent likelihood harus berupa angka",
    "number.integer": "Inherent likelihood harus berupa bilangan bulat",
    "number.min": "Inherent likelihood minimal 1",
  }),

  inherentImpact: Joi.number().integer().min(1).messages({
    "number.base": "Inherent impact harus berupa angka",
    "number.integer": "Inherent impact harus berupa bilangan bulat",
    "number.min": "Inherent impact minimal 1",
  }),

  existingControls: Joi.string().allow("", null).messages({
    "string.base": "Existing controls harus berupa teks",
  }),

  controlEffectiveness: Joi.string()
    .valid(...Object.values(CONTROL_EFFECTIVENESS))
    .allow(null)
    .messages({
      "any.only": `Control effectiveness harus salah satu dari: ${Object.values(CONTROL_EFFECTIVENESS).join(", ")}`,
    }),

  residualLikelihood: Joi.number().integer().min(1).messages({
    "number.base": "Residual likelihood harus berupa angka",
    "number.integer": "Residual likelihood harus berupa bilangan bulat",
    "number.min": "Residual likelihood minimal 1",
  }),

  residualImpact: Joi.number().integer().min(1).messages({
    "number.base": "Residual impact harus berupa angka",
    "number.integer": "Residual impact harus berupa bilangan bulat",
    "number.min": "Residual impact minimal 1",
  }),

  treatmentOption: Joi.string()
    .valid(...Object.values(TREATMENT_OPTIONS))
    .allow(null)
    .messages({
      "any.only": `Treatment option harus salah satu dari: ${Object.values(TREATMENT_OPTIONS).join(", ")}`,
    }),

  treatmentRationale: Joi.string().allow("", null).messages({
    "string.base": "Treatment rationale harus berupa teks",
  }),

  order: Joi.number().integer().min(0).messages({
    "number.base": "Order harus berupa angka",
    "number.integer": "Order harus berupa bilangan bulat",
    "number.min": "Order minimal 0",
  }),
}).min(1);

export const searchRiskAssessmentItemSchema = Joi.object({
  riskName: Joi.string().max(255).messages({
    "string.max": "Nama risiko maksimal 255 karakter",
  }),

  riskCategoryId: Joi.string().messages({
    "string.base": "ID kategori risiko harus berupa string",
  }),

  inherentRiskLevel: Joi.string().messages({
    "string.base": "Inherent risk level harus berupa string",
  }),

  residualRiskLevel: Joi.string().messages({
    "string.base": "Residual risk level harus berupa string",
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
