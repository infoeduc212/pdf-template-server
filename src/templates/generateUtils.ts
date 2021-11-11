import pdfmake from "pdfmake";
import { TableCell } from "pdfmake/interfaces";
import { createHeader, createRodape } from "./reusable/generics";
import styles from "./reusable/styles";
import fontDescriptors from "./utils/fontDescriptors";
import { downloadImage } from "./utils/imageUtils";

export async function createGenericTablePDF(
    title: string,
    pageHeader: {
        logomarcaUrl: string
        titulo: string
        prefeitura: string
        cnpj: string
    },
    header: Array<string>,
    widths: Array<string>,
    list: Array<Array<string>>,
    user: {
        name: string
    }
) {
    const writer = new pdfmake(fontDescriptors);
    const downloadedImage = await downloadImage(pageHeader.logomarcaUrl);
    const document = writer.createPdfKitDocument({
        content: [
            ...createHeader(
                downloadedImage,
                pageHeader.titulo,
                pageHeader.prefeitura,
                pageHeader.cnpj
            ),
            {
                text: title,
                style: "titulo",
            },
            {
                table: {
                    widths,
                    body: [
                        header.map(
                            (value) =>
                                [
                                    {
                                        text: value,
                                        style: "tableHeader",
                                    },
                                ] as TableCell
                        ),
                        ...list,
                    ],
                },
            },
            createRodape(new Date(), user),
        ],
        styles: styles,
    });
    return document;
}
