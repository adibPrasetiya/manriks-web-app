import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient({
  // log:
  //   process.env.NODE_ENV === "development"
  //     ? ["query", "error", "warn"]
  //     : ["error"],
});
