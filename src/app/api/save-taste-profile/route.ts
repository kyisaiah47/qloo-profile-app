import { NextRequest, NextResponse } from "next/server";
import { saveTasteProfile } from "@/lib/database";

export async function POST(request: NextRequest) {
	try {
		const { userId, tasteProfile } = await request.json();

		if (!userId || !tasteProfile) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const result = await saveTasteProfile(userId, tasteProfile);

		if (result.success) {
			return NextResponse.json({
				success: true,
				data: result.data,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.error || "Failed to save taste profile",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in save-taste-profile:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
