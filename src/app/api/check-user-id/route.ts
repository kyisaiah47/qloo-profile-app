import { NextRequest, NextResponse } from "next/server";
import { checkUserIdExists } from "@/lib/database";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ success: false, message: "User ID is required" },
				{ status: 400 }
			);
		}

		const { exists, error } = await checkUserIdExists(userId);

		if (error) {
			return NextResponse.json(
				{ success: false, message: "Failed to check user ID" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			exists,
		});
	} catch (error) {
		console.error("Error in check-user-id API:", error);
		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 }
		);
	}
}
