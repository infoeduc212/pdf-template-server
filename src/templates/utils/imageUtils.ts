import axios from "axios";
import DataURIParser from "datauri/parser";

const parser = new DataURIParser();
async function downloadImage(url: string): Promise<string> {
    const arrayBuffer = await axios.get(url, {
        responseType: "arraybuffer",
    });
    // @ts-ignore
    return parser.format(".png", Buffer.from(arrayBuffer.data, "binary"))
        .content;
}

export { downloadImage };
