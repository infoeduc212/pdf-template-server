import createServer from "./server";
import * as dotenv from "dotenv";
import { createAssetsServer } from "./assetsServer";
import http from 'http'
dotenv.config();

(async () => {
    const server = await createServer();
    const assetsServer = createAssetsServer();
    server.listen(process.env.PORT, () =>
        console.log(`Ouvindo na porta ${process.env.PORT}`)
    );
    // Apenas ouvir no localhost
    http.createServer(assetsServer).listen(2000, "localhost")
})();
