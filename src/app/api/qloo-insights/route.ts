// This is your /api/qloo-insights endpoint
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const { entityId, type, filterType, take = 10 } = await req.json();

	const url = `https://hackathon.api.qloo.com/v2/insights?filter.type=urn:entity:${filterType}&signal.interests.entities=${encodeURIComponent(
		entityId
	)}&take=${take}`;

	try {
		const res = await fetch(url, {
			headers: {
				"X-Api-Key": process.env.QLOO_API_KEY!,
				accept: "application/json",
			},
		});
		const data = await res.json();
		return NextResponse.json({ data });
	} catch (err) {
		return NextResponse.json({ error: err }, { status: 500 });
	}
}
