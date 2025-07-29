import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/database";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json(
				{
					success: false,
					message: "User ID is required",
				},
				{ status: 400 }
			);
		}

		const result = await getUserProfile(userId);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "Profile retrieved successfully",
				data: {
					profile: result.profile,
					interests: result.interests,
					insights: result.insights,
				},
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					message: "Profile not found",
					error: result.error,
				},
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("Error in get-profile API:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Internal server error",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
