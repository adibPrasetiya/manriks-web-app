export class ValidationError extends Error {
  constructor(details) {
    super("Validation Error");
    this.statusCode = 400;
    this.message = "Validation Error";
    this.name = "ValidationError";
    this.details = details || [];
  }
}
