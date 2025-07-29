import { NextRequest, NextResponse } from "next/server";
import { findSimilarUsers } from "@/lib/database";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return NextResponse.json(
				{
					success: false,
					message: "User ID is required",
				},
				{ status: 400 }
			);
		}

		const result = await findSimilarUsers(userId);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "Similar users found",
				data: result.similarUsers,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					message: "Failed to find similar users",
					error: result.error,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in find-matches API:", error);
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
