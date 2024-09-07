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
import parseOptions from "./modules/parse-options.mjs";
import { oraPromise } from "ora";
import logSymbols from "log-symbols";

const log = console.log;

const {
  dir,
  outDir,
  nameDelineator,
  labelIndex,
  label,
  numberPages,
  mergeAll,
  mergedName,
  groupDesc,
  groupDescLabel,
  labelIsGroupDescLabel,
  dateIndex,
  dateFormat,
  headerIndex,
  dateInHeader,
  titleIndex
} = await parseOptions();

if (!dir) {
  log(
    chalk.redBright(
      logSymbols.error,
      "The source directory is required. Usage: node ./index.mjs [--cli | --dir=<source directory>]"
    )
  );
  process.exit(1);
}

try {
  fs.accessSync(dir);
} catch (error) {
  log(chalk.redBright(`${logSymbols.error} Can not access ${dir}. The directory doesn't exist or you do not have permission to read and write to it.\nExiting...\n`));
  process.exit(1);
}

try {
  fs.accessSync(outDir);
} catch (error) {
  log(chalk.cyanBright(`${logSymbols.info} Creating output directory ${outDir}\n`));
  fs.mkdirSync(outDir);
}

// delete existing merged pdf if any
try {
  fs.accessSync(path.join(outDir, mergedName));
  log(chalk.yellow(logSymbols.warning, "Deleting existing merged PDF...\n"));
  fs.unlinkSync(path.join(outDir, mergedName));
} catch (error) {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// page sizes
const letter = PageSizes.Letter;
const letterWidth = letter[0];
const letterHeight = letter[1];

const fontSize = 14;
const headerFontSize = 16;
const labelFontSize = 50;
let totalPages = 0;

const generatePdfWithSeparator = async () => {
  log(chalk.cyan(`Reading source directory ${dir}`));
  const files = fs.readdirSync(dir);
  // remove non pdfs and sort filename index 0
  const filteredFiles = files.filter(file => fs.statSync(path.join(dir, file)).isFile() && path.extname(file) === '.pdf').sort((a, b) => {
    const sorterA = dateIndex == 0 ? +a.split(nameDelineator)[0] : a.split(nameDelineator)[0];
    const sorterB = dateIndex == 0 ? +b.split(nameDelineator)[0] : b.split(nameDelineator)[0];
    return sorterA - sorterB;
  });
  log(chalk.cyan(`Found ${filteredFiles.length} PDF files`));
  for (const file of filteredFiles) {
    log(chalk.cyan("Processing", chalk.white(`${file}`)));
    // get file path
    const filePath = path.join(dir, file);
    // check if file is a pdf
    if (!fs.statSync(filePath).isFile() || path.extname(filePath) !== ".pdf") {
      log(chalk.red(`${logSymbols.error} Skipping ${file}, this is not a PDF file`));
      continue;
    }

    // parse pdf file names to get pieces
    let namePieces = file.split(nameDelineator);
    // remove '.pdf' from last name piece
    namePieces[namePieces.length - 1] = namePieces[namePieces.length - 1].slice(
      0,
      namePieces[namePieces.length - 1].length - 4
    );

    // get date from filename
    const separatorPageDate = dateIndex !== null && dateIndex !== undefined ? namePieces[dateIndex].substring(0, dateFormat.length) : "";
    const separatorPageHeader = headerIndex !== null && headerIndex !== undefined ? namePieces[headerIndex] : "";
    const separatorPageTitle = titleIndex !== null && titleIndex !== undefined ? namePieces[titleIndex] : "";
    const separatorPageLabel = labelIndex !== null && labelIndex !== undefined ? namePieces[labelIndex] : label;

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
    const header = dateInHeader ? [separatorPageDate, separatorPageHeader] : [separatorPageHeader];
    const title = separatorPageTitle;
    const pageLength = `${orgPdfPagesLength} page${
      orgPdfPagesLength > 1 ? "s" : ""
    }`;

    log(
      chalk.cyan(
        "Creating page with content:\n\n",
        chalk.blueBright(
          `${header[0]}\n${header[1]}\n${title}\n${pageLength}\n${separatorPageLabel}`
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
    if (dateInHeader) {
      drawText(
        header[1],
        headerFontSize,
        width - bookmarkDims.height * 1.5 - textHeight(headerFontSize) * 1.5
      );
    }
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
    drawText(separatorPageLabel, labelFontSize, width / 2);

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
        logSymbols.success,
        "Success",
        chalk.white.bold(`${path.join(outDir, path.basename(file))}`),
        "has been created.\n"
      )
    );
  }
  
  log(chalk.green(logSymbols.success, "Success, all PDFs generated.\n\n"));
};

const applyFooterToGeneratedPdfs = async () => {
  log(chalk.cyan("Applying footer to generated PDFs."));
  const files = fs.readdirSync(outDir);
  const filteredFiles = files.filter(file => fs.statSync(path.join(dir, file)).isFile() && path.extname(file) === '.pdf').sort((a, b) => {
    const sorterA = dateIndex === 0 ? +a.split(nameDelineator)[0] : a.split(nameDelineator)[0];
    const sorterB = dateIndex === 0 ? +b.split(nameDelineator)[0] : b.split(nameDelineator)[0];
    return sorterA - sorterB;
  });
  let currentPage = 1;
  for (const file of filteredFiles) {
    const pdfBytes = fs.readFileSync(path.join(outDir, file));
    const pdf = await PDFDocument.load(pdfBytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();

    let separatorPageLabel = null;
    if (labelIsGroupDescLabel) {
      // parse pdf file names to get pieces
      let namePieces = file.split(nameDelineator);
      // remove '.pdf' from last name piece
      namePieces[namePieces.length - 1] = namePieces[namePieces.length - 1].slice(
        0,
        namePieces[namePieces.length - 1].length - 4
      );
  
      separatorPageLabel = labelIndex !== null && labelIndex !== undefined ? namePieces[labelIndex] : label;
    }
    const groupLabel = labelIsGroupDescLabel && separatorPageLabel ? separatorPageLabel : groupDescLabel;

    pages.forEach((page) => {
      let footer = `${groupLabel ?? "_"} - Page ${currentPage} of ${totalPages}`;
      if (!groupLabel) footer = footer.split(" - ")[1];
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
  
  log(chalk.green(logSymbols.success, "Success, applied footer to all pages.\n\n"));
};

const mergeAllGeneratedPdfs = async () => {
  log(chalk.cyan("Merging all generated PDFs."));
  const files = fs.readdirSync(outDir);
  const filteredFiles = files.filter(file => fs.statSync(path.join(dir, file)).isFile() && path.extname(file) === '.pdf').sort((a, b) => {
    const sorterA = dateIndex == 0 ? +a.split(nameDelineator)[0] : a.split(nameDelineator)[0];
    const sorterB = dateIndex == 0 ? +b.split(nameDelineator)[0] : b.split(nameDelineator)[0];
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
  
  log(chalk.green(
    logSymbols.success,
    "Success, all PDFs merged and",
    chalk.white.bold(`${path.join(outDir, mergedName)}`),
    "has been created.\n\n"
  ));
};

const run = async () => {
  await generatePdfWithSeparator();
  if (numberPages || groupDesc) {
    await applyFooterToGeneratedPdfs();
  }
  if (mergeAll) {
    await mergeAllGeneratedPdfs();
  }
}

oraPromise(run, {
  successText: chalk.green("DONE!")
});