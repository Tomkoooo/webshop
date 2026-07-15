"use client"

import { GroupDetailAdmin } from "./GroupDetailAdmin"
import { GroupFormPage } from "./GroupFormPage"
import { GroupHotelsAdmin } from "./GroupHotelsAdmin"
import { GroupEventsAdmin } from "./GroupEventsAdmin"
import { HotelFormPage } from "./HotelFormPage"
import { EventFormPage } from "./EventFormPage"

export function GroupAdminRouter({ path }: { path: string[] }) {
  if (path[0] === "new") {
    return <GroupFormPage />
  }

  const groupId = path[0]
  if (!groupId) return null

  if (path[1] === "edit") {
    return <GroupFormPage groupId={groupId} />
  }

  if (path[1] === "hotels") {
    if (path[2] === "new") {
      return <HotelFormPage groupId={groupId} />
    }
    if (path[2]) {
      return <HotelFormPage groupId={groupId} hotelId={path[2]} />
    }
    return <GroupHotelsAdmin groupId={groupId} />
  }

  if (path[1] === "events") {
    if (path[2] === "new") {
      return <EventFormPage groupId={groupId} />
    }
    if (path[2]) {
      return <EventFormPage groupId={groupId} eventId={path[2]} />
    }
    return <GroupEventsAdmin groupId={groupId} />
  }

  return <GroupDetailAdmin groupId={groupId} />
}
