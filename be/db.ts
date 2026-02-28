import { SQLDatabase } from "encore.dev/storage/sqldb";

export const vedaDB = new SQLDatabase("veda", {
  migrations: "./migrations",
});
