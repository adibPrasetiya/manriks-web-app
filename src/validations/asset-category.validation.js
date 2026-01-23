import Joi from "joi";

const createAssetCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Nama kategori aset tidak boleh kosong",
    "string.min": "Nama kategori aset minimal 2 karakter",
    "string.max": "Nama kategori aset maksimal 100 karakter",
    "any.required": "Nama kategori aset wajib diisi",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),
});

const updateAssetCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    "string.empty": "Nama kategori aset tidak boleh kosong",
    "string.min": "Nama kategori aset minimal 2 karakter",
    "string.max": "Nama kategori aset maksimal 100 karakter",
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": "Deskripsi harus berupa teks",
  }),
}).min(1);

const searchAssetCategorySchema = Joi.object({
  name: Joi.string().max(100).messages({
    "string.max": "Nama maksimal 100 karakter",
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

const assetCategoryIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "ID kategori aset tidak boleh kosong",
    "any.required": "ID kategori aset wajib diisi",
  }),
});

export {
  createAssetCategorySchema,
  updateAssetCategorySchema,
  searchAssetCategorySchema,
  assetCategoryIdSchema,
};
