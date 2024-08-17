import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  PDFDocument,
  StandardFonts,
  PageSizes,
  rgb,
  degrees,
  grayscale,
} from "pdf-lib";
import chalk from "chalk";
import parseOptions from "./parse-options.mjs";

const log = console.log;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  dir,
  outDir,
  nameDelineator,
  label,
  numberPages,
  mergeAll,
  mergedName,
  groupDesc,
  groupDescLabel
} = await parseOptions();

// page sizes
const letter = PageSizes.Letter;
const letterWidth = letter[0];
const letterHeight = letter[1];

const fontSize = 14;
const headerFontSize = 16;
const labelFontSize = 50;

if (!dir) {
  log(
    chalk.redBright(
      "The source directory is required. Usage: node ./index.mjs [--cli | --dir=<source directory>]"
    )
  );
  process.exit(1);
}

try {
  fs.accessSync(dir);
} catch (error) {
  log(chalk.redBright(`Can not access ${dir}. The directory doesn't exist or you do not have permission to read and write to it.\nExiting...`));
  process.exit(1);
}

try {
  fs.accessSync(outDir);
} catch (error) {
  log(chalk.cyanBright(`Creating output directory ${outDir}\n`));
  fs.mkdirSync(outDir);
}

// delete existing merged pdf if any
try {
  fs.accessSync(path.join(outDir, mergedName));
  log(chalk.yellow("Deleting existing merged PDF..."));
  fs.unlinkSync(path.join(outDir, mergedName));
} catch (error) {}

let totalPages = 0;

const generatePdfWithSeparator = async () => {
  log(chalk.cyan(`Reading source directory ${dir}`));
  const files = fs.readdirSync(dir);
  // remove non pdfs and sort filename index 0
  const filteredFiles = files.filter(file => fs.statSync(path.join(dir, file)).isFile() && path.extname(file) === '.pdf').sort((a, b) => {
    const sorterA = +a.split(nameDelineator)[0];
    const sorterB = +b.split(nameDelineator)[0];
    return sorterA - sorterB;
  });
  log(chalk.cyan(`Found ${filteredFiles.length} PDF files`));
  for (const file of filteredFiles) {
    log(chalk.cyan("Processing", chalk.white(`${file}`)));
    // get file path
    const filePath = path.join(dir, file);
    // check if file is a pdf
    if (!fs.statSync(filePath).isFile() || path.extname(filePath) !== ".pdf") {
      log(chalk.red(`Skipping ${file}, this is not a PDF file`));
      continue;
    }

    // skip invalid formatted filenames
    if (file.split(nameDelineator)[0].length !== 8 || isNaN(+file.split(nameDelineator)[0])) {
      log(chalk.red(`Skipping ${file}, invalid filename`));
      continue;
    }

    // parse pdf file names to get pieces
    let namePieces = file.split(nameDelineator);
    // remove '.pdf' from last name piece
    namePieces[namePieces.length - 1] = namePieces[namePieces.length - 1].slice(
      0,
      namePieces[namePieces.length - 1].length - 4
    );

    // create separator page
    const sepPdfDoc = await PDFDocument.create();
    const font = await sepPdfDoc.embedFont(StandardFonts.Helvetica);
    const page = sepPdfDoc.addPage(PageSizes.Letter);
    const { width, height } = page.getSize();
    totalPages += 1;

    // load bookmark image
    const bookmarkUrl = path.join(__dirname, "/images/tab.png");
    const bookmarkImage = await sepPdfDoc.embedPng(
      fs.readFileSync(bookmarkUrl)
    );
    const bookmarkDims = bookmarkImage.scale(0.25);
    // draw bookmark
    page.drawImage(bookmarkImage, {
      x: width - bookmarkDims.height,
      y: height,
      width: bookmarkDims.width,
      height: bookmarkDims.height,
      rotate: degrees(-90),
    });

    // load original pdf
    log(chalk.cyan("Loading original PDF"));
    const orgPdfDoc = await PDFDocument.load(
      fs.readFileSync(path.join(dir, file))
    );
    // get original pdf page indices
    log(chalk.cyan("Getting number of original PDF pages"));
    const orgPdfPages = orgPdfDoc.getPageIndices();
    const orgPdfPagesLength = orgPdfPages.length;
    totalPages += orgPdfPagesLength;

    // construct text blocks
    const header = [namePieces[0], namePieces[1]];
    const title = namePieces[2];
    const pageLength = `${orgPdfPagesLength} page${
      orgPdfPagesLength > 1 ? "s" : ""
    }`;

    log(
      chalk.cyan(
        "Creating page with content:\n\n",
        chalk.blueBright(
          `${header[0]}\n${header[1]}\n${title}\n${pageLength}\n${label}`
        )
      ),
      "\n"
    );

    const textWidth = (text, textFontSize) =>
      font.widthOfTextAtSize(text, textFontSize);
    const textHeight = (textFontSize) => font.heightAtSize(textFontSize);

    // draw text line
    const drawText = (text, textFontSize, offset = 0) =>
      page.drawText(text, {
        x: offset - textHeight(textFontSize) / 2,
        y: height / 2 + textWidth(text, textFontSize) / 2,
        size: textFontSize,
        font,
        color: rgb(0, 0, 0),
        rotate: degrees(-90),
      });

    drawText(header[0], headerFontSize, width - bookmarkDims.height * 1.5);
    drawText(
      header[1],
      headerFontSize,
      width - bookmarkDims.height * 1.5 - textHeight(headerFontSize) * 1.5
    );
    drawText(
      title,
      fontSize,
      width -
        bookmarkDims.height * 1.5 -
        textHeight(headerFontSize) * 1.5 * 2 -
        textHeight(fontSize) * 1.5
    );
    drawText(
      pageLength,
      fontSize,
      width -
        bookmarkDims.height * 1.5 -
        textHeight(headerFontSize) * 1.5 * 2 -
        textHeight(fontSize) * 1.5 * 3
    );
    drawText(label, labelFontSize, width / 2);

    // copy original pdf pages to separator pdf
    log(chalk.cyan(`Copying ${orgPdfPages.length} original pages`));
    const orgPdfCopy = await sepPdfDoc.copyPages(orgPdfDoc, orgPdfPages);
    orgPdfCopy.forEach((orgPage) => {
      // check orgPage size
      const orgHeight = orgPage.getHeight();
      const orgWidth = orgPage.getWidth();
      const heightScale = (letterHeight / orgHeight) * 0.9;
      const widthScale = (letterWidth / orgWidth) * 0.9;

      // resize if not letter
      if (orgHeight !== letterHeight) {
        orgPage.setHeight(letterHeight);
      }
      if (orgWidth !== letterWidth) {
        orgPage.setWidth(letterWidth);
      }

      // scale original content
      orgPage.scaleContent(widthScale, heightScale);

      // move content
      orgPage.resetPosition();
      orgPage.translateContent(30.6, 60);

      // rotate page
      orgPage.setRotation(degrees(0));

      // add orgPage
      sepPdfDoc.addPage(orgPage);
    });

    // save pdf with separator and original pages
    log(chalk.cyan("Saving new PDF to output directory"));
    const separatorPageBytes = await sepPdfDoc.save();
    fs.writeFileSync(
      path.join(outDir, path.basename(file)),
      separatorPageBytes
    );
    log(
      chalk.green(
        "Success",
        chalk.white.bold(`${path.join(outDir, path.basename(file))}`),
        "has been created.\n\n"
      )
    );
  }
};

const applyFooterToGeneratedPdfs = async () => {
  log(chalk.cyan("Applying footer to generated PDFs."));
  const files = fs.readdirSync(outDir);
  const filteredFiles = files.filter(file => fs.statSync(path.join(dir, file)).isFile() && path.extname(file) === '.pdf').sort((a, b) => {
    const sorterA = +a.split(nameDelineator)[0];
    const sorterB = +b.split(nameDelineator)[0];
    return sorterA - sorterB;
  });
  let currentPage = 1;
  for (const file of filteredFiles) {
    const pdfBytes = fs.readFileSync(path.join(outDir, file));
    const pdf = await PDFDocument.load(pdfBytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    pages.forEach((page) => {
      let footer = `${groupDescLabel ?? "_"} - Page ${currentPage} of ${totalPages}`;
      if (!groupDescLabel) footer = footer.split(" - ")[1];
      if (!numberPages) footer = footer.split(" - ")[0];
      page.drawRectangle({
        x: page.getWidth() - 36 - (font.widthOfTextAtSize(footer, 8) * 1.2),
        y: 36,
        width: font.widthOfTextAtSize(footer, 8) * 1.2,
        height: font.heightAtSize(8) * 1.5,
        color: grayscale(1),
      });
      page.drawText(footer, {
        x: page.getWidth() - 36 - font.widthOfTextAtSize(footer, 8),
        y: 36 + font.heightAtSize(8) / 2,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });
      if (numberPages) currentPage += 1;
    });

    const pageBytes = await pdf.save();
    fs.writeFileSync(path.join(outDir, path.basename(file)), pageBytes);
  }
  log(chalk.green("Success, applied footer to all pages.\n\n"));
};

const mergeAllGeneratedPdfs = async () => {
  log(chalk.cyan("Merging all generated PDFs."));
  const files = fs.readdirSync(outDir);
  const filteredFiles = files.filter(file => fs.statSync(path.join(dir, file)).isFile() && path.extname(file) === '.pdf').sort((a, b) => {
    const sorterA = +a.split(nameDelineator)[0];
    const sorterB = +b.split(nameDelineator)[0];
    return sorterA - sorterB;
  });
  const pdfDoc = await PDFDocument.create();
  for (const file of filteredFiles) {
    const pdfReadBytes = fs.readFileSync(path.join(outDir, file));
    const pdfRead = await PDFDocument.load(pdfReadBytes);
    const pdfReadIndices = pdfRead.getPageIndices();
    const pdfCopy = await pdfDoc.copyPages(pdfRead, pdfReadIndices);
    pdfCopy.forEach((page) => {
      pdfDoc.addPage(page);
    });
  }
  const pdfWriteBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(outDir, mergedName), pdfWriteBytes);
  log(
    chalk.green(
      "Success, all PDFs merged and",
      chalk.white.bold(`${path.join(outDir, mergedName)}`),
      "has been created.\n\n"
    )
  );
};

await generatePdfWithSeparator();
if (numberPages || groupDesc) await applyFooterToGeneratedPdfs();
if (mergeAll) await mergeAllGeneratedPdfs();
log(chalk.greenBright.bold("DONE!"));
