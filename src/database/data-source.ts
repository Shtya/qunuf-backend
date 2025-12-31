import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export default new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "qunuf",
    entities: ["src/common/entities/*.ts"],
    migrations: ["src/database/migrations/*.ts"],
    synchronize: false,
});
