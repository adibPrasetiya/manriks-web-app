import Joi from "joi";

// Schema untuk membuat change request (user)
const createChangeRequestSchema = Joi.object({
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
})
  .min(1)
  .messages({
    "object.min":
      "Minimal satu field harus diisi untuk membuat permintaan perubahan",
  });

// Schema untuk menolak request (admin)
const rejectRequestSchema = Joi.object({
  rejectionReason: Joi.string().min(10).max(500).required().messages({
    "string.empty": "Alasan penolakan tidak boleh kosong",
    "string.min": "Alasan penolakan minimal 10 karakter",
    "string.max": "Alasan penolakan maksimal 500 karakter",
    "any.required": "Alasan penolakan wajib diisi",
  }),
});

// Schema untuk search requests (admin)
const searchRequestsSchema = Joi.object({
  status: Joi.string().valid("PENDING", "APPROVED", "REJECTED").optional(),
  requestType: Joi.string()
    .valid("INITIAL_VERIFICATION", "CHANGE")
    .optional(),
  unitKerjaId: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Schema untuk validasi requestId
const requestIdSchema = Joi.object({
  requestId: Joi.string().required().messages({
    "string.empty": "Request ID tidak boleh kosong",
    "any.required": "Request ID wajib diisi",
  }),
});

export {
  createChangeRequestSchema,
  rejectRequestSchema,
  searchRequestsSchema,
  requestIdSchema,
};
