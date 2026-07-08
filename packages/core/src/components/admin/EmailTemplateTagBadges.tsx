import { getEmailTagBadgeClassName, getEmailTagStyle } from "@wse/core/lib/email-template-ui"

export function EmailTemplateTagBadges({ tags }: { tags: string[] }) {
  if (!tags.length) return null

  const sorted = [...tags].sort((a, b) => {
    const order = [
      "core",
      "shop",
      "camp-booking",
      "contact",
      "invoicing",
      "szamlazz",
      "order",
      "transactional",
      "registration",
    ]
    return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
  })

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((tag) => {
        const style = getEmailTagStyle(tag)
        return (
          <span key={tag} className={getEmailTagBadgeClassName(tag)} title={style.label ?? tag}>
            {tag}
          </span>
        )
      })}
    </div>
  )
}
