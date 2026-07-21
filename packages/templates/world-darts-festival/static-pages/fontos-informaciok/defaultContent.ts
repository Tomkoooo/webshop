import type { ImportantInfoContent } from "./schema"

export const importantInfoDefaultContent: ImportantInfoContent = {
  title: "<p>Important information</p>",
  subtitle:
    "<p>Everything you need to know about registration, rules, playing format, and venue policies.</p>",
  body: `<h2>Registration</h2>
<p>Online registration is required for all tournament categories. Entry fees are non-refundable after the closing date unless the event is cancelled by the organizer.</p>
<h2>Playing format</h2>
<p>Match formats follow WDF regulations. Check your category sheet for leg counts and board assignments.</p>
<h2>What to bring</h2>
<ul>
<li>Valid photo ID</li>
<li>Your own darts (steel tip)</li>
<li>Confirmation email or booking reference</li>
</ul>`,
  meta: {
    seoTitle: "Important information — World Darts Festival",
    seoDescription: "Registration rules, playing format, and practical information for competitors.",
  },
}
