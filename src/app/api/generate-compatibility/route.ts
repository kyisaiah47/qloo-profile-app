import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

// ✅ Helper to resolve string usernames or IDs into UUIDs
async function getUserIdFromUsername(input: string): Promise<string | null> {
	const isUuid =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			input
		);
	if (isUuid) return input;

	const { data, error } = await supabase
		.from("user_profiles") // 🔁 Change if your user table is different
		.select("id") // 🔁 Adjust if UUID field is named something else
		.eq("username", input)
		.maybeSingle();

	if (error) {
		console.error("UUID lookup failed:", error);
		return null;
	}

	return data?.id ?? null;
}

// ✅ Retry logic for Gemini rate limiting
async function generateWithRetry(
	model: any,
	prompt: string,
	retries = 3,
	delay = 1000
): Promise<string> {
	for (let i = 0; i < retries; i++) {
		try {
			const result = await model.generateContent(prompt);
			const response = await result.response;
			return response.text();
		} catch (err: any) {
			if (err?.status === 429 && i < retries - 1) {
				console.warn(`Gemini 429: retrying in ${delay}ms...`);
				await new Promise((res) => setTimeout(res, delay));
				delay *= 2;
			} else {
				console.error("Gemini API Error:", err);
				throw err;
			}
		}
	}
	throw new Error("Gemini failed after maximum retries");
}

export async function POST(request: Request) {
	try {
		const {
			currentUserInterests,
			matchUserProfile,
			sharedEntities,
			matchScore,
		} = await request.json();

		// 🔍 Extract and resolve user UUIDs
		const rawCurrentUserId =
			matchUserProfile.current_user_id ||
			matchUserProfile.currentUserId ||
			matchUserProfile.currentUserID ||
			matchUserProfile.currentuserId ||
			matchUserProfile.currentuserid ||
			matchUserProfile.current_userid ||
			matchUserProfile.current_user ||
			matchUserProfile.user_id ||
			matchUserProfile.userId ||
			matchUserProfile.userid;

		const rawMatchUserId =
			matchUserProfile.user_id ||
			matchUserProfile.userId ||
			matchUserProfile.userid;

		const currentUserId = await getUserIdFromUsername(rawCurrentUserId);
		const matchUserId = await getUserIdFromUsername(rawMatchUserId);

		if (!currentUserId || !matchUserId) {
			return NextResponse.json(
				{
					success: false,
					error: "Could not resolve both user IDs to UUIDs.",
				},
				{ status: 400 }
			);
		}

		// 🔁 Cache check
		const { data: cached, error: cacheError } = await supabase
			.from("user_match_compatibility")
			.select("blurb")
			.eq("user_id_1", currentUserId)
			.eq("user_id_2", matchUserId)
			.maybeSingle();

		if (cacheError) {
			console.error("Error checking compatibility cache:", cacheError);
		}
		if (cached?.blurb) {
			return NextResponse.json({
				success: true,
				data: cached.blurb,
				cached: true,
			});
		}

		// 🧠 Generate prompt
		console.log("Generating compatibility explanation...");
		const sharedInterestsText = Object.entries(
			sharedEntities as Record<string, string[]>
		)
			.map(([category, items]) => `${category}: ${items.join(", ")}`)
			.join("\n");

		const prompt = `
You are a matchmaking expert. Generate a JSON object with two fields:
1. "excerpt": A warm, engaging compatibility blurb (3-5 sentences) explaining why these two users seem like a good fit based on their shared interests and preferences. Make it conversational, highlight the most interesting shared interests, and avoid being too generic.
2. "tags": An array of 2-4 short words or phrases ("match tags") that describe why these users are a good match (e.g., "indie film lovers", "jazz fans", "adventurous spirits").

CURRENT USER'S INTERESTS:
${Object.entries(currentUserInterests)
	.filter(([, values]) => Array.isArray(values) && values.length > 0)
	.map(
		([category, values]) => `${category}: ${(values as string[]).join(", ")}`
	)
	.join("\n")}

MATCH USER'S PROFILE:
Name: ${matchUserProfile.name}
Bio: ${matchUserProfile.bio}
Location: ${matchUserProfile.location}

SHARED INTERESTS:
${sharedInterestsText}

MATCH SCORE: ${(matchScore * 100).toFixed(0)}%
`;

		// 🔮 Gemini API call with retry
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		const text = await generateWithRetry(model, prompt);

		// 🧩 Parse Gemini response
		let excerpt = "";
		let tags: string[] = [];
		try {
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				excerpt = parsed.excerpt?.trim() || "";
				tags = Array.isArray(parsed.tags) ? parsed.tags : [];
			} else {
				throw new Error("No JSON found in Gemini response");
			}
		} catch (err) {
			console.error("Failed to parse Gemini response as JSON:", err);
			excerpt = text.trim();
			tags = [];
		}

		if (!excerpt) {
			throw new Error("No compatibility excerpt generated");
		}

		// 💾 Save to cache
		const { error: insertError } = await supabase
			.from("user_match_compatibility")
			.insert([
				{
					user_id_1: currentUserId,
					user_id_2: matchUserId,
					blurb: excerpt,
					tags: JSON.stringify(tags),
					created_at: new Date().toISOString(),
				},
			]);

		if (insertError) {
			console.error("Error saving compatibility blurb:", insertError);
		}

		return NextResponse.json({
			success: true,
			data: {
				excerpt,
				tags,
			},
			cached: false,
		});
	} catch (error) {
		console.error("Error generating compatibility blurb:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to generate compatibility explanation",
				fallback:
					"You share amazing taste and similar interests - this looks like a great potential connection!",
			},
			{ status: 500 }
		);
	}
}
