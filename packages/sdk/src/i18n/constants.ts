/**
 * Locale that is always stored/read without any key suffix — i.e. exactly like every
 * template's content behaved before multi-locale support existed. Only non-base locales
 * get a `pageKey@locale` / `footer:<templateId>@locale` suffix (see `PageContentService`).
 */
export const BASE_CONTENT_LOCALE = "en"
