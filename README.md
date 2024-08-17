# pdf-partizione

Create a cover page for a pdf based on it's file name. Used for creating partitions before merging a bunch of pdfs.

Given a PDF with a file name like `123456 - Title - Description of document.pdf`. This script will generate a cover page with the info parsed from the file name.

# Running the script

There are 2 methods to run the script, either with flags or a Q and A cli.

To run the script with flags follow the syntax below.
```
node ./index.mjs --dir [--out-dir] [--name-deli] [--label] [--number-pages] [--merge-all] [--merged-name] [--group-desc] [--group-label]
```
## Description of flags

| FLAG        | USE              | REQUIRED | DEFAULT        |
| ----------- | ---------------- | -------- | -------------- |
| --dir       | source directory | required |                |
| --out-dir   | out directory    | optional | output         |
| --name-deli | name delineator  | optional | ' - '          |
| --label     | cover page label | optional | SEPARATOR PAGE |
| --number-pages     | apply page numbers | optional | false |
| --merge-all     | merge all page | optional | false |
| --merged-name     | merged file name | optional | merged.pdf |
| --group-desc     | apply a group description | optional | false |
| --group-label     | the group description label | optional | null |

To run the script with the Q and A cli use the syntax below.
```
node ./index.mjs --cli
```
The will activate a series of prompts relative to the flag above. After completing the prompts the generation will begin.