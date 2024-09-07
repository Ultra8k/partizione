import minimist from "minimist";
import cliOptions from "./cli-options.mjs";

export default async () => {
  let dir,
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
  titleIndex;
  
  // parse command line arguments
  const args = minimist(process.argv.slice(2));
  
  if (args.cli) {
    const cli_options = await cliOptions();
    dir = cli_options.dir;
    outDir = cli_options.outDir;
    nameDelineator = cli_options.nameDelineator;
    labelIndex = cli_options.labelIndex;
    label = cli_options.label;
    numberPages = cli_options.numberPages;
    mergeAll = cli_options.mergeAll;
    mergedName = cli_options.mergedName;
    groupDesc = cli_options.groupDesc;
    groupDescLabel = cli_options.groupDescLabel;
    labelIsGroupDescLabel = cli_options.labelIsGroupDescLabel;
    dateIndex = cli_options.dateIndex;
    dateFormat = cli_options.dateFormat;
    headerIndex = cli_options.headerIndex;
    dateInHeader = cli_options.dateInHeader;
    titleIndex = cli_options.titleIndex;
  } else {
    dir = args.dir ?? "";
    outDir = args["out-dir"] ?? "output";
    nameDelineator = args["name-deli"] ?? " - ";
    label = !labelIndex && args.label || "SEPARATOR PAGE";
    labelIndex = args["label-index"] ?? null;
    numberPages = args["number-pages"] === "true" ? true : false;
    mergeAll = args["merge-all"] === "true" ? true : false;
    mergedName = args["merged-name"] ?? "merged.pdf";
    groupDescLabel = args["group-label"] ?? null;
    labelIsGroupDescLabel = args["label-is-group-label"] === "true" ? true : false;
    groupDesc = labelIsGroupDescLabel || (groupDescLabel ?? false);
    dateIndex = args["date-index"] ?? 0;
    dateFormat = args["date-format"] ?? "YYYYMMDD";
    headerIndex = args["header-index"] ?? 1;
    dateInHeader = args["date-in-header"] === "true" ? true : false;
    titleIndex = args["title-index"] ?? 2;
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
    groupDescLabel,
    labelIsGroupDescLabel,
    dateIndex,
    dateFormat,
    headerIndex,
    dateInHeader,
    titleIndex
  }
}
