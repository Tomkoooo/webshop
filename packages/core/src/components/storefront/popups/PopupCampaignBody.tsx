"use client"

import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Button } from "@wse/core/components/ui/button"
import { mediaImageSrc } from "@wse/core/lib/images"
import { isExternalPopupHref } from "@wse/core/lib/popup-dismiss-storage"
import type { PopupCampaign, PopupTemplateId } from "@wse/core/lib/popup-campaign-schema"
import { cn } from "@wse/core/lib/utils"

export type PopupCampaignDisplay = Pick<
  PopupCampaign,
  | "templateId"
  | "title"
  | "body"
  | "imageUrl"
  | "buttonText"
  | "buttonHref"
  | "showCloseButton"
>

function PopupImage({ imageUrl, className }: { imageUrl?: string; className?: string }) {
  if (!imageUrl?.trim()) return null
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-neutral-900", className)}>
      <FallbackImage
        src={mediaImageSrc(imageUrl)}
        alt=""
        width={640}
        height={360}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

function PopupCta({ buttonText, buttonHref }: { buttonText?: string; buttonHref?: string }) {
  if (!buttonText?.trim() || !buttonHref?.trim()) return null
  const href = buttonHref.trim()
  const external = isExternalPopupHref(href)
  const btn = (
    <Button variant="krausz" className="w-full sm:w-auto min-h-11 px-8">
      {buttonText}
    </Button>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {btn}
      </a>
    )
  }
  return <Link href={href}>{btn}</Link>
}

function PopupText({ title, body }: { title?: string; body?: string }) {
  return (
    <div className="space-y-2 text-center md:text-left">
      {title?.trim() ? (
        <h2 className="font-heading text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
      ) : null}
      {body?.trim() ? (
        <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">{body}</p>
      ) : null}
    </div>
  )
}

export function PopupCampaignBody({
  campaign,
  preview = false,
}: {
  campaign: PopupCampaignDisplay
  preview?: boolean
}) {
  const templateId = campaign.templateId as PopupTemplateId

  if (templateId === "split") {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 md:flex-row md:items-center md:gap-6",
          preview && "pointer-events-none"
        )}
      >
        <PopupImage imageUrl={campaign.imageUrl} className="md:w-2/5 aspect-[4/3] min-h-[140px]" />
        <div className="flex flex-1 flex-col gap-4 md:gap-5">
          <PopupText title={campaign.title} body={campaign.body} />
          <div className="flex justify-center md:justify-start">
            <PopupCta buttonText={campaign.buttonText} buttonHref={campaign.buttonHref} />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === "imageTop") {
    return (
      <div className={cn("flex flex-col gap-4", preview && "pointer-events-none")}>
        <PopupImage imageUrl={campaign.imageUrl} className="aspect-[16/9] w-full" />
        <PopupText title={campaign.title} body={campaign.body} />
        <div className="flex justify-center">
          <PopupCta buttonText={campaign.buttonText} buttonHref={campaign.buttonHref} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 text-center",
        preview && "pointer-events-none"
      )}
    >
      <PopupImage imageUrl={campaign.imageUrl} className="aspect-[16/10] w-full max-w-md" />
      <PopupText title={campaign.title} body={campaign.body} />
      <PopupCta buttonText={campaign.buttonText} buttonHref={campaign.buttonHref} />
    </div>
  )
}
