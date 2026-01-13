import Joi from "joi";

const createKonteksSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Nama konteks tidak boleh kosong",
    "string.min": "Nama konteks minimal 3 karakter",
    "any.required": "Nama konteks wajib diisi",
  }),

  code: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[A-Z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Kode konteks tidak boleh kosong",
      "string.pattern.base":
        "Kode konteks hanya boleh berisi huruf kapital, angka, underscore, dan dash",
      "any.required": "Kode konteks wajib diisi",
    }),

  description: Joi.string().allow("", null).optional(),

  periodStart: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base": "Periode mulai harus berupa angka",
    "number.min": "Periode mulai minimal tahun 2000",
    "any.required": "Periode mulai wajib diisi",
  }),

  periodEnd: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .greater(Joi.ref("periodStart"))
    .required()
    .messages({
      "number.base": "Periode akhir harus berupa angka",
      "number.greater": "Periode akhir harus lebih besar dari periode mulai",
      "any.required": "Periode akhir wajib diisi",
    }),

  // Risk Appetite (simple)
  riskAppetiteLevel: Joi.string().max(100).allow("", null).optional(),
  riskAppetiteDescription: Joi.string().allow("", null).optional(),

  // Risk Categories (array of objects)
  riskCategories: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(2).max(255).required().messages({
          "any.required": "Nama kategori risiko wajib diisi",
        }),
        description: Joi.string().allow("", null).optional(),
        order: Joi.number().integer().min(0).default(0),
      })
    )
    .min(1)
    .optional()
    .messages({
      "array.min": "Minimal harus ada 1 kategori risiko",
    }),

  // Likelihood Scale (array of objects)
  likelihoodScales: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().min(1).required().messages({
          "any.required": "Level likelihood wajib diisi",
        }),
        label: Joi.string().min(2).max(100).required().messages({
          "any.required": "Label likelihood wajib diisi",
        }),
        description: Joi.string().required().messages({
          "any.required": "Deskripsi likelihood wajib diisi",
        }),
      })
    )
    .min(1)
    .optional()
    .messages({
      "array.min": "Minimal harus ada 1 likelihood scale",
    }),

  // Impact Scale (array of objects)
  impactScales: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().min(1).required().messages({
          "any.required": "Level impact wajib diisi",
        }),
        label: Joi.string().min(2).max(100).required().messages({
          "any.required": "Label impact wajib diisi",
        }),
        description: Joi.string().required().messages({
          "any.required": "Deskripsi impact wajib diisi",
        }),
      })
    )
    .min(1)
    .optional()
    .messages({
      "array.min": "Minimal harus ada 1 impact scale",
    }),

  // Risk Matrix (array of objects with likelihood x impact combinations)
  riskMatrices: Joi.array()
    .items(
      Joi.object({
        likelihoodLevel: Joi.number().integer().min(1).required().messages({
          "any.required": "Likelihood level wajib diisi",
        }),
        impactLevel: Joi.number().integer().min(1).required().messages({
          "any.required": "Impact level wajib diisi",
        }),
        riskLevel: Joi.string()
          .valid("LOW", "MEDIUM", "HIGH", "CRITICAL")
          .required()
          .messages({
            "any.required": "Risk level wajib diisi",
            "any.only":
              "Risk level harus salah satu dari: LOW, MEDIUM, HIGH, CRITICAL",
          }),
      })
    )
    .optional(),
});

const updateKonteksSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow("", null),

  periodStart: Joi.number().integer().min(2000).max(2100),
  periodEnd: Joi.number().integer().min(2000).max(2100),

  riskAppetiteLevel: Joi.string().max(100).allow("", null),
  riskAppetiteDescription: Joi.string().allow("", null),

  // Note: Updating related tables (categories, scales, matrices) will be done
  // via separate endpoints or requires replace-all approach
})
  .min(1)
  .messages({
    "object.min": "Minimal harus ada 1 field yang diupdate",
  });

const konteksIdSchema = Joi.object({
  konteksId: Joi.string().required(),
});

const searchKonteksSchema = Joi.object({
  name: Joi.string().max(255),
  code: Joi.string().max(100),
  periodStart: Joi.number().integer().min(2000).max(2100),
  periodEnd: Joi.number().integer().min(2000).max(2100),
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export {
  createKonteksSchema,
  updateKonteksSchema,
  konteksIdSchema,
  searchKonteksSchema,
};
