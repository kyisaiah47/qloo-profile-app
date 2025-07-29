import { supabase, UserInterest, UserInsight, InsightItem } from "./supabase";

// Generate a unique user ID (in a real app, this would come from authentication)
export const generateUserId = () => {
	return "user_" + Math.random().toString(36).substr(2, 9);
};

// Save user profile with interests and insights
export const saveUserProfile = async (
	userId: string,
	interests: Record<string, string[]>,
	insights: Record<string, InsightItem[]>
) => {
	try {
		// First, save the main profile
		const { data: profile, error: profileError } = await supabase
			.from("user_profiles")
			.upsert({
				user_id: userId,
				interests,
				insights,
				profile_completed: true,
				updated_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (profileError) throw profileError;

		// Save individual interests
		const interestRecords: Omit<UserInterest, "id" | "created_at">[] = [];
		Object.entries(interests).forEach(([category, interestList]) => {
			interestList.forEach((interest) => {
				interestRecords.push({
					user_id: userId,
					category,
					interest_name: interest,
				});
			});
		});

		if (interestRecords.length > 0) {
			// Delete existing interests for this user first
			await supabase.from("user_interests").delete().eq("user_id", userId);

			// Insert new interests
			const { error: interestsError } = await supabase
				.from("user_interests")
				.insert(interestRecords);

			if (interestsError) throw interestsError;
		}

		// Save individual insights
		const insightRecords: Omit<UserInsight, "id" | "created_at">[] = [];
		Object.entries(insights).forEach(([category, insightList]) => {
			insightList.forEach((insight) => {
				insightRecords.push({
					user_id: userId,
					category,
					insight_type: "recommendation",
					entity_id: insight.entity_id,
					entity_name: insight.name,
					popularity_score: insight.popularity || 0,
					metadata: { source: "qloo" },
				});
			});
		});

		if (insightRecords.length > 0) {
			// Delete existing insights for this user first
			await supabase.from("user_insights").delete().eq("user_id", userId);

			// Insert new insights
			const { error: insightsError } = await supabase
				.from("user_insights")
				.insert(insightRecords);

			if (insightsError) throw insightsError;
		}

		return { success: true, profile, userId };
	} catch (error) {
		console.error("Error saving user profile:", error);
		return { success: false, error };
	}
};

// Get user profile by ID
export const getUserProfile = async (userId: string) => {
	try {
		const { data: profile, error: profileError } = await supabase
			.from("user_profiles")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (profileError) throw profileError;

		const { data: interests, error: interestsError } = await supabase
			.from("user_interests")
			.select("*")
			.eq("user_id", userId);

		if (interestsError) throw interestsError;

		const { data: insights, error: insightsError } = await supabase
			.from("user_insights")
			.select("*")
			.eq("user_id", userId);

		if (insightsError) throw insightsError;

		return {
			success: true,
			profile,
			interests,
			insights,
		};
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return { success: false, error };
	}
};

// Find similar users based on interests
export const findSimilarUsers = async (userId: string) => {
	try {
		// Get current user's interests
		const { data: userInterests } = await supabase
			.from("user_interests")
			.select("category, interest_name")
			.eq("user_id", userId);

		if (!userInterests || userInterests.length === 0) {
			return { success: true, similarUsers: [] };
		}

		// Find users with overlapping interests
		const interestNames = userInterests.map((i) => i.interest_name);

		const { data: similarUsers, error } = await supabase
			.from("user_interests")
			.select(
				`
        user_id,
        user_profiles!inner(user_id, created_at, profile_completed)
      `
			)
			.in("interest_name", interestNames)
			.neq("user_id", userId);

		if (error) throw error;

		// Group by user and count matches
		const userMatches: Record<
			string,
			{
				userId: string;
				matchCount: number;
				profile: {
					user_id: string;
					created_at: string;
					profile_completed: boolean;
				};
			}
		> = {};

		similarUsers?.forEach((item) => {
			const otherUserId = item.user_id;
			if (!userMatches[otherUserId]) {
				userMatches[otherUserId] = {
					userId: otherUserId,
					matchCount: 0,
					profile: Array.isArray(item.user_profiles)
						? item.user_profiles[0]
						: item.user_profiles,
				};
			}
			userMatches[otherUserId].matchCount++;
		});

		// Sort by match count and return top matches
		const sortedMatches = Object.values(userMatches)
			.sort((a, b) => b.matchCount - a.matchCount)
			.slice(0, 10);

		return { success: true, similarUsers: sortedMatches };
	} catch (error) {
		console.error("Error finding similar users:", error);
		return { success: false, error };
	}
};
