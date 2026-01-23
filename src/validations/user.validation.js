import Joi from "joi";
import { ROLES } from "../config/constant.js";

const registedNewUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(255)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      "string.empty": "Username tidak boleh kosong",
      "string.min": "Username minimal 3 karakter",
      "string.max": "Username maksimal 255 karakter",
      "string.pattern.base":
        "Username hanya boleh berisi huruf, angka, dan underscore",
      "any.required": "Username wajib diisi",
    }),

  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal 2 karakter",
    "string.max": "Nama maksimal 255 karakter",
    "any.required": "Nama wajib diisi",
  }),

  email: Joi.string().email().max(255).required().messages({
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
    "any.required": "Email wajib diisi",
  }),

  password: Joi.string()
    .min(8)
    .max(255)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]+$/,
    )
    .required()
    .messages({
      "string.empty": "Password tidak boleh kosong",
      "string.min": "Password minimal 8 karakter",
      "string.max": "Password maksimal 255 karakter",
      "string.pattern.base":
        "Password harus mengandung minimal 1 huruf kecil, 1 huruf kapital, 1 angka, dan 1 karakter spesial (@$!%*?&#^()_-+=)",
      "any.required": "Password wajib diisi",
    }),
});

const loginSchema = Joi.object({
  // User bisa login dengan username atau email
  identifier: Joi.string().required().messages({
    "string.empty": "Username atau email tidak boleh kosong",
    "any.required": "Username atau email wajib diisi",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong",
    "any.required": "Password wajib diisi",
  }),
});

const searchUserSchema = Joi.object({
  name: Joi.string().max(255).messages({
    "string.max": "Nama maksimal 255 karakter",
  }),

  username: Joi.string().max(255).messages({
    "string.max": "Username maksimal 255 karakter",
  }),

  role: Joi.string()
    .valid(...Object.values(ROLES))
    .messages({
      "any.only": `Role harus salah satu dari: ${Object.values(ROLES).join(", ")}`,
    }),

  isActive: Joi.boolean().messages({
    "boolean.base": "isActive harus berupa boolean (true/false)",
  }),

  isVerified: Joi.boolean().messages({
    "boolean.base": "isVerified harus berupa boolean (true/false)",
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

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "string.empty": "Refresh token tidak boleh kosong",
    "any.required": "Refresh token wajib diisi",
  }),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Password saat ini tidak boleh kosong",
    "any.required": "Password saat ini wajib diisi",
  }),

  newPassword: Joi.string()
    .min(8)
    .max(255)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]+$/,
    )
    .required()
    .messages({
      "string.empty": "Password baru tidak boleh kosong",
      "string.min": "Password baru minimal 8 karakter",
      "string.max": "Password baru maksimal 255 karakter",
      "string.pattern.base":
        "Password baru harus mengandung minimal 1 huruf kecil, 1 huruf kapital, 1 angka, dan 1 karakter spesial (@$!%*?&#^()_-+=)",
      "any.required": "Password baru wajib diisi",
    }),
});

const userIdSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),
});

const updateUserByAdminSchema = Joi.object({
  name: Joi.string().min(2).max(255).messages({
    "string.empty": "Nama tidak boleh kosong",
    "string.min": "Nama minimal 2 karakter",
    "string.max": "Nama maksimal 255 karakter",
  }),

  email: Joi.string().email().max(255).messages({
    "string.empty": "Email tidak boleh kosong",
    "string.email": "Format email tidak valid",
    "string.max": "Email maksimal 255 karakter",
  }),

  username: Joi.string()
    .min(3)
    .max(255)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      "string.empty": "Username tidak boleh kosong",
      "string.min": "Username minimal 3 karakter",
      "string.max": "Username maksimal 255 karakter",
      "string.pattern.base":
        "Username hanya boleh berisi huruf, angka, dan underscore",
    }),

  isActive: Joi.boolean().messages({
    "boolean.base": "isActive harus berupa boolean (true/false)",
  }),

  isVerified: Joi.boolean().messages({
    "boolean.base": "isVerified harus berupa boolean (true/false)",
  }),

  roles: Joi.array()
    .items(Joi.string().valid(...Object.values(ROLES)))
    .min(1)
    .unique()
    .messages({
      "array.base": "Roles harus berupa array",
      "array.min": "Minimal harus ada 1 role",
      "array.unique": "Roles tidak boleh duplikat",
      "any.only": `Role harus salah satu dari: ${Object.values(ROLES).join(", ")}`,
    }),
})
  .min(1)
  .messages({
    "object.min": "Minimal harus ada 1 field yang diupdate",
  });

export {
  registedNewUserSchema,
  loginSchema,
  searchUserSchema,
  refreshTokenSchema,
  updatePasswordSchema,
  userIdSchema,
  updateUserByAdminSchema,
};
