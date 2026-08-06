import {
  Briefcase,
  HeartPulse,
  Home,
  Scale,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { PracticeAreaIcon } from "../pages/home/schema"

const ICONS: Record<PracticeAreaIcon, LucideIcon> = {
  family: Users,
  civil: Scale,
  property: Home,
  health: HeartPulse,
  labor: Briefcase,
  generic: Scale,
}

export function PracticeIcon({
  icon,
  className,
}: {
  icon: PracticeAreaIcon | string
  className?: string
}) {
  const Icon = ICONS[icon as PracticeAreaIcon] ?? ICONS.generic
  return <Icon className={className} strokeWidth={1.25} aria-hidden />
}
