import { dispatchPluginApi } from "@wse/core/lib/plugins/dispatch-plugin-api"

type RouteContext = {
  params: Promise<{ pluginId: string; path?: string[] }>
}

async function handle(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const { pluginId, path: pathSegments } = await context.params
  const path = pathSegments ?? []
  return dispatchPluginApi(pluginId, path, request)
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context)
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context)
}

export async function PUT(request: Request, context: RouteContext) {
  return handle(request, context)
}

export async function PATCH(request: Request, context: RouteContext) {
  return handle(request, context)
}

export async function DELETE(request: Request, context: RouteContext) {
  return handle(request, context)
}
