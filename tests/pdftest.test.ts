import ejs from "ejs";
import { PDFDocument } from "pdf-lib";
import { join } from "path";
import { createAssetsServer } from "../src/assetsServer";

function generateHtml(templateName: string, data: object) {
    return ejs.renderFile(
        join(__dirname, "..", "src", "templates", "a4-portrait", `${templateName}.ejs`),
        data
    );
}

async function generatePdfBuffer(templateName: string, data: object) {
    // @ts-ignore
    const page = await browser.newPage();
    await page.setContent(generateHtml(templateName, data));
    return page.pdf({
        format: "a4",
        margin: {
            top: 10,
            bottom: 20,
            left: 10,
            right: 10,
        },
        footerTemplate: `
        <div style="width: 100%; margin-right: 10px; text-align: right; font-size: 8px;">
            PDF gerado pela a Plataforma InfoEduc
        </div>
        `,
        displayHeaderFooter: true,
    });
}

async function getPdfPageCount(buffer: Buffer) {
    const document = await PDFDocument.load(buffer);
    return document.getPageCount();
}

async function extractPdfTemplatePageCount(templateName: string, data: object) {
    const pdfBuffer = await generatePdfBuffer(templateName, data);
    return getPdfPageCount(pdfBuffer);
}

describe("Gerar PDFs e verificar quantidade de páginas", () => {
    let server: any;
    beforeAll(() => {
        // Carregar antes o servidor de assets (que contém as fontes customizadas)
        server = createAssetsServer().listen(2000);
    });
    afterAll(() => {
        server.close();
    });

    it("Gerar Ficha de Aluno", () => {
        return expect(
            extractPdfTemplatePageCount("ficha-aluno", {
                escola: {
                    unidade_ensino: "Teste",
                    codigo_inep: "1423241325125125",
                    endereco: "Rua Jatobá",
                    cidade: "Várzea Grande",
                    estado: "MT",
                },
                header: {
                    logomarca_url:
                        "https://images-na.ssl-images-amazon.com/images/I/71xRZ5189wL.png",
                    nome: "Escola Milton",
                    endereco: "Rua Capitão Licínio Guimarares",
                    municipio: "Simão Dias - SE",
                },
                aluno: {
                    foto_url:
                        "https://images-na.ssl-images-amazon.com/images/I/71xRZ5189wL.png",
                    nis: "12421421412",
                    rg: "124124124",
                    etnia_cor: "Pardo",
                    cpf: "612.675.919-27",
                    data_nascimento: "1999-04-02",
                    nome: "Ayla Marli Betina Novaes",
                    inep: "5545646543434",
                    genero: "Feminino",
                    tem_deficiencia: "false",
                    especificacao_deficiencia: "Física",
                    nome_pai: "Teste",
                    nome_mae: "Teste",
                    dados_endereco: {
                        endereco: "Rua Capitão Licínio Guimarares",
                        numero: "70",
                        municipio: "Simão Dias",
                        cep: "49480-000",
                        uf: "SE",
                        complemento: "Perto aqui",
                        zona_residencia: "Zona Rural",
                        bairro: "Belita",
                    },
                    contato: {
                        email_principal: "teste@gmail.com",
                        email_secundario: "teste2@gmail.com",
                        celular: "(79) 99999-9999",
                        whatsapp: "(79) 99999-9999",
                    },
                    dados_variaveis: {
                        recebe_bolsa_familia: "true",
                        transporte_escolar_publico: "true",
                        escolarizacao_outro_espaco: "Não recebe",
                    },
                    certidao_antiga: {
                        numero_termo: "14324125125",
                        folha: "41241243",
                        livro: "43123",
                        data_emissao: "2020-05-05",
                    },
                    certidao_nova: {
                        numero_matricula: "1294732894781329752",
                    },
                    matricula: {
                        data: "2020-05-05",
                        situacao: "Nova",
                    },
                },
            })
        ).resolves.toBe(1);
    });

    it("Gerar Dados do Professor", () => {
        return expect(
            extractPdfTemplatePageCount("ficha-professor", {
                header: {
                    logomarca_url:
                        "https://images-na.ssl-images-amazon.com/images/I/71xRZ5189wL.png",
                    nome: "Escola Milton",
                    endereco: "Rua Capitão Licínio Guimarares",
                    municipio: "Simão Dias - SE",
                },
                professor: {
                    foto_url: "",
                    nome: "Priscila Teresinha Araújo",
                    inep: "53532423434",
                    nis: "23094823904",
                    nacionalidade: "Brasileira",
                    data_nascimento: "1970-03-13",
                    genero: "Feminino",
                    ssp_rg: "SE",
                    rg: "30.759.702-7",
                    etnia_cor: "Branca",
                    certidao_antiga: {
                        numero_termo: "42341342",
                        folha: "43242342",
                        livro: "134134",
                        data_emissao: "1999-03-05",
                        municipio: "Simão Dias",
                    },
                    certidao_nova: {
                        numero_matricula: "324324142",
                    },
                    dados_endereco: {
                        endereco: "Rua Capitão Licínio Guimarares",
                        numero: "70",
                        municipio: "Simão Dias",
                        cep: "49480-000",
                        uf: "SE",
                        complemento: "Perto aqui",
                        zona_residencia: "Zona Rural",
                        bairro: "Belita",
                    },
                    contato: {
                        email_principal: "teste@gmail.com",
                        email_secundario: "teste2@gmail.com",
                        celular: "(79) 99999-9999",
                        whatsapp: "(79) 99999-9999",
                        link_instagram: "instagram.com",
                        link_facebook: "facebook.com",
                        link_youtube: "youtube.com",
                    },
                },
            })
        ).resolves.toBe(1);
    });

    it("Gerar Frequência do Aluno (duas páginas)", () => {
        expect(
            extractPdfTemplatePageCount("aluno-frequencia", {
                periodo_letivo: {
                    data_inicio: "2020",
                    data_termino: "2021-02-02",
                },
                data: "2021-11-09",
                observacao:
                    "Teste Teste Teste Teste Teste Teste Teste Teste Teste Teste Teste Teste Teste",
                aluno: {
                    nome: "Kevin Maicon",
                    ordem_frequencia: "01",
                },
                frequencia: [
                    {
                        qtd_presenca: 7,
                        qtd_faltas: 2,
                        date: "Jan 01, 2021",
                    },
                    {
                        qtd_presenca: 5,
                        qtd_faltas: 3,
                        date: "Jan 3, 2020",
                    },
                ],
                atividades: [
                    {
                        numero_aula: 11,
                        data: "2021-11-19",
                    },
                ],
            })
        ).resolves.toBe(2);
    });
});
