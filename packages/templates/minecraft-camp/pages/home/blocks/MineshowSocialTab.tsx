type Props = {
  href?: string
  label?: string
}

export function MineshowSocialTab({
  href = "https://www.facebook.com/",
  label = "Kövess minket",
}: Props) {
  return (
    <a
      href={href}
      className="minecraft-social-tab"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      {label}
    </a>
  )
}
