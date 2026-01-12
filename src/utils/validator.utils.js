import { ValidationError } from "../errors/validation.error.js";

export const validate = (schema, request) => {
  const result = schema.validate(request, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (result.error) {
    const details = result.error.details.map((detail) => ({
      path: detail.path.join("."),
      detail: detail.message,
    }));

    throw new ValidationError(details);
  } else {
    return result.value;
  }
};
