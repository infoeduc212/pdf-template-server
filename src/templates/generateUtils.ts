import dayjs from "dayjs";
import pdfmake from "pdfmake";
import { TableCell } from "pdfmake/interfaces";
import { createHeader, createRodape } from "./reusable/generics";
import styles from "./reusable/styles";
import fontDescriptors from "./utils/fontDescriptors";
import { downloadImage } from "./utils/imageUtils";
require("dayjs/locale/pt-br");
import localeData from "dayjs/plugin/localeData";
dayjs.extend(localeData);

const writer = new pdfmake(fontDescriptors);

export async function createGenericTablePDF(
    title: string,
    pageHeader: {
        logomarcaUrl: string;
        titulo: string;
        prefeitura: string;
        cnpj: string;
    },
    header: Array<string>,
    widths: Array<string>,
    list: Array<Array<string>>,
    user: {
        name: string;
    }
) {
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

export function generateAtividadesTable(
    atividades: Array<{
        numero_aula: number;
        data: string;
        resumo: string;
        rubrica_professor: string;
    }>,
    data: string,
    observacao: string
) {
    const date = dayjs(data);
    const localizedMonths = dayjs.localeData().months();
    const document = writer.createPdfKitDocument({
        pageMargins: [5, 5, 5, 5],
        content: [
            {
                text: `Mês: ${localizedMonths[date.month()]}`,
                alignment: "center",
            },
            {
                table: {
                    widths: [50, 50, "*", 100],
                    body: [
                        [
                            "N° da Aula",
                            "Data",
                            "Resumo das Atividades",
                            "Rubrica do(a) Professor(a)",
                        ],
                        ...atividades.map((atividade) => [
                            atividade.numero_aula,
                            atividade.data,
                            atividade.resumo,
                            atividade.rubrica_professor,
                        ]),
                    ],
                },
            },
        ],
    });
    return document;
}
