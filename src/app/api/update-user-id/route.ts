import { NextRequest, NextResponse } from "next/server";
import { updateUserId } from "@/lib/database";

export async function POST(request: NextRequest) {
	try {
		const { oldUserId, newUserId } = await request.json();

		if (!oldUserId || !newUserId) {
			return NextResponse.json(
				{ success: false, message: "Both old and new User IDs are required" },
				{ status: 400 }
			);
		}

		const result = await updateUserId(oldUserId, newUserId);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "User ID updated successfully",
			});
		} else {
			return NextResponse.json(
				{ success: false, error: result.error },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("Error in update-user-id API:", error);
		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 }
		);
	}
}
