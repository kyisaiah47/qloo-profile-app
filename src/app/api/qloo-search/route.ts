// src/app/api/qloo-search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const { query } = await req.json();

	const url = `https://hackathon.api.qloo.com/search?query=${encodeURIComponent(
		query
	)}&take=20&page=1&sort_by=match`;

	const headers = {
		"X-Api-Key": process.env.QLOO_API_KEY!,
		accept: "application/json",
	};

	try {
		const res = await fetch(url, { headers });
		const data = await res.json();
		return NextResponse.json({ data });
	} catch (err) {
		return NextResponse.json({ error: err }, { status: 500 });
	}
}
