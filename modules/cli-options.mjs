import { input, select } from "@inquirer/prompts";

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
    message: "What is the name delineator?",
    default: " - ",
  });
  const label = await input({
    type: "input",
    name: "label",
    message: "What is the separator page label?",
    default: "SEPARATOR PAGE",
  });
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
  let groupDescLabel = null;
  if (groupDesc) {
    groupDescLabel = await input({
      type: "input",
      name: "group-desc",
      message: "Group description label?",
      default: null,
    });
  }
  return {
    dir,
    outDir,
    nameDelineator,
    label,
    numberPages,
    mergeAll,
    mergedName,
    groupDesc,
    groupDescLabel
  };
}
