import Link from "next/link"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { CampListCamp } from "./camp-list-types"

type Props = {
  camps: CampListCamp[]
  variant?: "default" | "mineshow"
}

function sessionThumbnail(session: CampListCamp["sessions"][number], camp: CampListCamp) {
  return session.imageUrl || camp.heroImage || ""
}

export function CampListView({ camps, variant = "default" }: Props) {
  if (camps.length === 0) {
    return (
      <p className="font-minecraft-body text-center text-lg text-[#3d2817] py-16">
        Hamarosan indulnak az új turnusok — nézz vissza később!
      </p>
    )
  }

  if (variant === "mineshow") {
    return (
      <div className="space-y-6">
        {camps.map((camp) =>
          camp.sessions.map((session) => {
            const thumb = sessionThumbnail(session, camp)
            return (
            <article
              key={session.id}
              className="minecraft-panel-wood px-4 py-4 md:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex gap-4 items-start flex-1 min-w-0">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaImageSrc(thumb)}
                    alt=""
                    className="w-20 h-20 md:w-24 md:h-24 object-cover border-4 border-[#3d2817] shrink-0 pixelated"
                  />
                ) : null}
                <div className="min-w-0">
                <h3 className="font-minecraft text-[10px] md:text-xs text-white">
                  {session.label}
                </h3>
                <p className="font-minecraft-body text-xs text-white/80 mt-1">
                  {session.sessionLabel}
                </p>
                <p className="font-minecraft-body text-xs text-[#c6e89c] mt-1">
                  {session.spotsLeft} szabad hely
                </p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                {session.ticketTypes[0] ? (
                  <p className="font-minecraft-body text-xs text-white">
                    már {session.ticketTypes[0].priceHuf.toLocaleString("hu-HU")} Ft-tól
                  </p>
                ) : null}
                <Link
                  href={`/foglalas/${session.id}`}
                  className={`minecraft-btn text-center text-[10px] ${
                    session.spotsLeft < 1 ? "opacity-50 pointer-events-none" : "bg-[#5D9B38]"
                  }`}
                >
                  {session.spotsLeft < 1 ? "Betelt" : "Jegyek"}
                </Link>
              </div>
            </article>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div id="taborok" className="space-y-12">
      {camps.map((camp) => (
        <section key={camp.id} className="minecraft-panel p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {camp.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaImageSrc(camp.heroImage)}
                alt=""
                className="w-full sm:w-48 h-32 object-cover border-4 border-[#3d2817] pixelated"
              />
            ) : null}
            <div>
              <h2 className="font-minecraft text-xl md:text-2xl text-[#2d5016] mb-2">{camp.title}</h2>
              {camp.description ? (
                <p className="font-minecraft-body text-[#3d2817] max-w-2xl">{camp.description}</p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {camp.sessions.map((session) => {
              const thumb = sessionThumbnail(session, camp)
              return (
              <article
                key={session.id}
                className="minecraft-panel-inner p-4 flex flex-col gap-3"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaImageSrc(thumb)}
                    alt=""
                    className="w-full h-28 object-cover border-4 border-[#3d2817] pixelated"
                  />
                ) : null}
                <div>
                  <h3 className="font-minecraft text-sm text-[#1a3d5c]">{session.label}</h3>
                  <p className="font-minecraft-body text-xs text-[#5c4a32] mt-1">
                    {session.sessionLabel}
                  </p>
                </div>
                <p className="font-minecraft-body text-sm">
                  <span className="font-semibold">{session.spotsLeft}</span> szabad hely /{" "}
                  {session.capacity}
                </p>
                {session.ticketTypes.length > 0 ? (
                  <ul className="font-minecraft-body text-xs space-y-1 text-[#3d2817]">
                    {session.ticketTypes.map((tt) => (
                      <li key={tt.id}>
                        {tt.name}: {tt.priceHuf.toLocaleString("hu-HU")} Ft
                        {tt.pricingMode === "per_child" ? " / gyerek" : " / foglalás"}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Link
                  href={`/foglalas/${session.id}`}
                  className={`minecraft-btn mt-auto text-center ${
                    session.spotsLeft < 1 ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {session.spotsLeft < 1 ? "Betelt" : "Foglalás"}
                </Link>
              </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
