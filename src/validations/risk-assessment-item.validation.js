import Joi from "joi";
import {
  CONTROL_EFFECTIVENESS,
  TREATMENT_OPTIONS,
} from "../config/constant.js";

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

  assetId: Joi.string().required().messages({
    "string.base": "ID aset harus berupa string",
  }),

  riskCategoryId: Joi.string().required().messages({
    "string.empty": "ID kategori risiko tidak boleh kosong",
    "any.required": "ID kategori risiko wajib diisi",
  }),

  // Risk Description (kelemahan, ancaman, dampak)
  weaknessDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi kelemahan harus berupa teks",
  }),

  treatDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi ancaman harus berupa teks",
  }),

  impactDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi dampak harus berupa teks",
  }),

  // Inherent Risk
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

  inherentLikelihoodDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi inherent likelihood harus berupa teks",
  }),

  inherentImpactDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi inherent impact harus berupa teks",
  }),

  // Control Assessment
  existingControls: Joi.string().allow("", null).messages({
    "string.base": "Existing controls harus berupa teks",
  }),

  controlEffectiveness: Joi.string()
    .valid(...Object.values(CONTROL_EFFECTIVENESS))
    .allow(null)
    .messages({
      "any.only": `Control effectiveness harus salah satu dari: ${Object.values(CONTROL_EFFECTIVENESS).join(", ")}`,
    }),

  // Treatment & Priority
  treatmentOption: Joi.string()
    .valid(...Object.values(TREATMENT_OPTIONS))
    .allow(null)
    .messages({
      "any.only": `Treatment option harus salah satu dari: ${Object.values(TREATMENT_OPTIONS).join(", ")}`,
    }),

  treatmentRationale: Joi.string().allow("", null).messages({
    "string.base": "Treatment rationale harus berupa teks",
  }),

  riskPriorityRank: Joi.number().integer().min(1).allow(null).messages({
    "number.base": "Risk priority rank harus berupa angka",
    "number.integer": "Risk priority rank harus berupa bilangan bulat",
    "number.min": "Risk priority rank minimal 1",
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

  // Risk Description (kelemahan, ancaman, dampak)
  weaknessDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi kelemahan harus berupa teks",
  }),

  treatDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi ancaman harus berupa teks",
  }),

  impactDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi dampak harus berupa teks",
  }),

  // Inherent Risk
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

  inherentLikelihoodDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi inherent likelihood harus berupa teks",
  }),

  inherentImpactDescription: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi inherent impact harus berupa teks",
  }),

  // Control Assessment
  existingControls: Joi.string().allow("", null).messages({
    "string.base": "Existing controls harus berupa teks",
  }),

  controlEffectiveness: Joi.string()
    .valid(...Object.values(CONTROL_EFFECTIVENESS))
    .allow(null)
    .messages({
      "any.only": `Control effectiveness harus salah satu dari: ${Object.values(CONTROL_EFFECTIVENESS).join(", ")}`,
    }),

  // Treatment & Priority
  treatmentOption: Joi.string()
    .valid(...Object.values(TREATMENT_OPTIONS))
    .allow(null)
    .messages({
      "any.only": `Treatment option harus salah satu dari: ${Object.values(TREATMENT_OPTIONS).join(", ")}`,
    }),

  treatmentRationale: Joi.string().allow("", null).messages({
    "string.base": "Treatment rationale harus berupa teks",
  }),

  riskPriorityRank: Joi.number().integer().min(1).allow(null).messages({
    "number.base": "Risk priority rank harus berupa angka",
    "number.integer": "Risk priority rank harus berupa bilangan bulat",
    "number.min": "Risk priority rank minimal 1",
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
