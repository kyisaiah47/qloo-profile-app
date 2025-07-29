import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Get user profile
		const { data: profile, error: profileError } = await supabase
			.from("user_profiles")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (profileError || !profile) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		// Get user interests
		const { data: interests, error: interestsError } = await supabase
			.from("user_interests")
			.select("*")
			.eq("user_id", userId);

		if (interestsError) {
			console.error("Error fetching interests:", interestsError);
		}

		// Get user insights
		const { data: insights, error: insightsError } = await supabase
			.from("user_insights")
			.select("*")
			.eq("user_id", userId);

		if (insightsError) {
			console.error("Error fetching insights:", insightsError);
		}

		// Organize interests by type
		const organizedInterests: Record<string, string[]> = {};
		if (interests) {
			interests.forEach((interest) => {
				if (!organizedInterests[interest.interest_type]) {
					organizedInterests[interest.interest_type] = [];
				}
				organizedInterests[interest.interest_type].push(interest.interest_name);
			});
		}

		return NextResponse.json({
			success: true,
			data: {
				profile,
				interests: organizedInterests,
				insights: insights || [],
			},
		});
	} catch (error) {
		console.error("Error in get-user-profile:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
