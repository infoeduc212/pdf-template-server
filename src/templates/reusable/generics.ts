import { Content } from "pdfmake/interfaces";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

function createHeader(
    image: string,
    h1: string,
    prefeitura: string,
    cnpj: string
): Array<Content> {
    return [
        {
            image: image,
            width: 100,
            height: 100,
            alignment: "center",
            margin: [0, 0, 0, 20],
        },
        {
            text: h1,
            fontSize: 15,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 5],
        },
        {
            text: prefeitura,
            fontSize: 12,
            alignment: "center",
            margin: [0, 0, 0, 5],
        },
        {
            text: `CNPJ: ${cnpj}`,
            fontSize: 12,
            alignment: "center",
            margin: [0, 0, 0, 30],
        },
    ];
}

function createRodape(date: Date, user: { name: string }) {
    let time = dayjs(date).tz("America/Sao_Paulo");
    return {
        style: "rodape",
        text: `Relatório gerado pela Plataforma InfoEduc às ${time.format(
            "HH:mm:ss"
        )} na data ${time.format("DD/MM/YYYY")} por ${user.name}`,
    };
}

export { createHeader, createRodape };
