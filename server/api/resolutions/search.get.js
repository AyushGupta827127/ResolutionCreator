import { searchResolutions } from "../../utils/knowledge";

export default defineEventHandler((event) => {
  const { q } = getQuery(event);
  const results = searchResolutions(q).map((r) => ({
    slug: r.slug,
    title: r.title,
    category: r.category,
    description: r.description,
    meetingType: r.meetingType,
    resolutionKind: r.resolutionKind,
    keywords: r.keywords,
    questionCount: r.questions.length,
    recordCount: r.records.length,
  }));
  return { results };
});
