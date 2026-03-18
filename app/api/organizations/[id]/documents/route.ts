import { NextResponse } from "next/server";

export async function GET() {
  const mockDocuments = {
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    hasMore: false,
  };

  return NextResponse.json(mockDocuments);
}
