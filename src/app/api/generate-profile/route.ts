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
			prompt = `
Based on the following user interests and AI-generated recommendations, create a compelling and personalized profile description. Be creative, engaging, and capture their unique vibe:

USER INTERESTS:
${interestsText}

AI RECOMMENDATIONS:
${insightsText}

Please generate a response in the following JSON format:
{
  "headline": "A catchy 3-8 word headline that captures their vibe (e.g., 'The Eclectic Music Adventurer', 'Retro Soul with Modern Edge')",
  "description": "A 2-3 sentence engaging description of their personality based on their tastes",
  "vibe": "One word that best describes their overall aesthetic/personality (e.g., 'Sophisticated', 'Adventurous', 'Nostalgic', 'Eclectic')",
  "traits": ["3-5 personality traits as short phrases based on their interests"],
  "compatibility": "A sentence about what kind of people they'd vibe with",
  "emoji": "A single emoji that best represents their personality and interests (e.g., 🎨 for creative types, 🌟 for adventurous spirits, 📚 for bookworms, 🎵 for music lovers, etc.)"
}

Make it feel authentic and avoid generic descriptions. Focus on the unique combination of their interests to create something memorable and personal.`;
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
