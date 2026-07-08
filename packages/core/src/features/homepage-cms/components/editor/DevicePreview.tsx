"use client"

export function DevicePreview({
  device,
  children,
}: {
  device: "desktop" | "tablet" | "mobile"
  children: React.ReactNode
}) {
  const widthClass =
    device === "mobile" ? "max-w-[430px]" : device === "tablet" ? "max-w-[900px]" : "max-w-none"

  return <div className={`mx-auto w-full ${widthClass} transition-all duration-300`}>{children}</div>
}
