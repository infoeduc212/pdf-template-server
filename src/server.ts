import { Browser, PaperFormat } from "puppeteer";

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import express, { Request, Response } from "express";
const app = express();
import ejs from "ejs";
import morgan from "morgan";
import { compile, evaluate } from 'mathjs';
import { inspect } from 'util';
import { DateTime, Duration } from 'luxon'


app.use(express.json());
app.use(morgan("combined"));

export default function createServer(): Promise<any> {
    const avaliableTemplates = new Map<string, { format: string; landscape: boolean; noWatermark: boolean; path: string; }>()
    const pathList = JSON.parse(fs.readFileSync(path.join(__dirname, "./templates/config.json"), { encoding: "utf8" })) as Array<{
        path: string,
        format: string
        landscape: boolean
        watermark_exceptions: Array<string>
    }>
    pathList.forEach(cfg => {
        const templatesPath = path.join(__dirname, "templates", cfg.path)
        if (fs.existsSync(templatesPath)) {
            const templates = fs.readdirSync(templatesPath)
            templates.forEach(template => {
                const joinedPath = path.join(templatesPath, template)
                const stat = fs.statSync(joinedPath)
                if (stat.isFile()) {
                    const templateName = path.basename(template).replace(".ejs", "")
                    
                    avaliableTemplates.set(templateName, {
                        format: cfg.format.toLowerCase(),
                        landscape: cfg.landscape,
                        noWatermark: cfg.watermark_exceptions && cfg.watermark_exceptions.indexOf(templateName) !== -1,
                        path: path.join(templatesPath, template)
                    })
                }
            })
        }
    });
    console.log(avaliableTemplates)

    app.get("/error", (req, res, next) => {
        next(new Error("erro"))
    })

    return new Promise((resolve, _) => {
        puppeteer
            .launch({
                // Necessário para rodar no Heroku
                args: ["--no-sandbox"],
            })
            .then((browser: Browser) => {
                app.post("/generate", async (req, res, next) => {
                    const reqTemplate = req.body.templateName;
                    const args = req.body.arguments;

                    const outputType = req.body.output
                        ? req.body.output
                        : "pdf";
                    if (typeof reqTemplate !== "string")
                        return res.status(400)
                        .send("Invalid template name (not a string)");
                    
                        if (typeof args !== "object")
                        return res
                            .status(400)
                            .send("No arguments object provided");

                    try {
                        const template = avaliableTemplates.get(reqTemplate)
                        if (template) {
                            console.debug(inspect(args, {showHidden: false, depth: null, colors: true}))
                            const render = (await ejs.renderFile(
                                template.path,
                                {...args, math: {
                                    compile,
                                    evaluate
                                }, DateTime, Duration}
                            )) as string;
                            if (outputType === "pdf") {
                                res.setHeader(
                                    "Content-Type",
                                    "application/pdf"
                                );

                                const page = await browser.newPage();
                                await page.setViewport({ width: 2480, height: 3508 })
                                await page.setContent(render);
                                await page.evaluateHandle(
                                    "document.fonts.ready"
                                );
                                const dateNow = DateTime.now().setZone("America/Sao_Paulo")
                                const stream = await page.createPDFStream({
                                    format: template.format as PaperFormat,
                                    landscape: template.landscape,
                                    margin: {
                                        top: 15,
                                        bottom: 30,
                                        left: 10,
                                        right: 10,
                                    },
                                    printBackground: true,
                                    footerTemplate: `
                                <div style="width: 100%; margin-right: 10px; text-align: right; font-size: 8px;">
                                PDF gerado pela a Plataforma InfoEduc na data ${dateNow.toFormat("dd/MM/yyyy")} às ${dateNow.toFormat("HH:mm:ss")}
                                </div>
                                `,
                                    displayHeaderFooter: !template.noWatermark,
                                });
                                stream.pipe(res);
                                stream.on("end", async () => {
                                    await page.close();
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
                app.use((err: Error, req: Request, res: Response, next: any) => {
                    console.log(`Env: ${process.env.NODE_ENV}`)

                    console.error(err)
                    const requestId = req.headers["x-request-id"]

                    if (process.env.NODE_ENV !== "production") {
                        res.status(500).send("<p>" + err.stack + "</p>")
                        return
                    }
                    if (requestId) {
                        res.status(500).send(`Erro ao processar pedido. Request ID: ${requestId}`)
                        return
                    }

                    res.status(500).send("Erro ao processar pedido.")
                })
            })
            .then(() => resolve(app));
    });
}
