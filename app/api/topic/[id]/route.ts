import { NextRequest, NextResponse } from "next/server"
import { API_ENDPOINTS } from "@/lib/constants"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    const topicId = params.id

    const authHeader = request.headers.get("Authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    const backendUrl = `${apiUrl}${API_ENDPOINTS.TOPIC.GET(topicId)}`

    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: "Failed to get topic", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Topic get proxy error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

