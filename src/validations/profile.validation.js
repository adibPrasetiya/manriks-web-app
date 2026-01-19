import Joi from "joi";

const createNewProfileSchema = Joi.object({
  jabatan: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Jabatan tidak boleh kosong",
    "string.min": "Jabatan minimal 3 karakter",
    "string.max": "Jabatan maksimal 255 karakter",
    "any.required": "Jabatan wajib diisi",
  }),

  unitKerjaId: Joi.string().required().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
    "any.required": "ID unit kerja wajib diisi",
  }),

  nomorHP: Joi.string()
    .pattern(/^(08|62)[0-9]{8,13}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Format nomor HP tidak valid",
    }),
});

// Note: jabatan and unitKerjaId are included for validation purposes,
// but will be rejected by the service layer with instructions to use
// profile-request endpoint for changes to these fields
const updateProfileSchema = Joi.object({
  jabatan: Joi.string().min(3).max(255).optional().messages({
    "string.empty": "Jabatan tidak boleh kosong",
    "string.min": "Jabatan minimal 3 karakter",
    "string.max": "Jabatan maksimal 255 karakter",
  }),

  unitKerjaId: Joi.string().optional().messages({
    "string.empty": "ID unit kerja tidak boleh kosong",
  }),

  nomorHP: Joi.string()
    .pattern(/^(08|62)[0-9]{8,13}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Format nomor HP tidak valid",
    }),
}).min(1);

export { createNewProfileSchema, updateProfileSchema };
