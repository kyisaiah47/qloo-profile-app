import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
	try {
		const {
			currentUserInterests,
			matchUserProfile,
			sharedEntities,
			matchScore,
		} = await request.json();

		// Use user IDs for caching (assumes matchUserProfile has user_id)
		const currentUserId =
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
		const matchUserId =
			matchUserProfile.user_id ||
			matchUserProfile.userId ||
			matchUserProfile.userid;
		if (!currentUserId || !matchUserId) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Both user IDs are required for caching compatibility results.",
				},
				{ status: 400 }
			);
		}

		// Check for existing compatibility blurb in the DB
		const { data: cached, error: cacheError } = await supabase
			.from("user_match_compatibility")
			.select("blurb")
			.eq("user_id_1", currentUserId)
			.eq("user_id_2", matchUserId)
			.maybeSingle();

		if (cacheError) {
			console.error("Error checking compatibility cache:", cacheError);
		}
		if (cached && cached.blurb) {
			return NextResponse.json({
				success: true,
				data: cached.blurb,
				cached: true,
			});
		}

		// ...existing code to generate prompt...
		console.log("Generating compatibility explanation...");
		const sharedInterestsText = Object.entries(
			sharedEntities as Record<string, string[]>
		)
			.map(([category, items]) => `${category}: ${items.join(", ")}`)
			.join("\n");

		const prompt = `
You are a matchmaking expert. Generate a JSON object with two fields:
1. "excerpt": A warm, engaging compatibility blurb (3-5 sentences) explaining why these two users seem like a good fit based on their shared interests and preferences. Make it conversational, highlight the most interesting shared interests, and avoid being too generic.
2. "tags": An array of 2-4 short words or phrases ("match tags") that describe why these users are a good match (e.g., "indie film lovers", "jazz fans", "adventurous spirits"). These should be concise and suitable for display as chips below the excerpt.

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

Write the excerpt in 3-5 sentences. Then, provide the tags as a JSON array. Example response:
{
  "excerpt": "You both have incredible taste in indie films and share a love for jazz fusion. Sarah seems like someone who'd appreciate your passion for underground cinema and could introduce you to some amazing new artists from the Brooklyn scene. Your adventurous spirits and appreciation for unique experiences make you a great match. You both value creativity and are always seeking something new. This connection promises exciting discoveries and meaningful conversations.",
  "tags": ["indie film lovers", "jazz fans", "adventurous spirits", "creative minds"]
}
`;

		console.log(prompt);

		// Gemini AI call (GoogleGenerativeAI)
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		const result = await model.generateContent(prompt);
		const geminiResponse = await result.response;
		const text = geminiResponse.text();

		// Parse the Gemini response as JSON
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

		// Save the result in the DB for future requests
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
