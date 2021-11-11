import cors from "cors";
import express from "express";
import morgan from "morgan";
const app = express();
import path from "path";

export function createAssetsServer() {
    app.use(cors());
    app.use(morgan("combined"));
    app.use("/assets", express.static(path.join(__dirname, "..", "assets")));
    return app;
}
