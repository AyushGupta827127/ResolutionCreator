<template>
  <!--
    Rendered from the same document model as the PDF and Word exports, so what is shown here,
    printed from the browser, and downloaded are the same document. On screen each section is a
    paper "card"; when printing, the card chrome disappears and the content flows across A4 pages
    (see the print rules in assets/css/tailwind.css).
  -->
  <div class="doc-root" ref="root">
    <section
      v-for="(s, si) in model.sections"
      :key="s.id"
      class="doc-section paper animate-fade-up"
      :data-break="s.breakBefore ? 'true' : 'false'"
    >
      <div class="doc-label">
        <span>{{ si + 1 }}. {{ labels[s.id] }}</span>
        <span v-if="s.id === 'resolution'" class="doc-draft" aria-hidden="true">Draft</span>
      </div>

      <template v-for="(b, bi) in s.blocks" :key="bi">
        <div v-if="b.type === 'letterhead'" class="doc-letterhead">
          <p class="doc-letterhead-name">{{ b.lines[0] }}</p>
          <p v-for="(l, li) in b.lines.slice(1)" :key="li">{{ l }}</p>
        </div>

        <h2 v-else-if="b.type === 'docTitle'" class="doc-title" :class="b.size >= 14 ? 'doc-title-underline' : ''">{{ b.text }}</h2>

        <h3 v-else-if="b.type === 'heading'" class="doc-heading">{{ b.text }}</h3>

        <div v-else-if="b.type === 'signature'" class="doc-signature">
          <template v-for="(l, li) in b.lines" :key="li">
            <span v-if="l.gap" class="doc-sig-gap" />
            <span v-else-if="l.rule" class="doc-sig-rule" />
            <p v-else>{{ l.text }}</p>
          </template>
        </div>

        <p
          v-else
          class="doc-para"
          :class="[b.italic ? 'doc-italic' : '', b.bold ? 'doc-bold' : '', b.align === 'left' ? 'doc-left' : '', nextIsSignature(s, bi) ? 'doc-before-sig' : '']"
        ><template v-if="b.lead"><strong>{{ lead(b.text).lead }}</strong>{{ lead(b.text).rest }}</template><template v-else>{{ b.text }}</template></p>
      </template>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { buildDocumentModel } from "~~/server/utils/documentModel";

const props = defineProps({
  document: { type: Object, required: true },
  notice: { type: String, default: null },
  ctc: { type: String, default: null },
  letterhead: { type: String, default: null },
  refinedBody: { type: String, default: "" },
});

const model = computed(() =>
  buildDocumentModel({ document: props.document, notice: props.notice, ctc: props.ctc, letterhead: props.letterhead }, { refinedBody: props.refinedBody })
);

const labels = { notice: "Notice of Meeting", resolution: "Resolution", ctc: "Certified True Copy" };
const LEAD = /^(“|")?RESOLVED(?:\s+FURTHER)?(?:\s+THAT)?/;
const lead = (text) => {
  const m = LEAD.exec(text);
  return m ? { lead: m[0], rest: text.slice(m[0].length) } : { lead: "", rest: text };
};
const nextIsSignature = (section, i) => section.blocks[i + 1]?.type === "signature";
</script>

<style>
/* ---- shared typography: screen preview and print use the same rules ---- */
.doc-root {
  font-family: "Times New Roman", Times, "Liberation Serif", Tinos, serif;
  color: #111827;
}
/* the app-wide heading style (navy, display font) must not leak into the document */
.doc-root h2,
.doc-root h3 {
  color: inherit;
  font-family: inherit;
}
.doc-root .doc-section + .doc-section {
  margin-top: 1.5rem;
}
.doc-root .doc-para {
  margin: 0 0 0.7em;
  text-align: justify;
  white-space: pre-line;
  font-size: 1.0625rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  hyphens: manual;
}
.doc-root .doc-left {
  text-align: left;
}
.doc-root .doc-italic {
  font-style: italic;
}
.doc-root .doc-bold {
  font-weight: 700;
}
.doc-root .doc-title {
  margin: 0.4em 0 0.8em;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.3;
}
.doc-root .doc-title-underline {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.doc-root .doc-heading {
  margin: 1.2em 0 0.45em;
  font-size: 1.0625rem;
  font-weight: 700;
}
.doc-root .doc-letterhead {
  margin-bottom: 1.4em;
  padding-bottom: 0.7em;
  border-bottom: 1px solid #111827;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.5;
}
.doc-root .doc-letterhead-name {
  margin: 0 0 0.2em;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.doc-root .doc-signature {
  margin: 1.4em 0 0 55%;
  font-size: 1.0625rem;
  line-height: 1.55;
}
.doc-root .doc-signature p {
  margin: 0;
}
.doc-root .doc-sig-gap {
  display: block;
  height: 0.5em;
}
.doc-root .doc-sig-rule {
  display: block;
  height: 2.2em;
  border-bottom: 1px solid #111827;
  margin-bottom: 0.4em;
}

/* ---- screen only: the paper card + label ---- */
@media screen {
  .doc-root .doc-section {
    padding: 2.5rem 3rem;
  }
  .doc-root .doc-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9ca3af;
  }
  .doc-root .doc-draft {
    color: #d1d5db;
  }
}
@media screen and (max-width: 640px) {
  .doc-root .doc-section {
    padding: 1.5rem 1.25rem;
  }
  .doc-root .doc-signature {
    margin-left: 25%;
  }
}
</style>
