import minimist from "minimist";
import cliOptions from "./cli-options.mjs";

export default async () => {
  let dir,
  outDir,
  nameDelineator,
  label,
  numberPages,
  mergeAll,
  mergedName,
  groupDesc,
  groupDescLabel;
  
  // parse command line arguments
  const args = minimist(process.argv.slice(2));
  
  if (args.cli) {
    const cli_options = await cliOptions();
    dir = cli_options.dir;
    outDir = cli_options.outDir;
    nameDelineator = cli_options.nameDelineator;
    label = cli_options.label;
    numberPages = cli_options.numberPages;
    mergeAll = cli_options.mergeAll;
    mergedName = cli_options.mergedName;
    groupDesc = cli_options.groupDesc;
    groupDescLabel = cli_options.groupDescLabel;
  } else {
    dir = args.dir ?? "";
    outDir = args["out-dir"] ?? "output";
    nameDelineator = args["name-deli"] ?? " - ";
    label = args.label ?? "SEPARATOR PAGE";
    numberPages = args["number-pages"] === "true" ? true : false;
    mergeAll = args["merge-all"] === "true" ? true : false;
    mergedName = args["merged-name"] ?? "merged.pdf";
    groupDescLabel = args["group-label"] ?? null;
    groupDesc = groupDescLabel ?? false;
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
  }
}
