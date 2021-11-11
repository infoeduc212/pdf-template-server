import { Browser } from "puppeteer";

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import express from "express";
const app = express();
import ejs from "ejs";
import { createGenericTablePDF } from "./templates/generateUtils";
import cors from "cors";
import morgan from "morgan";
import { JSDOM } from "jsdom";

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
                    if (outputType == "pdf") {
                        const page = await browser.newPage();
                        await page.setContent(jsdom.serialize());
                        page.pdf({
                            format: "a4",
                        })
                            .then((buffer) =>
                                res
                                    .setHeader(
                                        "Content-Type",
                                        "application/pdf"
                                    )
                                    .send(buffer)
                            )
                            .catch(next);
                    } else {
                        res.send(jsdom.serialize());
                    }
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
                            const page = await browser.newPage();
                            await page.setContent(render);
                            await page.evaluateHandle("document.fonts.ready");
                            page.pdf({
                                format: "a4",
                                printBackground: true,
                            }).then((buffer: Buffer) => {
                                res.setHeader(
                                    "Content-Type",
                                    "application/pdf"
                                ).send(buffer);
                            });
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
