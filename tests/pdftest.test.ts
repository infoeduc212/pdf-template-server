import ejs from 'ejs';
import { PDFDocument } from 'pdf-lib'
import { join } from 'path'

function generateHtml(templateName: string, data: object) {
    console.log(__dirname)
    return ejs.renderFile(join(__dirname, "..", "src", "ejs-templates", `${templateName}.ejs`), data)
}

async function generatePdfBuffer(templateName: string, data: object) {
    // @ts-ignore
    const page = await browser.newPage()
    await page.setContent(generateHtml(templateName, data))
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
    })
}

async function getPdfPageCount(buffer: Buffer) {
    const document = await PDFDocument.load(buffer)
    return document.getPageCount()
}

async function extractPdfTemplatePageCount(templateName: string, data: object) {
    const pdfBuffer = await generatePdfBuffer(templateName, data)
    return getPdfPageCount(pdfBuffer)
}

describe("Gerar PDFs e verificar quantidade de páginas", () => {
    it("Gerar Ficha de Aluno", () => {
        return expect(extractPdfTemplatePageCount("ficha-aluno", {
            "escola": {
                "unidade_ensino": "Teste"
            },
            "header": {
                "logomarca_url": "https://images-na.ssl-images-amazon.com/images/I/71xRZ5189wL.png",
                "nome": "Escola Milton",
                "endereco": "Rua Capitão Licínio Guimarares",
                "municipio": "Simão Dias - SE"
            },
            "aluno": {
                "foto_url": "https://images-na.ssl-images-amazon.com/images/I/71xRZ5189wL.png",
                "nis": "12421421412",
                "rg": "124124124",
                "etnia_cor": "Pardo",
                "cpf": "088.055.555-55",
                "data_nascimento": "1995-12-17T03:24:00",
                "nome": "Kevin Maicon Belo Farias",
                "inep": "554564654",
                "genero": "Masculino",
                "tem_deficiencia": false,
                "especificacao_deficiencia": "Física",
                "nome_pai": "Teste",
                "nome_mae": "Teste",
                "dados_endereco": {
                    "endereco": "Rua Capitão Licínio Guimarares",
                    "numero": "70",
                    "municipio": "Simão Dias",
                    "cep": "49480-000",
                    "uf": "SE",
                    "complemento": "Perto aqui",
                    "zona_residencia": "Zona Rural",
                    "bairro": "Belita"  
                },
                "contato": {
                    "email_principal": "kevinmaicon27@gmail.com",
                    "email_secundario": "qpjdfkwefjwç@gmail.com",
                    "celular": "(79) 99999-9999",
                    "whatsapp": "132409813049"
                },
                "dados_variaveis": {
                    "recebe_bolsa_familia": true,
                    "transporte_escolar_publico": true,
                    "escolarizacao_outro_espaco": "Não recebe"
                },
                "certidao_antiga": {
                    
                },
                "certidao_nova": {
                    
                },
                "matricula": {
                    "situacao": "Nova"
                }
            }
        })).resolves.toBe(1)
    }, 10000)
})