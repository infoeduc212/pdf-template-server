import { StyleDictionary } from "pdfmake/interfaces";

const styles: StyleDictionary = {
    titulo: {
        fontSize: 20,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 30],
    },
    rodape: {
        margin: [0, 10, 0, 0],
        fontSize: 10,
    },
    tableHeader: {
        bold: true,
    },
    h1: {
        fontSize: 14,
        alignment: "center",
    },
};

export default styles;
