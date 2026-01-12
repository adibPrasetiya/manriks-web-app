export class CorsError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 403;
    this.message =
      message ||
      "The CORS policy for this site does not allow access from the specified Origin.";
    this.name = "CorsError";
  }
}
