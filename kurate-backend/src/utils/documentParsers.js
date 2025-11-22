import EPub from "epub2";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

const createParsedContent = (toc, sections, images = []) => ({
    toc,
    sections: new Map(sections),
    images,
});

export const parseEPUB = async (filePath) => {
    return new Promise((resolve, reject) => {
        const epub = new EPub(filePath);
        const toc = [];
        const sections = [];
        const images = [];

        epub.on("error", reject);

        epub.on("end", async () => {
            try {
                const spineLength = epub.spine.spineArray.length;

                for (let i = 0; i < spineLength; i++) {
                    const chapter = epub.spine.spineArray[i];
                    const chapterTitle = chapter.title || `Chapter ${i + 1}`;
                    const sectionId = `chapter-${i}`;

                    toc.push({ title: chapterTitle, sectionId });

                    try {
                        const content = await new Promise((resolve, reject) => {
                            epub.getChapter(chapter.id, (err, text) => {
                                if (err) reject(err);
                                else resolve(text);
                            });
                        });

                        sections.push([sectionId, content || ""]);
                    } catch (error) {
                        console.error(`Error reading chapter ${i}:`, error);
                        sections.push([sectionId, ""]);
                    }
                }

                resolve(createParsedContent(toc, sections, images));
            } catch (error) {
                reject(error);
            }
        });

        epub.parse();
    });
};

export const parseDOCX = async (filePath) => {
    try {
        const result = await mammoth.convertToHtml({ path: filePath });
        const html = result.value;

        // Simple structure: treat entire document as one section
        const toc = [{ title: "Document", sectionId: "main" }];
        const sections = [["main", html]];

        return createParsedContent(toc, sections);
    } catch (error) {
        throw new Error("Failed to parse DOCX file: " + error.message);
    }
};

export const parsePDF = async (filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        const toc = [];
        const sections = [];
        let pageTexts = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map((item) => item.str).join(" ");
            pageTexts.push(text);

            if (i % 10 === 0 || i === pdf.numPages) {
                const sectionId = `pages-${i - pageTexts.length + 1}-${i}`;
                toc.push({ title: `Pages ${i - pageTexts.length + 1}-${i}`, sectionId });
                sections.push([sectionId, pageTexts.join("\n\n")]);
                pageTexts = [];
            }
        }

        return createParsedContent(toc, sections);
    } catch (error) {
        throw new Error("Failed to parse PDF file: " + error.message);
    }
};

export const parseText = async (filePath) => {
    try {
        const content = fs.readFileSync(filePath, "utf-8");

        // Split by doble newlines or by size if too large
        const sections = [];
        const chunkSize = 5000; 

        if (content.length > chunkSize) {
            const chunks = content.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];
            chunks.forEach((chunk, index) => {
                sections.push([`section-${index}`, chunk]);
            });
        } else {
            sections.push(["main", content]);
        }

        const toc = sections.map((sec, idx) => ({
            title: `Section ${idx + 1}`,
            sectionId: sec[0],
        }));

        return createParsedContent(toc, sections);  
    } catch (error) {
        throw new Error("Failed to parse text file: " + error.message);
    }
};