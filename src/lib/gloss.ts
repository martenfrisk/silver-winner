// Quoting English meanings inside generated question text.
//
// Most glosses are bare ("Water", "Tomorrow") and quote cleanly. A few carry
// their own quotation marks — the script lessons gloss letters as
// `The letter “ka”` — and wrapping those again produced questions that read
// like a typo: `How do you say “The letter “ka””?`.

/** Wraps an English meaning in quotes, flattening any it already contains. */
export function quoted(en: string): string {
	return `“${en.replace(/[“”"]/g, '')}”`;
}
