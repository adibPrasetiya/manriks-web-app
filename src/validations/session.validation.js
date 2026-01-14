import Joi from "joi";

const searchSessionSchema = Joi.object({
  username: Joi.string().max(255).messages({
    "string.max": "Username maksimal 255 karakter",
  }),

  email: Joi.string().email().max(255).messages({
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
  }),

  isActive: Joi.boolean().messages({
    "boolean.base": "isActive harus berupa boolean (true/false)",
  }),

  createdFrom: Joi.date().iso().messages({
    "date.base": "createdFrom harus berupa tanggal yang valid (ISO 8601)",
    "date.format": "Format tanggal harus ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)",
  }),

  createdTo: Joi.date().iso().min(Joi.ref("createdFrom")).messages({
    "date.base": "createdTo harus berupa tanggal yang valid (ISO 8601)",
    "date.min": "createdTo harus lebih besar atau sama dengan createdFrom",
  }),

  expiresFrom: Joi.date().iso().messages({
    "date.base": "expiresFrom harus berupa tanggal yang valid (ISO 8601)",
  }),

  expiresTo: Joi.date().iso().min(Joi.ref("expiresFrom")).messages({
    "date.base": "expiresTo harus berupa tanggal yang valid (ISO 8601)",
    "date.min": "expiresTo harus lebih besar atau sama dengan expiresFrom",
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

const sessionIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "Session ID tidak boleh kosong",
    "any.required": "Session ID wajib diisi",
  }),
});

const userIdForSessionSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID tidak boleh kosong",
    "any.required": "User ID wajib diisi",
  }),
});

const bulkDeleteExpiredSchema = Joi.object({
  confirm: Joi.boolean().valid(true).required().messages({
    "any.only":
      "Konfirmasi diperlukan untuk menghapus semua session kadaluarsa (confirm: true)",
    "any.required": "Konfirmasi diperlukan (confirm: true)",
  }),
});

export {
  searchSessionSchema,
  sessionIdSchema,
  userIdForSessionSchema,
  bulkDeleteExpiredSchema,
};
