import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			interests,
			insights,
			prompt: customPrompt,
			generateUsernameOnly,
		} = body;

		if (!interests || Object.keys(interests).length === 0) {
			return NextResponse.json(
				{
					success: false,
					message: "Interests data is required",
				},
				{ status: 400 }
			);
		}

		// Prepare data for AI analysis
		const interestsText = Object.entries(interests)
			.filter(([, values]) => Array.isArray(values) && values.length > 0)
			.map(
				([category, values]) =>
					`${category}: ${(values as string[]).join(", ")}`
			)
			.join("\n");

		const insightsText = Object.entries(insights || {})
			.filter(([, entities]) => Array.isArray(entities) && entities.length > 0)
			.map(([category, entities]) => {
				const entityNames = (entities as Array<{ name: string }>)
					.slice(0, 3)
					.map((entity) => entity.name)
					.join(", ");
				return `${category} recommendations: ${entityNames}`;
			})
			.join("\n");

		// Create the AI prompt
		let prompt = customPrompt;

		if (!customPrompt) {
			// Count interests to understand the user's breadth
			const totalInterests = Object.values(interests).flat().length;
			const categoryCount = Object.keys(interests).length;

			// Extract specific examples for more context
			const specificInterests = Object.entries(interests)
				.filter(([, values]) => Array.isArray(values) && values.length > 0)
				.map(([category, values]) => ({
					category,
					items: (values as string[]).slice(0, 3),
					count: (values as string[]).length,
				}));

			// Create unique identifiers based on their specific interests
			const dominantCategories = specificInterests
				.sort((a, b) => b.count - a.count)
				.slice(0, 3)
				.map((cat) => cat.category);

			const uniqueCombination = specificInterests
				.flatMap((cat) => cat.items)
				.slice(0, 8)
				.join(", ");

			prompt = `
You are creating a highly personalized taste profile for someone with these SPECIFIC interests. Make this profile UNIQUE and avoid generic language.

DETAILED INTEREST BREAKDOWN:
${specificInterests
	.map(
		(cat) =>
			`${cat.category.toUpperCase()} (${cat.count} items): ${cat.items.join(
				", "
			)}`
	)
	.join("\n")}

AI PERSONALIZATION DATA:
${insightsText}

UNIQUENESS FACTORS:
- Total interests: ${totalInterests} across ${categoryCount} categories
- Dominant areas: ${dominantCategories.join(", ")}
- Unique combination: ${uniqueCombination}

Create a DISTINCTIVE profile that captures THIS SPECIFIC person's taste, not a generic template. Consider:
1. What makes their combination of interests unusual or interesting?
2. What personality type would have EXACTLY these tastes?
3. What subcultural niches do they bridge?
4. What does their breadth vs depth say about them?

Generate a JSON response with these fields:
{
  "headline": "A unique 4-8 word headline based on THEIR SPECIFIC combination (not generic like 'Music Lover' - be creative and specific)",
  "description": "2-3 sentences that feel like they were written FOR THIS SPECIFIC PERSON based on their exact tastes",
  "vibe": "One distinctive word that captures THEIR unique aesthetic (avoid common words like 'eclectic' - be more specific)",
  "traits": ["4-5 specific personality traits that someone with THESE EXACT interests would have"],
  "compatibility": "Who would connect with someone who has THIS SPECIFIC combination of interests",
  "emoji": "An emoji that represents THEIR unique combination, not just one category"
}

CRITICAL: Make this feel like a custom-written profile, not a template. Reference their specific taste combination.`;
		}

		// Get AI model
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		// Generate content
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		// Parse the response
		let profileData;

		if (generateUsernameOnly) {
			// For username generation, just return the text response
			profileData = text
				.trim()
				.replace(/[^a-zA-Z0-9_]/g, "")
				.substring(0, 15);
		} else {
			// For profile generation, parse JSON
			try {
				// Extract JSON from the response (in case there's extra text)
				const jsonMatch = text.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					profileData = JSON.parse(jsonMatch[0]);
				} else {
					throw new Error("No JSON found in response");
				}
			} catch (parseError) {
				console.error("Failed to parse AI response:", parseError);
				console.error("Raw AI response:", text);

				// Fallback profile if AI response can't be parsed
				profileData = {
					headline: "The Taste Explorer",
					description:
						"Someone with unique and diverse interests who loves discovering new experiences across different categories.",
					vibe: "Eclectic",
					traits: ["Curious", "Open-minded", "Adventurous", "Creative"],
					compatibility:
						"You'd connect well with fellow explorers who appreciate diversity in culture, art, and experiences.",
					emoji: "🌟",
				};
			}
		}

		return NextResponse.json({
			success: true,
			message: "Profile generated successfully",
			data: profileData,
		});
	} catch (error) {
		console.error("Error generating AI profile:", error);

		// Return a fallback response if AI fails
		return NextResponse.json({
			success: true,
			message: "Profile generated successfully",
			data: {
				headline: "The Unique Individual",
				description:
					"Someone with distinctive tastes and interests who brings a fresh perspective to any conversation.",
				vibe: "Authentic",
				traits: ["Genuine", "Interesting", "Thoughtful", "Creative"],
				compatibility:
					"You'd connect well with people who appreciate authenticity and diverse interests.",
				emoji: "✨",
			},
		});
	}
}
