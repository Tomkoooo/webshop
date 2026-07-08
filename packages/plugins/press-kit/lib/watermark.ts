export function renderWatermarkTemplate(
  template: string,
  vars: { name: string; outlet: string; email: string }
): string {
  return template
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{outlet\}\}/g, vars.outlet)
    .replace(/\{\{email\}\}/g, vars.email)
}
