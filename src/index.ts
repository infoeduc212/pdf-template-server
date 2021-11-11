import createServer from "./server";
import * as dotenv from "dotenv";
import { createAssetsServer } from "./assetsServer";
dotenv.config();

(async () => {
    const server = await createServer();
    const assetsServer = createAssetsServer();
    server.listen(process.env.PORT, () =>
        console.log(`Ouvindo na porta ${process.env.PORT}`)
    );
    assetsServer.listen(process.env.ASSETS_PORT, () => {
        console.log(
            `Servidor de assets ouvindo na porta ${process.env.ASSETS_PORT}`
        );
    });
})()
