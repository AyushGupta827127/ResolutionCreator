import PDFDocument from "pdfkit";

/**
 * Typesets the shared document model (shared/utils/documentModel.js) as a real,
 * text-based A4 PDF — selectable and searchable, with proper page breaks:
 *   - own line breaking + full justification (last lines of a paragraph stay ragged)
 *   - orphan/widow control (never 1 line stranded at the top or bottom of a page)
 *   - headings stay with the paragraph that follows
 *   - the signature block is never split, and never left alone on a page
 *   - "Page x of y" footer on every page
 */

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = { top: 72, bottom: 72, left: 72, right: 72 };
const CONTENT_W = A4.w - MARGIN.left - MARGIN.right;
const BODY = { size: 12, leading: 17.5, after: 9 };
const FOOTER_Y = A4.h - 50;

const DEVANAGARI = /[ऀ-ॿ]/;
const LEAD = /^(“|")?(RESOLVED(?:\s+FURTHER)?(?:\s+THAT)?)/;

async function loadFonts() {
  const storage = useStorage("assets:fonts");
  const get = async (name) => {
    const raw = await storage.getItemRaw(name);
    if (!raw) throw new Error(`PDF font missing: ${name} (available: ${(await storage.getKeys()).join(", ") || "none"})`);
    return Buffer.from(raw);
  };
  const [reg, bold, italic, boldItalic, devReg, devBold] = await Promise.all([
    get("Tinos-Regular.ttf"),
    get("Tinos-Bold.ttf"),
    get("Tinos-Italic.ttf"),
    get("Tinos-BoldItalic.ttf"),
    get("NotoSerifDevanagari-Regular.ttf"),
    get("NotoSerifDevanagari-Bold.ttf"),
  ]);
  return { reg, bold, italic, boldItalic, devReg, devBold };
}

export async function renderPdf(model, { title = "Resolution", footerNote = "Draft for professional review" } = {}) {
  const fonts = await loadFonts();
  const doc = new PDFDocument({
    size: "A4",
    margins: { ...MARGIN },
    bufferPages: true,
    autoFirstPage: true,
    displayTitle: true,
    info: { Title: title, Author: "Resolution Creator", Subject: "Corporate resolution (draft)", Producer: "Resolution Creator" },
  });
  doc.registerFont("reg", fonts.reg);
  doc.registerFont("bold", fonts.bold);
  doc.registerFont("italic", fonts.italic);
  doc.registerFont("boldItalic", fonts.boldItalic);
  doc.registerFont("devReg", fonts.devReg);
  doc.registerFont("devBold", fonts.devBold);

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const BOTTOM = A4.h - MARGIN.bottom;
  let y = MARGIN.top;
  let pageIsFresh = true; // nothing drawn on the current page yet

  const newPage = () => {
    doc.addPage();
    y = MARGIN.top;
    pageIsFresh = true;
  };
  const room = () => BOTTOM - y;
  const ensure = (h) => {
    if (h > room() && !pageIsFresh) newPage();
  };

  // ---- text helpers ------------------------------------------------------
  const fontKey = (devanagari, bold, italic) =>
    devanagari ? (bold ? "devBold" : "devReg") : bold && italic ? "boldItalic" : bold ? "bold" : italic ? "italic" : "reg";

  // Characters the font can't draw would show as empty boxes; swap them for something safe.
  const sanitizeFor = (text, key) => {
    doc.font(key);
    const f = doc._font?.font;
    return [...String(text)]
      .map((ch) => {
        if (ch === "₹") return "Rs.";
        if (/\s/.test(ch) || ch === "‌" || ch === "‍") return ch;
        const cp = ch.codePointAt(0);
        return f && f.hasGlyphForCodePoint && !f.hasGlyphForCodePoint(cp) ? "?" : ch;
      })
      .join("");
  };

  const width = (str, key, size) => {
    doc.font(key).fontSize(size);
    return doc.widthOfString(str);
  };

  /** Split a paragraph into word tokens carrying their font, honouring hard line breaks. */
  const tokenize = (text, base) => {
    const logical = String(text).split("\n");
    return logical.map((lineText, li) => {
      const tokens = [];
      let rest = lineText;
      let leadLen = 0;
      if (base.lead && li === 0) {
        const m = LEAD.exec(rest);
        if (m) leadLen = m[0].length;
      }
      const words = rest.split(/\s+/).filter(Boolean);
      let consumed = 0;
      for (const w of words) {
        const start = rest.indexOf(w, consumed);
        consumed = start + w.length;
        const isLead = leadLen > 0 && start < leadLen;
        // font is chosen per word: only Devanagari words use the Devanagari face, the rest stay in Tinos
        const key = fontKey(DEVANAGARI.test(w), base.bold || isLead, base.italic);
        const clean = sanitizeFor(w, key);
        tokens.push({ text: clean, key, w: width(clean, key, base.size) });
      }
      return tokens;
    });
  };

  /** Greedy line fill. Returns [{tokens, last}] — `last` = final line of a hard-break group (never justified). */
  const wrap = (groups, base, maxW) => {
    const lines = [];
    const space = (key) => width(" ", key, base.size);
    for (const tokens of groups) {
      let line = [];
      let lw = 0;
      const flush = (last) => {
        lines.push({ tokens: line, last });
        line = [];
        lw = 0;
      };
      if (!tokens.length) {
        lines.push({ tokens: [], last: true });
        continue;
      }
      for (let t of tokens) {
        // a single word wider than the line (long URL / e-mail): break it by characters
        while (t.w > maxW) {
          let cut = 1;
          while (cut < t.text.length && width(t.text.slice(0, cut + 1), t.key, base.size) <= maxW) cut++;
          const head = { ...t, text: t.text.slice(0, cut), w: width(t.text.slice(0, cut), t.key, base.size) };
          if (line.length) flush(false);
          line.push(head);
          flush(false);
          const tail = t.text.slice(cut);
          t = { ...t, text: tail, w: width(tail, t.key, base.size) };
        }
        const gap = line.length ? space(t.key) : 0;
        if (line.length && lw + gap + t.w > maxW) flush(false);
        const g = line.length ? space(t.key) : 0;
        line.push(t);
        lw += g + t.w;
      }
      if (line.length) flush(true);
    }
    return lines;
  };

  /** Draw one laid-out line at (x, y). Justified lines distribute the slack between words. */
  const drawLine = (ln, x, yy, base, maxW, align) => {
    const toks = ln.tokens;
    if (!toks.length) return;
    const sp = (k) => width(" ", k, base.size);
    const natural = toks.reduce((s, t, i) => s + t.w + (i ? sp(t.key) : 0), 0);
    let startX = x;
    let extra = 0;
    if (align === "center") startX = x + (maxW - natural) / 2;
    else if (align === "right") startX = x + maxW - natural;
    else if (align === "justify" && !ln.last && toks.length > 1) extra = Math.max(0, (maxW - natural) / (toks.length - 1));
    doc.fillColor("#000000");
    if (extra === 0) {
      // runs of one font go out as a single string so the text layer keeps real spaces
      let cx = startX;
      let i = 0;
      while (i < toks.length) {
        let j = i;
        const key = toks[i].key;
        while (j + 1 < toks.length && toks[j + 1].key === key) j++;
        const str = toks.slice(i, j + 1).map((t) => t.text).join(" ");
        doc.font(key).fontSize(base.size).text(str, cx, yy, { lineBreak: false });
        cx += width(str, key, base.size) + (j + 1 < toks.length ? sp(key) : 0);
        i = j + 1;
      }
    } else {
      let cx = startX;
      toks.forEach((t, i) => {
        doc.font(t.key).fontSize(base.size).text(t.text, cx, yy, { lineBreak: false });
        cx += t.w + sp(t.key) + extra;
      });
    }
    if (base.underline) {
      doc.lineWidth(0.8).strokeColor("#000000").moveTo(startX, yy + base.size + 1.5).lineTo(startX + natural, yy + base.size + 1.5).stroke();
    }
  };

  /**
   * Lay a paragraph out across pages with orphan/widow control.
   * `tail` = height that must stay on the same page as the paragraph's last lines (e.g. a signature block).
   */
  const paragraph = (text, opts = {}) => {
    const base = { size: opts.size || BODY.size, leading: opts.leading || BODY.leading, bold: opts.bold, italic: opts.italic, lead: opts.lead, underline: opts.underline };
    const align = opts.align || "justify";
    const indent = opts.indent || 0;
    const maxW = CONTENT_W - indent;
    const lines = wrap(tokenize(text, base), base, maxW);
    const after = opts.after ?? BODY.after;
    const tail = opts.tail || 0;

    let i = 0;
    while (i < lines.length) {
      const left = lines.length - i;
      const fit = Math.floor(room() / base.leading);
      let take = left;
      if (left <= fit && left * base.leading + tail > room() && left > 2) {
        // last lines would be separated from what must follow (the signature): pull two lines over with it
        take = Math.max(left - 2, 0);
        if (take < 2) take = 0;
      } else if (left > fit) {
        take = fit;
        if (left - take === 1) take -= 1; // widow: don't strand a single line on the next page
        if (take < 2) take = 0; // orphan: don't leave a single line at the bottom
      }
      if (take === 0) {
        if (pageIsFresh) take = Math.min(left, Math.max(1, fit)); // nothing better to do on an empty page
        else {
          newPage();
          continue;
        }
      }
      for (let k = 0; k < take; k++) {
        drawLine(lines[i + k], MARGIN.left + indent, y, base, maxW, align);
        y += base.leading;
        pageIsFresh = false;
      }
      i += take;
      if (i < lines.length) newPage();
    }
    y += after;
  };

  const heightOf = (text, opts = {}) => {
    const base = { size: opts.size || BODY.size, leading: opts.leading || BODY.leading, bold: opts.bold, italic: opts.italic, lead: opts.lead };
    return wrap(tokenize(text, base), base, CONTENT_W - (opts.indent || 0)).length * base.leading;
  };

  // ---- blocks ------------------------------------------------------------
  const rule = (x1, x2, yy, w = 0.75, color = "#000000") => doc.lineWidth(w).strokeColor(color).moveTo(x1, yy).lineTo(x2, yy).stroke();

  const letterhead = (b) => {
    const [name, ...rest] = b.lines;
    const need = 22 + rest.length * 14 + 22;
    ensure(need);
    paragraph(name.toUpperCase(), { size: 15, leading: 20, bold: true, align: "center", after: 3 });
    for (const l of rest) paragraph(l, { size: 10, leading: 13.5, align: "center", after: 0 });
    y += 6;
    rule(MARGIN.left, A4.w - MARGIN.right, y);
    y += 16;
  };

  const docTitle = (b, nextNeed) => {
    const size = b.size || 13;
    const leading = size + 7;
    ensure(heightOf(b.text, { size, leading, bold: true }) + 14 + nextNeed);
    paragraph(b.text, { size, leading, bold: true, align: "center", after: 12, underline: size >= 14 });
  };

  const heading = (b, nextNeed) => {
    ensure(heightOf(b.text, { bold: true }) + 8 + nextNeed);
    y += 4;
    paragraph(b.text, { bold: true, align: "left", after: 6 });
  };

  const signatureHeight = (b) => b.lines.reduce((h, l) => h + (l.gap ? 10 : l.rule ? 30 : BODY.leading), 0) + 6;

  const signature = (b) => {
    const h = signatureHeight(b);
    ensure(h);
    const blockW = 210;
    const x = A4.w - MARGIN.right - blockW;
    y += 6;
    for (const l of b.lines) {
      if (l.gap) y += 10;
      else if (l.rule) {
        y += 22; // room to sign above the line
        rule(x, x + blockW, y);
        y += 8;
      } else {
        paragraph(l.text, { align: "left", indent: CONTENT_W - blockW, after: 0 });
      }
      pageIsFresh = false;
    }
    y += BODY.after;
  };

  // ---- walk the model ------------------------------------------------------
  const minNext = 2 * BODY.leading; // a heading/title always keeps at least two lines of what follows
  model.sections.forEach((section, si) => {
    if (si > 0 && section.breakBefore && !pageIsFresh) newPage();
    const blocks = section.blocks;
    blocks.forEach((b, bi) => {
      const next = blocks[bi + 1];
      switch (b.type) {
        case "letterhead":
          letterhead(b);
          break;
        case "docTitle":
          docTitle(b, minNext);
          break;
        case "heading":
          heading(b, minNext);
          break;
        case "signature":
          signature(b);
          break;
        default: {
          const o = { lead: b.lead, bold: b.bold, italic: b.italic, align: b.align || "justify" };
          if (next && next.type === "signature") o.tail = signatureHeight(next);
          paragraph(b.text, o);
        }
      }
    });
  });

  // ---- footers (needs the page count) ---------------------------------------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const saved = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // writing inside the bottom margin must not spawn a new page
    rule(MARGIN.left, A4.w - MARGIN.right, FOOTER_Y - 8, 0.5, "#9CA3AF");
    doc.font("reg").fontSize(8).fillColor("#6B7280");
    doc.text(footerNote, MARGIN.left, FOOTER_Y, { lineBreak: false });
    const label = `Page ${i + 1} of ${range.count}`;
    doc.text(label, A4.w - MARGIN.right - doc.widthOfString(label), FOOTER_Y, { lineBreak: false });
    doc.page.margins.bottom = saved;
  }

  doc.end();
  return done;
}
