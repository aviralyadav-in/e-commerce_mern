/**
 * insertMany({ ordered: false }) model validation fail hone wale docs ko
 * chupchaap drop kar deta hai — na error, na count. Bulk import me insert se
 * pehle saare candidates ko model rules par check karo; fail hone wali rows
 * invalidRows me report hoti hain (CSV order preserve rehta hai).
 *
 * @param {import("mongoose").Model} Model
 * @param {{ row: number, name: string, doc: object }[]} candidates
 * @returns {Promise<{ validDocs: object[], invalidRows: { row: number, name: string, error: string }[] }>}
 */
export const splitByModelValidation = async (Model, candidates) => {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await new Model(candidate.doc).validate();
        return { candidate, error: null };
      } catch (error) {
        const message =
          Object.values(error.errors || {})[0]?.message || error.message;
        return { candidate, error: message };
      }
    }),
  );

  const validDocs = [];
  const invalidRows = [];
  for (const { candidate, error } of results) {
    if (error) {
      invalidRows.push({ row: candidate.row, name: candidate.name, error });
    } else {
      validDocs.push(candidate.doc);
    }
  }
  return { validDocs, invalidRows };
};
