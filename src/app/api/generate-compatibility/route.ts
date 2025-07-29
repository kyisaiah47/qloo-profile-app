import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const {
			currentUserInterests,
			matchUserProfile,
			sharedEntities,
			matchScore,
		} = await request.json();

		// Prepare the shared interests for the prompt
		const sharedInterestsText = Object.entries(
			sharedEntities as Record<string, string[]>
		)
			.map(([category, items]) => `${category}: ${items.join(", ")}`)
			.join("\n");

		const prompt = `
You are a matchmaking expert. Generate a brief, engaging compatibility blurb (2-3 sentences) explaining why these two users seem like a good fit based on their shared interests and preferences.

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

Write a warm, personalized compatibility blurb that highlights the most interesting shared interests and explains why these two people would connect well. Keep it conversational and engaging. Focus on the strongest connections and avoid being too generic.

Example style: "You both have incredible taste in indie films and share a love for jazz fusion - Sarah seems like someone who'd appreciate your passion for underground cinema and could introduce you to some amazing new artists from the Brooklyn scene."

Response should be 2-3 sentences maximum.`;

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content:
							"You are a matchmaking expert who creates engaging, personalized compatibility explanations based on shared interests.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				max_tokens: 200,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const aiResponse = await response.json();
		const compatibilityBlurb = aiResponse.choices[0]?.message?.content?.trim();

		if (!compatibilityBlurb) {
			throw new Error("No compatibility blurb generated");
		}

		return NextResponse.json({
			success: true,
			data: compatibilityBlurb,
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
