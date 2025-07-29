import { NextRequest, NextResponse } from "next/server";
import { getTasteProfile } from "@/lib/database";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: "Missing userId" },
				{ status: 400 }
			);
		}

		const result = await getTasteProfile(userId);

		if (result.success) {
			return NextResponse.json({
				success: true,
				data: result.data,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.error || "Failed to get taste profile",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in get-taste-profile:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
