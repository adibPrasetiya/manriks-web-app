import Joi from "joi";
import { ASSET_STATUSES } from "../config/constant.js";

const createAssetSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama aset tidak boleh kosong",
    "string.min": "Nama aset minimal 2 karakter",
    "string.max": "Nama aset maksimal 255 karakter",
    "any.required": "Nama aset wajib diisi",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Kode aset tidak boleh kosong",
      "string.min": "Kode aset minimal 2 karakter",
      "string.max": "Kode aset maksimal 100 karakter",
      "string.pattern.base":
        "Kode aset hanya boleh berisi huruf kapital, angka, underscore, dan dash",
      "any.required": "Kode aset wajib diisi",
    }),

  categoryId: Joi.string().required().messages({
    "string.empty": "ID kategori aset tidak boleh kosong",
    "any.required": "ID kategori aset wajib diisi",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  owner: Joi.string().max(255).allow("", null).messages({
    "string.max": "Owner maksimal 255 karakter",
  }),

  status: Joi.string()
    .valid(...Object.values(ASSET_STATUSES))
    .default(ASSET_STATUSES.ACTIVE)
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(ASSET_STATUSES).join(", ")}`,
    }),
});

const updateAssetSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama aset tidak boleh kosong",
    "string.min": "Nama aset minimal 2 karakter",
    "string.max": "Nama aset maksimal 255 karakter",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .messages({
      "string.empty": "Kode aset tidak boleh kosong",
      "string.min": "Kode aset minimal 2 karakter",
      "string.max": "Kode aset maksimal 100 karakter",
      "string.pattern.base":
        "Kode aset hanya boleh berisi huruf kapital, angka, underscore, dan dash",
    }),

  categoryId: Joi.string().messages({
    "string.empty": "ID kategori aset tidak boleh kosong",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),

  owner: Joi.string().max(255).allow("", null).messages({
    "string.max": "Owner maksimal 255 karakter",
  }),

  status: Joi.string()
    .valid(...Object.values(ASSET_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(ASSET_STATUSES).join(", ")}`,
    }),
}).min(1);

const searchAssetSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  code: Joi.string().max(100).messages({
    "string.max": "Kode maksimal 100 karakter",
  }),

  categoryId: Joi.string().messages({
    "string.base": "ID kategori harus berupa string",
  }),

  status: Joi.string()
    .valid(...Object.values(ASSET_STATUSES))
    .messages({
      "any.only": `Status harus salah satu dari: ${Object.values(ASSET_STATUSES).join(", ")}`,
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
  unitKerjaId: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),
});

const assetIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID aset tidak boleh kosong",
    "any.required": "ID aset wajib diisi",
  }),
});

export {
  createAssetSchema,
  updateAssetSchema,
  searchAssetSchema,
  unitKerjaIdSchema,
  assetIdSchema,
};
