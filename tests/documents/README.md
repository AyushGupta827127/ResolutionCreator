# Document output tests (PDF / print / Word)

Needs `npm run dev` running and Python with `pymupdf` and `pillow` (`pip install pymupdf pillow`).

```
node tests/documents/make-payloads.mjs     # builds normal / stress (very long) / hindi inputs for every resolution
python tests/documents/bulk.py             # server PDF for each: A4, real text layer, margins, page numbers,
                                           # no stranded headings, signature blocks never split, no missing words
python tests/documents/layout_check.py <file.pdf> <server|print|docx> <label>   # check any single PDF
```

`layout_check.py` also works on a PDF saved from the browser's print dialog (`print`) and on a Word file
printed to PDF (`docx`). The Word-to-PDF conversion itself is Windows/Word specific and is not included.
