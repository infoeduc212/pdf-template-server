import { Browser } from "puppeteer";

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import express from "express";
const app = express();
import ejs from "ejs";
import generateAtividadesTable, { createGenericTablePDF } from "./templates/generateUtils";
import cors from "cors";
import morgan from "morgan";
import { JSDOM } from "jsdom";
import { last, PDFDocument } from "pdf-lib";
import concatenateStreamIntoBuffer from "./utils/streamutils";

app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

export default function createServer(): Promise<any> {
    return new Promise((resolve, _) => {
        app.post("/generate_table", async (req, res, next) => {
            try {
                const body = req.body;
                const tableDocument = await createGenericTablePDF(
                    body.page_title,
                    {
                        titulo: body.page_header.titulo,
                        cnpj: body.page_header.cnpj,
                        logomarcaUrl: body.page_header.logomarca_url,
                        prefeitura: body.page_header.nome_prefeitura,
                    },
                    body.table_header,
                    body.widths,
                    body.list,
                    body.user
                );
                tableDocument.end();
                res.setHeader("Content-Type", "application/pdf");
                tableDocument.pipe(res);
            } catch (e: any) {
                next(e);
            }
        });

        puppeteer.launch().then((browser: Browser) => {
            app.post("/generate_frequencia", async (req, res, next) => {
                try {
                    const outputType = req.body.output;
                    const args = req.body.arguments;
                    const rawHtml = fs.readFileSync(
                        path.join(
                            __dirname,
                            "./html-templates/aluno-frequencia.html"
                        )
                    );
                    const jsdom = new JSDOM(rawHtml);
                    const document = jsdom.window.document;

                    const alunoNome = document.getElementById("nome_aluno");
                    const frequencia = document.getElementById(
                        "frequencia"
                    ) as HTMLTableElement;

                    if (alunoNome) alunoNome.textContent = args.aluno.nome;

                    if (frequencia) {
                        const tbody = frequencia.tBodies[0];
                        // TODO: verificar
                        const children = tbody.querySelectorAll("tr");
                        for (let i = 0; i < children.length; i++) {
                            // i será o mês
                            const child = children[i];
                            for (let y = 0; y < 32; y++) {
                                // y será o dia
                                // 32 será o total de faltas desse mês
                                let td = document.createElement("td");
                                td.setAttribute("width", "20px");
                                td.classList.add("text-center");
                                td.textContent = "0";
                                child.appendChild(td);
                            }
                        }
                    }

                    // gerar o pdf
                    const page = await browser.newPage();
                    await page.setContent(jsdom.serialize());
                    page.pdf({
                        format: "a4",
                        pageRanges: "1"
                    }).then(async frequenciaPageBytes => {
                        // TODO: Reinventar isso daqui de outro jeito. Desta maneira atual está duplicando as páginas e alterando a ordem aleatóriamente
                        const document = await PDFDocument.create()
                        const frequenciaDocument = await PDFDocument.load(frequenciaPageBytes)
                        const generated = generateAtividadesTable(args.atividades, args.data, args.observacao)
                        generated.end()
                        const atividadesBuffer = await concatenateStreamIntoBuffer(generated)
                        const atividadesDocument = await PDFDocument.load(atividadesBuffer)
                        const firstPage = await document.copyPages(frequenciaDocument, frequenciaDocument.getPageIndices())
                        let indices = []
                        const totalPages = atividadesDocument.getPageCount()
                        for (let i = 0; i < totalPages; i++) {
                            indices.push(i)
                        }
                        const lastPages = await document.copyPages(atividadesDocument, indices)
                        document.insertPage(0, firstPage[0])
                        let count = 1
                        lastPages.forEach(page => {
                            document.insertPage(count, page)
                            count++
                        })
                        const savedDocument = await document.save()
                        res.setHeader("Content-Type", "application/pdf").send(Buffer.from(savedDocument))
                    }).catch(next)
                } catch (e: any) {
                    next(e);
                }
            });

            app.post("/generate", async (req, res, next) => {
                const reqTemplate = req.body.templateName;
                const args = req.body.arguments;

                const outputType = req.body.output ? req.body.output : "pdf";
                if (typeof reqTemplate !== "string")
                    return res.status(400).send("Invalid template name");
                if (typeof args !== "object")
                    return res.status(400).send("No arguments object provided");

                const filename = reqTemplate + ".ejs";
                const templatePath = path.join(
                    __dirname,
                    "ejs-templates",
                    filename
                );

                try {
                    if (fs.existsSync(templatePath)) {
                        const render = (await ejs.renderFile(
                            templatePath,
                            args
                        )) as string;
                        if (outputType === "pdf") {
                            res.setHeader("Content-Type", "application/pdf")
                            const page = await browser.newPage();
                            await page.setContent(render);
                            await page.evaluateHandle("document.fonts.ready");
                            const stream = await page.createPDFStream({
                                format: "a4",
                                pageRanges: "1",
                                footerTemplate: `
                                <div style="width: 100%; margin-right: 10px; text-align: right; font-size: 8px;">
                                    PDF gerado pela a Plataforma InfoEduc
                                </div>
                                `,
                                displayHeaderFooter: true,
                                margin: {
                                    bottom: "50px"
                                }
                            })
                            stream.pipe(res)
                            stream.on('end', async () => {
                                await page.close()
                            })
                        } else if (outputType === "html") {
                            res.send(render);
                        } else {
                            res.status(400).send("Invalid output type");
                        }
                    } else {
                        res.status(404).send("No template found");
                    }
                } catch (e: any) {
                    next(e);
                }
            });
        }).then(() => resolve(app));
    });
}
