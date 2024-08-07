# pdf-partizione

Create a cover page for a pdf based on it's file name. Used for creating partitions before merging a bunch of pdfs.

Given a PDF with a file name like `123456 - Title - Description of document.pdf`. This script will generate a cover page with the info parsed from the file name.

# running the script

```
node ./index.mjs --dir [--out-dir] [--name-deli] [--label]
```

| FLAG        | USE              | REQUIRED | DEFAULT        |
| ----------- | ---------------- | -------- | -------------- |
| --dir       | source directory | required |                |
| --out-dir   | out directory    | optional | output         |
| --name-deli | name delineator  | optional | ' - '          |
| --label     | cover page label | optional | SEPARATOR PAGE |
