import { input, number, select } from "@inquirer/prompts";

export default async () => {  
  const dir = await input({
    type: "input",
    name: "dir",
    message: "What is the source directory?",
  });
  const outDir = await input({
    type: "input",
    name: "out-dir",
    message: "What is the output directory?",
    default: "output",
  });
  const nameDelineator = await input({
    type: "input",
    name: "name-deli",
    message: "What is the filename delineator?",
    default: " - ",
  });

  const labelInFilename = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "label-in-filename",
    message: "Is the cover page label in the filename?",
    default: false,
  });
  let labelIndex, label;
  if (labelInFilename) {
    labelIndex = await number({
      type: "number",
      name: "label-index",
      message: "What index of the filename is the cover page label?",
      required: labelInFilename,
    });
  } else {
    label = await input({
      type: "input",
      name: "label",
      message: "What is the cover page label?",
      default: "SEPARATOR PAGE",
    });
  }

  let headerIndex;
  const headerInFilename = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "header-in-filename",
    message: "Is the cover page header in the filename?",
    default: false,
  });
  if (headerInFilename) {
    headerIndex = await number({
      type: "number",
      name: "header-index",
      message: "What index of the filename is the header?",
      required: headerInFilename,
    });
  }

  const dateInFilename = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "date-in-filename",
    message: "Is the date in the filename?",
    default: false,
  });
  let dateIndex, dateFormat;
  if (dateInFilename) {
    dateIndex = await number({
      type: "number",
      name: "date-index",
      message: "What index of the filename is the date?",
      default: 0,
    });
    dateFormat = await select({
      choices: [{
        name: "20240130",
        value: "YYYYMMDD",
      }, {
        name: "2024-01-30",
        value: "YYYY-MM-DD",
      }, {
        name: "2024/01/30",
        value: "YYYY/MM/DD",
      }, {
        name: "01302024",
        value: "MMDDYYYY",
      }, {
        name: "01-30-2024",
        value: "MM-DD-YYYY",
      }, {
        name: "01/30/2024",
        value: "MM/DD/YYYY",
      }, {
        name: "30012024",
        value: "DDMMYYYY",
      }, {
        name: "30-01-2024",
        value: "DD-MM-YYYY",
      }, {
        name: "30/01/2024",
        value: "DD/MM/YYYY",
      }],
      name: "date-format",
      message: "What format is the date in?",
      default: "YYYYMMDD",
    });
  }

  const dateInHeader = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "date-in-header",
    message: "Should the date be in the cover page header?",
    default: true,
  });

  const titleInFilename = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "title-in-filename",
    message: "Is the cover page title in the filename?",
    default: false,
  });
  let titleIndex;
  if (titleInFilename) {
    titleIndex = await number({
      type: "number",
      name: "title-index",
      message: "What index of the filename is the title?",
      required: titleInFilename,
    });
  }

  const numberPages = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "number-pages",
    message: "Apply page numbers?",
    default: false,
  });
  const mergeAll = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "merge-all",
    message: "Merge all generated files?",
    default: false,
  });
  let mergedName = null;
  if (mergeAll) {
    mergedName = await input({
      type: "input",
      name: "merged-name",
      message: "Merged file name?",
      default: "merged.pdf",
    });
  }
  const groupDesc = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "group-desc",
    message: "Use a Group Description?",
    default: false,
  });
  const labelIsGroupDescLabel = await select({
    choices: [{
      name: "Yes",
      value: true,
    }, {
      name: "No",
      value: false,
    }],
    name: "label-is-group-desc-label",
    message: "Is the cover page label the group description label?",
    default: false,
  });
  let groupDescLabel = null;
  if (groupDesc && !labelIsGroupDescLabel) {
    groupDescLabel = await input({
      type: "input",
      name: "group-desc",
      message: "What is the group description label?",
      default: null,
    });
  }
  return {
    dir,
    outDir,
    nameDelineator,
    labelIndex,
    label,
    numberPages,
    mergeAll,
    mergedName,
    groupDesc,
    labelIsGroupDescLabel,
    groupDescLabel,
    dateIndex,
    dateFormat,
    headerIndex,
    dateInHeader,
    titleIndex,
  };
}
