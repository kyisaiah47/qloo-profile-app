"use client";

import React, {
	useState,
	useRef,
	KeyboardEvent,
	useEffect,
	useCallback,
} from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface ChipInputProps {
	id: string;
	placeholder: string;
	values: string[];
	onChange: (values: string[]) => void;
	className?: string;
}

const ChipInput: React.FC<ChipInputProps> = ({
	id,
	placeholder,
	values = [],
	onChange,
	className,
}) => {
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const addValue = (value: string) => {
		const trimmedValue = value.trim();
		if (trimmedValue && !values.includes(trimmedValue)) {
			onChange([...(values || []), trimmedValue]);
		}
	};

	const removeValue = (index: number) => {
		const newValues = values.filter((_, i) => i !== index);
		onChange(newValues);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const separators = [",", "  ", "\t"];

		// Check if any separator is in the value
		const hasSeparator = separators.some((sep) => value.includes(sep));

		if (hasSeparator) {
			// Split by multiple separators and add non-empty values
			const newValues = value
				.split(/[,\s\t]+/)
				.map((v) => v.trim())
				.filter((v) => v && !(values || []).includes(v));

			if (newValues.length > 0) {
				onChange([...(values || []), ...newValues]);
			}
			setInputValue("");
		} else {
			setInputValue(value);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (inputValue.trim()) {
				addValue(inputValue);
				setInputValue("");
			}
		} else if (
			e.key === "Backspace" &&
			!inputValue &&
			(values || []).length > 0
		) {
			removeValue((values || []).length - 1);
		}
	};

	return (
		<div
			className={`min-h-[42px] p-2 border rounded-md bg-slate-700 border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 hover:border-blue-400 transition-all duration-200 ${className}`}
			onClick={() => inputRef.current?.focus()}
		>
			<div className="flex flex-wrap gap-1 items-center">
				{(values || []).map((value, index) => (
					<motion.div
						key={`${value}-${index}`}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-md font-medium"
					>
						<span>{value}</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								removeValue(index);
							}}
							className="text-blue-200 hover:text-white transition-colors ml-1 text-sm leading-none"
						>
							×
						</button>
					</motion.div>
				))}
				<input
					ref={inputRef}
					id={id}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={(values || []).length === 0 ? placeholder : ""}
					className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-400 text-sm"
				/>
			</div>
		</div>
	);
};

interface InsightItem {
	entity_id: string;
	name: string;
	popularity?: number;
	query?: {
		affinity?: number;
	};
}

interface AIProfile {
	headline: string;
	description: string;
	vibe: string;
	traits: string[];
	compatibility: string;
}

interface MatchUser {
	user_id: string;
	name: string;
	location: string;
	bio: string;
	ai_profile?: AIProfile;
}

interface Match {
	user: MatchUser;
	matchScore: number;
	sharedFields: string[];
	sharedEntities: Record<string, string[]>;
	totalSharedItems: number;
}

const QLOO_TYPES = [
	"artist",
	"album",
	"book",
	"movie",
	"tv_show",
	"destination",
	"place",
	"brand",
	"videogame",
	"podcast",
	"actor",
	"director",
	"author",
	"person",
	"locality",
	"tag",
	"demographics",
];

const getTypeEmoji = (type: string) => {
	const emojiMap: Record<string, string> = {
		artist: "🎤",
		album: "💿",
		book: "📚",
		movie: "🎬",
		tv_show: "📺",
		destination: "🌍",
		place: "📍",
		brand: "🏷️",
		videogame: "🎮",
		podcast: "🎧",
		actor: "🎭",
		director: "🎬",
		author: "✍️",
		person: "👤",
		locality: "🏘️",
		tag: "🏷️",
		demographics: "👥",
	};
	return emojiMap[type] || "⭐";
};

const getPlaceholder = (type: string) => {
	const placeholders: Record<string, string> = {
		artist: "The Beatles, Taylor Swift, Drake",
		album: "Abbey Road, 1989, Thriller",
		book: "1984, Harry Potter, The Hobbit",
		movie: "Inception, The Matrix, Interstellar",
		tv_show: "Breaking Bad, Game of Thrones, Friends",
		destination: "Paris, Tokyo, New York",
		place: "Coffee shop, Library, Beach",
		brand: "Nike, Apple, Starbucks",
		videogame: "The Witcher 3, Minecraft, Zelda",
		podcast: "Joe Rogan, This American Life",
		actor: "Leonardo DiCaprio, Meryl Streep",
		director: "Christopher Nolan, Quentin Tarantino",
		author: "George Orwell, J.K. Rowling",
		person: "Albert Einstein, Steve Jobs",
		locality: "New York, London, Tokyo",
		tag: "Adventure, Comedy, Romance",
		demographics: "Millennials, Gen Z, Baby Boomers",
	};
	return placeholders[type] || "Add multiple items...";
};

export default function ProfileForm() {
	const [showWelcome, setShowWelcome] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [showLogin, setShowLogin] = useState(false);
	const [showUserProfile, setShowUserProfile] = useState(false);
	const [loginUserId, setLoginUserId] = useState("");
	const [loginError, setLoginError] = useState("");
	const [userProfileData, setUserProfileData] =
		useState<UserProfileData | null>(null);
	const [formData, setFormData] = useState<Record<string, string[]>>({});
	const [insightResults, setInsightResults] = useState<
		Record<string, InsightItem[]> & { aiProfile?: AIProfile }
	>({});
	const [userId, setUserId] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [profileSaved, setProfileSaved] = useState(false);
	const [matches, setMatches] = useState<Match[]>([]);
	const [showMatches, setShowMatches] = useState(false);
	const [loadingMatches, setLoadingMatches] = useState(false);
	const [showProfile, setShowProfile] = useState(false);
	const [editingUserId, setEditingUserId] = useState(false);
	const [newUserId, setNewUserId] = useState("");
	const [userIdError, setUserIdError] = useState("");
	const [connectionUserId, setConnectionUserId] = useState("");
	const [connectionUserIdError, setConnectionUserIdError] = useState("");
	const [generatingUsername, setGeneratingUsername] = useState(false);

	// Debug useEffect to track insightResults changes
	useEffect(() => {
		console.log("=== DEBUG insightResults ===");
		console.log("insightResults:", insightResults);
		console.log("aiProfile:", insightResults.aiProfile);
		console.log("aiProfile type:", typeof insightResults.aiProfile);
		if (insightResults.aiProfile) {
			console.log("aiProfile keys:", Object.keys(insightResults.aiProfile));
			if (insightResults.aiProfile.traits) {
				console.log("traits:", insightResults.aiProfile.traits);
				console.log("traits type:", typeof insightResults.aiProfile.traits);
				console.log(
					"traits isArray:",
					Array.isArray(insightResults.aiProfile.traits)
				);
			}
		}
		console.log("=== END DEBUG ===");
	}, [insightResults]);

	// Debug useEffect to track formData changes
	useEffect(() => {
		console.log("🔧 FormData changed:", formData);
		console.log("🔧 ShowProfile:", showProfile);
	}, [formData, showProfile]);

	// Safe wrapper for setInsightResults to prevent error objects from being set
	const safeSetInsightResults = (
		data: Record<string, InsightItem[]> & { aiProfile?: AIProfile }
	) => {
		console.log("🔍 SAFE SET - Input data:", data);

		// If setting aiProfile, validate the structure
		if (data && data.aiProfile) {
			const aiProfile = data.aiProfile;
			console.log("🔍 SAFE SET - aiProfile data:", aiProfile);
			console.log("🔍 SAFE SET - aiProfile keys:", Object.keys(aiProfile));

			// Check if this looks like a database error object
			if (
				"code" in aiProfile &&
				"details" in aiProfile &&
				"message" in aiProfile
			) {
				console.error(
					"🚨 PREVENTED ERROR OBJECT from being set as aiProfile:",
					aiProfile
				);
				return; // Don't set the error object
			}

			// Check if it has the expected profile structure
			if (!aiProfile.headline || typeof aiProfile.headline !== "string") {
				console.error(
					"🚨 INVALID aiProfile structure, missing headline:",
					aiProfile
				);
				return; // Don't set invalid structure
			}
		}

		console.log("🔍 SAFE SET - Setting data:", data);
		setInsightResults(data);
	};

	const handleChange = (type: string, values: string[]) => {
		console.log("🔧 HandleChange called with type:", type, "values:", values);
		setFormData({ ...formData, [type]: values });
	};

	const handleLogin = async () => {
		if (!loginUserId.trim()) {
			setLoginError("Please enter your User ID");
			return;
		}

		setIsLoading(true);
		try {
			// Check if user exists and get their profile
			const response = await fetch("/api/get-user-profile", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: loginUserId }),
			});

			const result = await response.json();
			if (result.success && result.data) {
				setUserId(loginUserId);
				setUserProfileData(result.data);
				setIsLoggedIn(true);
				setShowLogin(false);
				setShowWelcome(false);
				setShowUserProfile(true);
				setLoginError("");
			} else {
				setLoginError(
					"User ID not found. Please check your ID or create a new profile."
				);
			}
		} catch (error) {
			console.error("Error during login:", error);
			setLoginError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const findMatches = async () => {
		setLoadingMatches(true);
		try {
			const response = await fetch("/api/find-matches", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: connectionUserId.trim() || userId }),
			});

			const result = await response.json();
			setMatches(result.data || []);
			setShowMatches(true);
			safeSetInsightResults({}); // Close the AI profile display
		} catch (error) {
			console.error("Error finding matches:", error);
		} finally {
			setLoadingMatches(false);
		}
	};

	const generateUsername = async () => {
		// Check if we have any interests to base the username on
		const hasInterests = Object.values(formData).some(
			(values) => values && values.length > 0
		);

		if (!hasInterests) {
			setConnectionUserIdError(
				"Please add some interests first to generate a username"
			);
			return;
		}

		setGeneratingUsername(true);
		setConnectionUserIdError("");

		try {
			// Prepare interests text for AI
			const interestsText = Object.entries(formData)
				.filter(([, values]) => Array.isArray(values) && values.length > 0)
				.map(
					([category, values]) =>
						`${category}: ${(values as string[]).join(", ")}`
				)
				.join("\n");

			const prompt = `
Based on the following user interests, generate a creative, unique username that reflects their personality and tastes. The username should be:
- 6-15 characters long
- Easy to remember and type
- Creative but not too obscure
- Reflects their interests/personality
- Uses alphanumeric characters only (no special characters except underscores)

USER INTERESTS:
${interestsText}

Please respond with ONLY the username, nothing else.`;

			const response = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					interests: formData,
					insights: {},
					prompt: prompt,
					generateUsernameOnly: true,
				}),
			});

			const result = await response.json();

			if (result.success && result.data) {
				// Extract username from the response
				let username = result.data;
				if (typeof result.data === "object" && result.data.username) {
					username = result.data.username;
				} else if (typeof result.data === "string") {
					username = result.data.trim();
				}

				// Clean the username (remove any extra text, quotes, etc.)
				username = username.replace(/[^a-zA-Z0-9_]/g, "").substring(0, 15);

				if (username) {
					setConnectionUserId(username);
				} else {
					setConnectionUserIdError(
						"Failed to generate username. Please try again."
					);
				}
			} else {
				setConnectionUserIdError(
					"Failed to generate username. Please try again."
				);
			}
		} catch (error) {
			console.error("Error generating username:", error);
			setConnectionUserIdError("Error generating username. Please try again.");
		} finally {
			setGeneratingUsername(false);
		}
	};

	const checkUserIdUnique = async (testUserId: string) => {
		try {
			const response = await fetch("/api/check-user-id", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: testUserId }),
			});

			const result = await response.json();
			return !result.exists;
		} catch (error) {
			console.error("Error checking user ID:", error);
			return false;
		}
	};

	const handleUserIdUpdate = async () => {
		if (!newUserId.trim()) {
			setUserIdError("User ID cannot be empty");
			return;
		}

		if (newUserId === userId) {
			setEditingUserId(false);
			setUserIdError("");
			return;
		}

		const isUnique = await checkUserIdUnique(newUserId);
		if (!isUnique) {
			setUserIdError("This User ID is already taken");
			return;
		}

		try {
			const response = await fetch("/api/update-user-id", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ oldUserId: userId, newUserId }),
			});

			const result = await response.json();
			if (result.success) {
				setUserId(newUserId);
				setEditingUserId(false);
				setUserIdError("");
			} else {
				setUserIdError(result.error || "Failed to update User ID");
			}
		} catch (error) {
			console.error("Error updating user ID:", error);
			setUserIdError("Failed to update User ID");
		}
	};

	const handleUpdateProfile = async () => {
		if (!userId) {
			console.error("No user ID available for update");
			return;
		}

		setIsLoading(true);

		try {
			const resolvedEntities: Record<string, InsightItem[]> = {};
			const insightMap: Record<string, InsightItem[]> = {};

			// Process Qloo API calls for updated interests
			for (const type of QLOO_TYPES) {
				const values = formData[type];
				if (!values || values.length === 0) continue;

				const typeEntities: InsightItem[] = [];
				const typeInsights: InsightItem[] = [];

				// Process each value in the array
				for (const value of values) {
					const res = await fetch("/api/qloo-search", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ query: value, type }),
					});

					const json = await res.json();
					const entity = json.data?.results?.[0];
					if (entity) {
						typeEntities.push(entity);

						if (entity?.entity_id) {
							const insightRes = await fetch("/api/qloo-insights", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									entityId: entity.entity_id,
									type,
									filterType: "brand",
									take: 5,
								}),
							});
							const insights = await insightRes.json();
							const insightResults = insights?.data?.results?.entities ?? [];
							if (Array.isArray(insightResults)) {
								typeInsights.push(...insightResults);
							}
						}
					}
				}

				if (typeEntities.length > 0) {
					resolvedEntities[type] = typeEntities;
					insightMap[type] = typeInsights;
				}
			}

			console.log("user_id", userId);
			// Update existing profile
			const updateResponse = await fetch("/api/save-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: userId,
					interests: formData,
					insights: insightMap,
				}),
			});

			const updateResult = await updateResponse.json();

			if (updateResult.success) {
				console.log("Profile updated successfully!", updateResult);

				setShowProfile(false);

				// Refresh user profile data if logged in
				if (isLoggedIn) {
					try {
						const response = await fetch("/api/get-user-profile", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ userId: userId }),
						});
						const result = await response.json();
						if (result.success && result.data) {
							setUserProfileData(result.data);
						}
						setShowUserProfile(true);
					} catch (error) {
						console.error("Error refreshing profile data:", error);
					}
				}

				// Optionally regenerate AI profile with updated interests
				try {
					const aiResponse = await fetch("/api/generate-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							interests: formData,
							insights: insightMap,
						}),
					});

					const aiResult = await aiResponse.json();
					console.log("🔍 UPDATE PROFILE - AI Result:", aiResult);
					if (aiResult.success && aiResult.data && aiResult.data.headline) {
						console.log(
							"🔍 UPDATE PROFILE - Setting valid aiProfile:",
							aiResult.data
						);
						safeSetInsightResults({ aiProfile: aiResult.data });
					} else {
						console.error("Invalid AI profile data:", aiResult);
					}
				} catch (aiError) {
					console.error("Error regenerating AI profile:", aiError);
				}
			} else {
				console.error("Failed to update profile:", updateResult.error);
				alert("Failed to update profile. Please try again.");
			}
		} catch (error) {
			console.error("Error during profile update:", error);
			alert("An error occurred while updating your profile. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("🔍 FORM SUBMIT STARTED");
		console.log("🔍 Form data:", formData);
		setIsLoading(true);

		try {
			const resolvedEntities: Record<string, InsightItem[]> = {};
			const insightMap: Record<string, InsightItem[]> = {};

			// Process Qloo API calls as before
			for (const type of QLOO_TYPES) {
				const values = formData[type];
				if (!values || values.length === 0) continue;

				const typeEntities: InsightItem[] = [];
				const typeInsights: InsightItem[] = [];

				// Process each value in the array
				for (const value of values) {
					const res = await fetch("/api/qloo-search", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ query: value, type }),
					});

					const json = await res.json();
					const entity = json.data?.results?.[0];
					if (entity) {
						typeEntities.push(entity);

						if (entity?.entity_id) {
							const insightRes = await fetch("/api/qloo-insights", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									entityId: entity.entity_id,
									type,
									filterType: "brand", // Can be made dynamic later
									take: 5,
								}),
							});
							const insights = await insightRes.json();
							console.log(
								`Qloo insights response for ${entity.entity_id}:`,
								insights
							);
							const insightResults = insights?.data?.results?.entities ?? [];
							// Ensure insightResults is an array before spreading
							if (Array.isArray(insightResults)) {
								typeInsights.push(...insightResults);
							} else {
								console.warn(
									`Insights results is not an array for ${type}:`,
									insightResults
								);
							}
						}
					}
				}

				if (typeEntities.length > 0) {
					resolvedEntities[type] = typeEntities;
					insightMap[type] = typeInsights;
				}
			}

			console.log("🔍 SUBMIT - User ID:", connectionUserId);

			// Save to database
			const saveResponse = await fetch("/api/save-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: connectionUserId || undefined, // Let the API generate one if not provided
					interests: formData,
					insights: insightMap,
				}),
			});

			const saveResult = await saveResponse.json();

			if (saveResult.success) {
				setUserId(saveResult.data.userId);
				setProfileSaved(true);
				console.log("Profile saved successfully!", saveResult);

				// Set logged-in state and load user profile data
				setIsLoggedIn(true);
				try {
					const profileResponse = await fetch("/api/get-user-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ userId: saveResult.data.userId }),
					});
					const profileResult = await profileResponse.json();
					if (profileResult.success && profileResult.data) {
						setUserProfileData(profileResult.data);
					}
				} catch (profileError) {
					console.error("Error loading user profile data:", profileError);
				}

				// Generate AI profile description
				try {
					const aiResponse = await fetch("/api/generate-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							interests: formData,
							insights: insightMap,
						}),
					});

					const aiResult = await aiResponse.json();
					console.log("🔍 SUBMIT - AI Result from generate-profile:", aiResult);
					if (aiResult.success && aiResult.data && aiResult.data.headline) {
						console.log(
							"🔍 SUBMIT - AI profile generated successfully:",
							aiResult.data
						);
						// Navigate directly to user profile instead of showing modal
						setShowUserProfile(true);
					} else {
						console.error(
							"Failed to generate AI profile or invalid data:",
							aiResult
						);
						// Navigate to user profile even if AI generation fails
						setShowUserProfile(true);
					}
				} catch (aiError) {
					console.error("Error generating AI profile:", aiError);
					// Navigate to user profile even if AI generation fails
					setShowUserProfile(true);
				}
			} else {
				console.error("Failed to save profile:", saveResult.error);
				alert("Failed to save profile. Please try again.");
			}
		} catch (error) {
			console.error("Error during profile creation:", error);
			alert("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
			{/* Global scrollbar theming */}
			<style
				dangerouslySetInnerHTML={{
					__html: `
					/* Global scrollbar styles */
					* {
						scrollbar-width: thin;
						scrollbar-color: rgb(71 85 105) rgb(30 41 59);
					}
					*::-webkit-scrollbar {
						width: 8px;
						height: 8px;
					}
					*::-webkit-scrollbar-track {
						background: rgb(30 41 59);
						border-radius: 4px;
					}
					*::-webkit-scrollbar-thumb {
						background: rgb(71 85 105);
						border-radius: 4px;
					}
					*::-webkit-scrollbar-thumb:hover {
						background: rgb(100 116 139);
					}
					*::-webkit-scrollbar-corner {
						background: rgb(30 41 59);
					}
				`,
				}}
			/>
			{/* Subtle background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<motion.div
					animate={{
						rotate: 360,
						scale: [1, 1.05, 1],
					}}
					transition={{
						duration: 30,
						repeat: Infinity,
						ease: "linear",
					}}
					className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-full blur-3xl"
				/>
				<motion.div
					animate={{
						rotate: -360,
						scale: [1, 1.08, 1],
					}}
					transition={{
						duration: 35,
						repeat: Infinity,
						ease: "linear",
					}}
					className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
				/>
			</div>

			{showWelcome ? (
				<WelcomeScreen
					onGetStarted={() => {
						// Clear form data for fresh profile creation
						setFormData({});
						setInsightResults({});
						setUserId("");
						setProfileSaved(false);
						setShowWelcome(false);
					}}
					onLogin={() => {
						setShowWelcome(false);
						setShowLogin(true);
					}}
				/>
			) : showLogin ? (
				<LoginScreen
					loginUserId={loginUserId}
					setLoginUserId={setLoginUserId}
					loginError={loginError}
					isLoading={isLoading}
					onLogin={handleLogin}
					onBack={() => {
						setShowLogin(false);
						setShowWelcome(true);
						setLoginError("");
						setLoginUserId("");
					}}
				/>
			) : showUserProfile ? (
				<UserProfileScreen
					userProfileData={userProfileData}
					userId={userId}
					findMatches={findMatches}
					loadingMatches={loadingMatches}
					matches={matches}
					onEditProfile={() => {
						console.log("🔧 Edit Profile clicked");
						console.log("🔧 User Profile Data:", userProfileData);
						if (userProfileData?.interests) {
							console.log(
								"🔧 Setting form data with interests:",
								userProfileData.interests
							);

							// Handle malformed interests data where categories might be undefined
							const cleanedInterests: Record<string, string[]> = {};

							// If there's an 'undefined' key, try to distribute the values
							if (
								userProfileData.interests.undefined &&
								Array.isArray(userProfileData.interests.undefined)
							) {
								console.log(
									"🔧 Found undefined key, distributing values:",
									userProfileData.interests.undefined
								);
								// For now, put them in 'artist' category as a fallback
								cleanedInterests.artist = userProfileData.interests.undefined;
							}

							// Copy over any properly categorized interests
							Object.entries(userProfileData.interests).forEach(
								([key, values]) => {
									if (key !== "undefined" && key && QLOO_TYPES.includes(key)) {
										cleanedInterests[key] = values;
									}
								}
							);

							console.log("🔧 Cleaned interests:", cleanedInterests);
							setFormData(cleanedInterests);
						} else {
							console.log("🔧 No interests found in user profile data");
						}
						setShowUserProfile(false);
						setShowProfile(true);
					}}
					onLogout={() => {
						// Clear all data for clean session
						setIsLoggedIn(false);
						setShowUserProfile(false);
						setShowWelcome(true);
						setUserId("");
						setUserProfileData(null);
						setFormData({});
						setInsightResults({});
						setMatches([]);
						setProfileSaved(false);
					}}
				/>
			) : (
				<ProfileFormScreen
					formData={formData}
					insightResults={insightResults}
					handleChange={handleChange}
					handleSubmit={handleSubmit}
					setInsightResults={safeSetInsightResults}
					isLoading={isLoading}
					profileSaved={profileSaved}
					userId={userId}
					findMatches={findMatches}
					loadingMatches={loadingMatches}
					matches={matches}
					showMatches={showMatches}
					setShowMatches={setShowMatches}
					setShowProfile={setShowProfile}
					connectionUserId={connectionUserId}
					setConnectionUserId={setConnectionUserId}
					connectionUserIdError={connectionUserIdError}
					setConnectionUserIdError={setConnectionUserIdError}
					generateUsername={generateUsername}
					generatingUsername={generatingUsername}
				/>
			)}

			{/* Profile Management Screen */}
			{showProfile && (
				<motion.div
					initial={{ opacity: 0, x: "100%" }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: "100%" }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex flex-col"
				>
					{/* Header */}
					<div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 p-4 flex-shrink-0">
						<div className="max-w-6xl mx-auto flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
									<span className="text-lg">⚙️</span>
								</div>
								<div>
									<h1 className="text-xl font-bold text-slate-200 font-heading">
										Profile Settings
									</h1>
									<p className="text-xs text-slate-400">
										Manage your profile and preferences
									</p>
								</div>
							</div>
							<Button
								size="lg"
								onClick={() => {
									setShowProfile(false);
									if (isLoggedIn && userProfileData) {
										setShowUserProfile(true);
									}
								}}
								className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
							>
								<span className="mr-2">←</span>
								Back to Profile
							</Button>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-4 min-h-0">
						<div className="max-w-6xl mx-auto space-y-6 pb-4">
							{/* Combined Profile Management Section */}
							<Card className="bg-slate-800/50 border-slate-700">
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-6">
										<div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
											<span className="text-xs">👤</span>
										</div>
										<h2 className="text-lg font-semibold text-slate-200 font-heading">
											Profile Management
										</h2>
									</div>

									{/* Personal Information Section */}
									<div className="space-y-6">
										<div>
											<h3 className="text-base font-medium text-slate-200 font-heading mb-4">
												Personal Information
											</h3>
											<div className="space-y-3">
												{editingUserId ? (
													<div className="space-y-3">
														<div>
															<Label
																htmlFor="user-id-input"
																className="text-slate-300 mb-2"
															>
																New User ID
															</Label>
															<Input
																id="user-id-input"
																value={newUserId}
																onChange={(e) => {
																	setNewUserId(e.target.value);
																	setUserIdError("");
																}}
																placeholder="Enter your new User ID"
																className="bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-500"
															/>
															{userIdError && (
																<p className="text-red-400 text-sm">
																	{userIdError}
																</p>
															)}
														</div>
														<div className="flex gap-2">
															<Button
																onClick={handleUserIdUpdate}
																size="sm"
																className="bg-blue-600 hover:bg-blue-500 text-white"
															>
																Save Changes
															</Button>
															<Button
																onClick={() => {
																	setEditingUserId(false);
																	setNewUserId("");
																	setUserIdError("");
																}}
																size="sm"
																className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
															>
																Cancel
															</Button>
														</div>
													</div>
												) : (
													<div className="space-y-3">
														<div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
															<p className="text-slate-300 font-mono text-lg">
																{userId}
															</p>
															<p className="text-sm text-slate-400 mt-1">
																This is your unique identifier
															</p>
														</div>
													</div>
												)}
											</div>
										</div>

										{/* Interests Section */}
										<div className="border-t border-slate-700 pt-6">
											<div className="flex items-center gap-3 mb-4">
												<div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
													<span className="text-xs">🎯</span>
												</div>
												<h3 className="text-base font-medium text-slate-200 font-heading">
													Update Your Interests
												</h3>
											</div>
											<p className="text-slate-400 mb-4">
												Modify your interests to find better matches
											</p>

											<div className="space-y-4">
												{QLOO_TYPES.map((type) => (
													<div
														key={type}
														className="space-y-2"
													>
														<Label
															htmlFor={type}
															className="text-sm font-medium text-slate-300 flex items-center gap-2"
														>
															{getTypeEmoji(type)}
															<span className="capitalize">
																{type.replace("_", " ")}
															</span>
														</Label>
														<ChipInput
															id={type}
															values={formData[type] || []}
															onChange={(values) => handleChange(type, values)}
															placeholder={getPlaceholder(type)}
															className="w-full"
														/>
													</div>
												))}
											</div>

											<div className="mt-6 flex gap-4">
												<Button
													onClick={handleUpdateProfile}
													disabled={isLoading}
													className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
												>
													{isLoading ? (
														<>
															<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
															Updating Profile...
														</>
													) : (
														<>
															<span className="mr-2">🔄</span>
															Update Profile
														</>
													)}
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
}

const WelcomeScreen = ({
	onGetStarted,
	onLogin,
}: {
	onGetStarted: () => void;
	onLogin: () => void;
}) => {
	return (
		<div className="h-full flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-4xl mx-auto w-full justify-center"
			>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className="text-center mb-12"
				>
					<h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-heading">
						KindredAI
					</h1>
					<p className="text-xl md:text-2xl text-slate-300 mb-4 font-light font-sans">
						AI that finds your kind
					</p>
					<p className="text-lg text-slate-400 max-w-2xl mx-auto font-sans">
						Connect with like-minded people who share your passions, discover
						new communities, and build meaningful friendships.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="flex-1 max-w-3xl mx-auto w-full"
				>
					<Card className="shadow-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm">
						<CardContent className="p-10">
							<div className="grid md:grid-cols-3 gap-8 mb-10">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.6, duration: 0.5 }}
									className="text-center group"
								>
									<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
										<span className="text-2xl">🎯</span>
									</div>
									<h3 className="text-lg font-semibold text-slate-200 mb-2">
										Smart Matching
									</h3>
									<p className="text-sm text-slate-400">
										Our AI analyzes your interests to find people with genuine
										compatibility
									</p>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.7, duration: 0.5 }}
									className="text-center group"
								>
									<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
										<span className="text-2xl">🌟</span>
									</div>
									<h3 className="text-lg font-semibold text-slate-200 mb-2">
										Discover Communities
									</h3>
									<p className="text-sm text-slate-400">
										Join groups and events centered around your favorite topics
										and hobbies
									</p>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.8, duration: 0.5 }}
									className="text-center group"
								>
									<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
										<span className="text-2xl">🤝</span>
									</div>
									<h3 className="text-lg font-semibold text-slate-200 mb-2">
										Real Connections
									</h3>
									<p className="text-sm text-slate-400">
										Build authentic friendships based on shared passions, not
										superficial swipes
									</p>
								</motion.div>
							</div>

							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.0, duration: 0.4 }}
								className="text-center"
							>
								<div className="space-y-4">
									<Button
										onClick={onGetStarted}
										size="lg"
										className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg text-white transform hover:scale-105"
									>
										Get Started ✨
									</Button>
									<p className="text-xs text-slate-500">
										Takes less than 2 minutes to set up your profile
									</p>

									<div className="flex items-center gap-3 my-6">
										<div className="flex-1 h-px bg-slate-700"></div>
										<span className="text-sm text-slate-400">or</span>
										<div className="flex-1 h-px bg-slate-700"></div>
									</div>

									<Button
										onClick={onLogin}
										size="lg"
										className="px-10 py-4 text-lg font-semibold border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-500 transition-all duration-300"
									>
										Login with User ID 🔑
									</Button>
									<p className="text-xs text-slate-500">
										Already have an account? Sign in with your User ID
									</p>
								</div>
							</motion.div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
};

const LoginScreen = ({
	loginUserId,
	setLoginUserId,
	loginError,
	isLoading,
	onLogin,
	onBack,
}: {
	loginUserId: string;
	setLoginUserId: (value: string) => void;
	loginError: string;
	isLoading: boolean;
	onLogin: () => void;
	onBack: () => void;
}) => {
	return (
		<div className="h-full flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-2xl mx-auto w-full justify-center"
			>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className="text-center mb-8"
				>
					<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
						Welcome Back
					</h1>
					<p className="text-lg text-slate-300 mb-2">
						Sign in with your User ID
					</p>
					<p className="text-slate-400">
						Continue where you left off and connect with your tribe
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="w-full"
				>
					<Card className="shadow-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm">
						<CardContent className="p-8">
							<div className="space-y-6">
								<div className="space-y-2">
									<Label
										htmlFor="login-user-id"
										className="text-slate-300 text-base"
									>
										User ID
									</Label>
									<Input
										id="login-user-id"
										type="text"
										value={loginUserId}
										onChange={(e) => {
											setLoginUserId(e.target.value);
										}}
										placeholder="Enter your User ID"
										className="h-12 bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
										onKeyDown={(e) => {
											if (e.key === "Enter" && !isLoading) {
												onLogin();
											}
										}}
									/>
									{loginError && (
										<p className="text-red-400 text-sm mt-2">{loginError}</p>
									)}
								</div>

								<div className="space-y-4">
									<Button
										onClick={onLogin}
										disabled={isLoading}
										className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all duration-300"
									>
										{isLoading ? (
											<>
												<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
												Signing In...
											</>
										) : (
											"Sign In 🔑"
										)}
									</Button>

									<Button
										onClick={onBack}
										className="w-full h-12 text-lg border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-500 transition-all"
									>
										Back to Home
									</Button>
								</div>

								<div className="text-center pt-4 border-t border-slate-700">
									<p className="text-sm text-slate-400">
										Don&apos;t have a User ID?{" "}
										<button
											onClick={onBack}
											className="text-blue-400 hover:text-blue-300 underline"
										>
											Create a new profile
										</button>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
};

interface UserProfileData {
	profile: {
		user_id: string;
		name?: string;
		location?: string;
		bio?: string;
		ai_profile?: string;
	};
	interests: Record<string, string[]>;
	insights: InsightItem[];
}

const UserProfileScreen = ({
	userProfileData,
	userId,
	findMatches,
	loadingMatches,
	matches,
	onEditProfile,
	onLogout,
}: {
	userProfileData: UserProfileData | null;
	userId: string;
	findMatches: () => void;
	loadingMatches: boolean;
	matches: Match[];
	onEditProfile: () => void;
	onLogout: () => void;
}) => {
	const [tasteProfile, setTasteProfile] = useState<AIProfile | null>(null);
	const [loadingTasteProfile, setLoadingTasteProfile] = useState(false);
	const [showMatches, setShowMatches] = useState(false);

	// Handle finding matches within UserProfileScreen
	const handleFindMatches = async () => {
		try {
			await findMatches();
			setShowMatches(true);
		} catch (error) {
			console.error("Error finding matches:", error);
		}
	};

	// Load taste profile on mount
	useEffect(() => {
		const loadTasteProfile = async () => {
			try {
				const response = await fetch("/api/get-taste-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId }),
				});
				const result = await response.json();
				if (result.success && result.data) {
					setTasteProfile(result.data);
				}
			} catch (error) {
				console.error("Error loading taste profile:", error);
			}
		};

		if (userId) {
			loadTasteProfile();
		}
	}, [userId]);

	// Generate taste profile function
	const generateTasteProfile = useCallback(async () => {
		if (!userProfileData?.interests) {
			console.log("No interests found for profile generation");
			return;
		}

		setLoadingTasteProfile(true);
		try {
			const resolvedEntities: Record<string, InsightItem[]> = {};
			const insightMap: Record<string, InsightItem[]> = {};

			// Process Qloo API calls for current interests
			for (const [type, values] of Object.entries(userProfileData.interests)) {
				if (!values || values.length === 0) continue;

				const typeEntities: InsightItem[] = [];
				const typeInsights: InsightItem[] = [];

				for (const value of values) {
					const res = await fetch("/api/qloo-search", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ query: value, type }),
					});

					const json = await res.json();
					const entity = json.data?.results?.[0];
					if (entity) {
						typeEntities.push(entity);

						if (entity?.entity_id) {
							const insightRes = await fetch("/api/qloo-insights", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									entityId: entity.entity_id,
									type,
									filterType: "brand",
									take: 5,
								}),
							});
							const insights = await insightRes.json();
							const insightResults = insights?.data?.results?.entities ?? [];
							if (Array.isArray(insightResults)) {
								typeInsights.push(...insightResults);
							}
						}
					}
				}

				if (typeEntities.length > 0) {
					resolvedEntities[type] = typeEntities;
					insightMap[type] = typeInsights;
				}
			}

			// Generate AI profile
			const aiResponse = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					interests: userProfileData.interests,
					insights: insightMap,
				}),
			});

			const aiResult = await aiResponse.json();
			if (aiResult.success && aiResult.data && aiResult.data.headline) {
				setTasteProfile(aiResult.data);

				// Save to database
				const saveResponse = await fetch("/api/save-taste-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						tasteProfile: aiResult.data,
					}),
				});

				const saveResult = await saveResponse.json();
				if (!saveResult.success) {
					console.error("Failed to save taste profile:", saveResult.error);
				}
			}
		} catch (error) {
			console.error("Error generating taste profile:", error);
		} finally {
			setLoadingTasteProfile(false);
		}
	}, [userProfileData?.interests, userId]);
	return (
		<div className="h-screen flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0"
			>
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					className="text-center mb-8"
				>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
								👤
							</div>
							<div className="text-left">
								<h1 className="text-3xl font-bold text-slate-200">
									Your Profile
								</h1>
								<p className="text-slate-400">ID: {userId}</p>
							</div>
						</div>
						<Button
							onClick={onLogout}
							className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-500"
						>
							Logout
						</Button>
					</div>
				</motion.div>

				<Card className="shadow-xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm flex-1 min-h-0">
					<CardContent className="p-8 h-full flex flex-col">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.6 }}
							className="flex-1 flex flex-col min-h-0"
						>
							{/* Scrollable Content Area */}
							<div className="flex-1 overflow-y-auto pr-2 mb-4">
								{showMatches ? (
									/* Matches View */
									<>
										<div className="flex items-center justify-between mb-6">
											<h2 className="text-2xl font-bold text-slate-200 font-heading">
												Your Matches 🤝
											</h2>
											<div className="text-slate-400 text-sm">
												{matches.length} matches found
											</div>
										</div>

										<div className="flex-1 overflow-y-auto pr-2 mb-6">
											{matches.length > 0 ? (
												<div className="space-y-4">
													{matches.map((match, index) => (
														<div
															key={index}
															className="p-6 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all duration-200"
														>
															<div className="flex items-center justify-between mb-4">
																<div className="flex items-center gap-3">
																	<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-lg">
																		👤
																	</div>
																	<div>
																		<h3 className="font-semibold text-slate-200">
																			{match.user.name || match.user.user_id}
																		</h3>
																		<p className="text-slate-400 text-sm">
																			ID: {match.user.user_id}
																		</p>
																	</div>
																</div>
																<div className="text-right">
																	<div className="text-lg font-bold text-green-400">
																		{Math.round(match.matchScore * 100)}%
																	</div>
																	<div className="text-xs text-slate-400">
																		compatibility
																	</div>
																</div>
															</div>

															{match.sharedFields &&
																match.sharedFields.length > 0 && (
																	<div className="space-y-2">
																		<h4 className="text-sm font-medium text-slate-300 font-heading">
																			Shared Interests
																		</h4>
																		<div className="flex flex-wrap gap-2">
																			{match.sharedFields
																				.slice(0, 6)
																				.map(
																					(interest: string, idx: number) => (
																						<span
																							key={idx}
																							className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs border border-blue-500/30"
																						>
																							{interest}
																						</span>
																					)
																				)}
																			{match.sharedFields.length > 6 && (
																				<span className="px-2 py-1 bg-slate-600 text-slate-300 rounded-full text-xs">
																					+{match.sharedFields.length - 6} more
																				</span>
																			)}
																		</div>
																	</div>
																)}
														</div>
													))}
												</div>
											) : (
												<div className="flex-1 flex items-center justify-center">
													<div className="text-center">
														<div className="text-6xl mb-4">🔍</div>
														<h3 className="text-xl font-semibold text-slate-200 mb-2 font-heading">
															No matches found
														</h3>
														<p className="text-slate-400">
															Try adding more interests to find better matches
														</p>
													</div>
												</div>
											)}
										</div>
									</>
								) : (
									/* Profile View */
									<>
										{/* Profile Info */}
										<div className="space-y-6 flex-1 flex flex-col min-h-0 mb-6">
											{userProfileData?.profile?.ai_profile && (
												<div className="p-6 rounded-lg border border-slate-600/50">
													<h3 className="text-xl font-semibold text-slate-200 mb-3 font-heading">
														Your Vibe
													</h3>
													<p className="text-slate-300 leading-relaxed">
														{
															JSON.parse(userProfileData.profile.ai_profile)
																.description
														}
													</p>
												</div>
											)}

											{/* Taste Profile Section */}
											<div className="p-6 rounded-lg flex-1 flex flex-col">
												<div className="flex items-center justify-between mb-4">
													<div className="flex items-center gap-3">
														<div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
															<span className="text-xs">✨</span>
														</div>
														<h3 className="text-xl font-semibold text-slate-200 font-heading">
															Your Taste Profile
														</h3>
														{loadingTasteProfile && (
															<div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
														)}
													</div>
													{tasteProfile && (
														<Button
															onClick={generateTasteProfile}
															disabled={loadingTasteProfile}
															size="sm"
															className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white"
														>
															{loadingTasteProfile ? (
																<div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-2"></div>
															) : (
																<span className="mr-2">🔄</span>
															)}
															Refresh
														</Button>
													)}
												</div>

												<div
													className="flex-1 overflow-y-auto pr-2 taste-profile-scroll"
													style={{
														scrollbarWidth: "thin",
														scrollbarColor: "rgb(71 85 105) rgb(30 41 59)",
													}}
												>
													<style
														dangerouslySetInnerHTML={{
															__html: `
													.taste-profile-scroll::-webkit-scrollbar {
														width: 6px;
													}
													.taste-profile-scroll::-webkit-scrollbar-track {
														background: rgb(30 41 59);
														border-radius: 3px;
													}
													.taste-profile-scroll::-webkit-scrollbar-thumb {
														background: rgb(71 85 105);
														border-radius: 3px;
													}
													.taste-profile-scroll::-webkit-scrollbar-thumb:hover {
														background: rgb(100 116 139);
													}
												`,
														}}
													/>
													{tasteProfile ? (
														<div className="space-y-4">
															{/* Headline */}
															<div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
																<h4 className="text-blue-400 font-semibold mb-2">
																	Headline
																</h4>
																<p className="text-slate-200">
																	{tasteProfile.headline}
																</p>
															</div>

															{/* Description */}
															<div className="p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
																<h4 className="text-green-400 font-semibold mb-2">
																	Description
																</h4>
																<p className="text-slate-200">
																	{tasteProfile.description}
																</p>
															</div>

															{/* Vibe */}
															{tasteProfile.vibe && (
																<div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
																	<h4 className="text-purple-400 font-semibold mb-2">
																		Vibe
																	</h4>
																	<p className="text-slate-200">
																		{tasteProfile.vibe}
																	</p>
																</div>
															)}

															{/* Traits */}
															{tasteProfile.traits &&
																Array.isArray(tasteProfile.traits) && (
																	<div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
																		<h4 className="text-orange-400 font-semibold mb-2">
																			Key Traits
																		</h4>
																		<div className="flex flex-wrap gap-2">
																			{tasteProfile.traits.map(
																				(trait: string, index: number) => (
																					<span
																						key={index}
																						className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm"
																					>
																						{trait}
																					</span>
																				)
																			)}
																		</div>
																	</div>
																)}

															{/* Compatibility */}
															{tasteProfile.compatibility && (
																<div className="p-4 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-lg border border-indigo-500/20">
																	<h4 className="text-indigo-400 font-semibold mb-2">
																		Compatibility
																	</h4>
																	<p className="text-slate-200">
																		{tasteProfile.compatibility}
																	</p>
																</div>
															)}
														</div>
													) : (
														<div className="text-center py-8">
															<p className="text-slate-400 mb-4">
																{loadingTasteProfile
																	? "Generating your taste profile..."
																	: "Your taste profile will appear here once generated"}
															</p>
															{!loadingTasteProfile &&
																userProfileData?.interests &&
																Object.keys(userProfileData.interests).length >
																	0 && (
																	<Button
																		onClick={generateTasteProfile}
																		className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white"
																	>
																		<span className="mr-2">✨</span>
																		Generate Taste Profile
																	</Button>
																)}
														</div>
													)}
												</div>
											</div>
										</div>
									</>
								)}
							</div>

							{/* Fixed Action Buttons */}
							<div className="flex gap-4 pt-4 border-t border-slate-700 flex-shrink-0">
								{showMatches ? (
									<Button
										onClick={() => setShowMatches(false)}
										className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-lg font-semibold text-white"
									>
										<span className="mr-2">←</span>
										Go to Profile
									</Button>
								) : (
									<>
										<Button
											onClick={handleFindMatches}
											disabled={loadingMatches}
											className="flex-1 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-xl font-bold text-white shadow-2xl border-2 border-blue-400/50 hover:border-blue-300/70 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-blue-500/25"
										>
											{loadingMatches ? (
												<>
													<div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full mr-3"></div>
													<span className="text-xl">
														Finding Your Perfect Matches...
													</span>
												</>
											) : (
												<>
													<span className="text-2xl mr-3">🤝</span>
													<span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-heading">
														Find Your Tribe
													</span>
													<span className="text-2xl ml-3">✨</span>
												</>
											)}
										</Button>
										<Button
											onClick={onEditProfile}
											className="px-8 h-16 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-500 transition-all duration-200"
										>
											<span className="mr-2 text-lg">✏️</span>
											<span className="text-lg">Edit Profile</span>
										</Button>
									</>
								)}
							</div>
						</motion.div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
};

interface ProfileFormScreenProps {
	formData: Record<string, string[]>;
	insightResults: Record<string, InsightItem[]> & { aiProfile?: AIProfile };
	handleChange: (type: string, values: string[]) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	setInsightResults: (
		results: Record<string, InsightItem[]> & { aiProfile?: AIProfile }
	) => void;
	isLoading: boolean;
	profileSaved: boolean;
	userId: string;
	findMatches: () => Promise<void>;
	loadingMatches: boolean;
	matches: Match[];
	showMatches: boolean;
	setShowMatches: (show: boolean) => void;
	setShowProfile: (show: boolean) => void;
	connectionUserId: string;
	setConnectionUserId: (value: string) => void;
	connectionUserIdError: string;
	setConnectionUserIdError: (error: string) => void;
	generateUsername: () => Promise<void>;
	generatingUsername: boolean;
}

const ProfileFormScreen = ({
	formData,
	insightResults,
	handleChange,
	handleSubmit,
	setInsightResults,
	isLoading,
	profileSaved,
	userId,
	findMatches,
	loadingMatches,
	matches,
	showMatches,
	setShowMatches,
	setShowProfile,
	connectionUserId,
	setConnectionUserId,
	connectionUserIdError,
	setConnectionUserIdError,
	generateUsername,
	generatingUsername,
}: ProfileFormScreenProps) => {
	return (
		<div className="h-full flex flex-col relative z-10 p-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="flex-1 flex flex-col max-w-7xl mx-auto w-full"
			>
				<motion.form
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
					onSubmit={handleSubmit}
					className="flex-1 flex flex-col min-h-0"
				>
					<Card className="shadow-xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm flex-1 flex flex-col min-h-0">
						<CardContent className="p-8 flex-1 flex flex-col min-h-0">
							<div className="text-center mb-6 flex-shrink-0">
								<h2 className="text-2xl font-semibold text-slate-200 mb-2 font-heading">
									Build Your KindredAI Profile
								</h2>
								<p className="text-sm text-slate-400">
									Share your interests so we can find your perfect connections
								</p>
							</div>

							<div
								className="flex-1 overflow-y-auto pr-1 min-h-0 max-h-[calc(100vh-400px)] scrollbar-container"
								style={{
									scrollbarWidth: "thin",
									scrollbarColor: "rgb(71 85 105) rgb(30 41 59)",
								}}
							>
								<style
									dangerouslySetInnerHTML={{
										__html: `
										.scrollbar-container::-webkit-scrollbar {
											width: 6px;
										}
										.scrollbar-container::-webkit-scrollbar-track {
											background: rgb(30 41 59);
											border-radius: 3px;
										}
										.scrollbar-container::-webkit-scrollbar-thumb {
											background: rgb(71 85 105);
											border-radius: 3px;
										}
										.scrollbar-container::-webkit-scrollbar-thumb:hover {
											background: rgb(100 116 139);
										}
									`,
									}}
								/>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4 pr-1">
									{QLOO_TYPES.map((type, index) => (
										<motion.div
											key={type}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												delay: 0.4 + index * 0.03,
												duration: 0.4,
											}}
											className="space-y-3 group"
										>
											<Label
												htmlFor={type}
												className="capitalize text-sm font-semibold text-slate-300 flex items-center gap-2 group-hover:text-blue-400 transition-colors"
											>
												<span className="text-base">{getTypeEmoji(type)}</span>
												{type.replace("_", " ")}
											</Label>
											<ChipInput
												id={type}
												placeholder={`e.g. ${getPlaceholder(type)}`}
												values={formData[type] || []}
												onChange={(values) => handleChange(type, values)}
											/>
										</motion.div>
									))}
								</div>
							</div>

							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.8, duration: 0.4 }}
								className="text-center mt-4 pt-4 border-t border-slate-700 flex-shrink-0"
							>
								{/* Username Input for Finding Connections */}
								<div className="mb-4 max-w-md mx-auto">
									<Label
										htmlFor="connectionUserId"
										className="text-sm font-medium text-slate-300 mb-2 block"
									>
										Enter Username to Find Connections
									</Label>
									<div className="relative flex gap-2">
										<Input
											id="connectionUserId"
											type="text"
											placeholder="Enter username..."
											value={connectionUserId}
											onChange={(e) => {
												setConnectionUserId(e.target.value);
												setConnectionUserIdError(""); // Clear error when typing
											}}
											className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pr-10"
											disabled={isLoading || generatingUsername}
										/>
										<Button
											type="button"
											onClick={generateUsername}
											disabled={isLoading || generatingUsername}
											className="px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
											title="Generate username from interests"
										>
											{generatingUsername ? (
												<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
											) : (
												"✨"
											)}
										</Button>
										{generatingUsername && (
											<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
												<div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
											</div>
										)}
									</div>
									{connectionUserIdError && (
										<p className="text-red-400 text-xs mt-1">
											{connectionUserIdError}
										</p>
									)}
								</div>

								<Button
									type="submit"
									size="lg"
									disabled={
										isLoading || !connectionUserId.trim() || generatingUsername
									}
									className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg text-white disabled:opacity-50"
								>
									{isLoading ? (
										<>
											<motion.div
												animate={{ rotate: 360 }}
												transition={{
													duration: 1,
													repeat: Infinity,
													ease: "linear",
												}}
												className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
											/>
											Creating Your Profile...
										</>
									) : profileSaved ? (
										<>Profile Saved! View Results ✨</>
									) : (
										<>Find My Connections ✨</>
									)}
								</Button>
								{userId && (
									<p className="text-xs text-slate-400 mt-2">
										Your profile ID: {userId}
									</p>
								)}
							</motion.div>
						</CardContent>
					</Card>
				</motion.form>

				{/* Display AI Profile in overlay */}
				{Object.keys(insightResults).length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setInsightResults({})}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3 }}
							className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-6 border-b border-slate-700 flex items-center justify-between">
								<h2 className="text-2xl font-bold text-slate-200">
									Your Taste Profile
								</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setInsightResults({})}
									className="text-slate-400 hover:text-slate-200"
								>
									✕
								</Button>
							</div>

							<div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
								{insightResults.aiProfile &&
								typeof insightResults.aiProfile === "object" &&
								insightResults.aiProfile.headline &&
								typeof insightResults.aiProfile.headline === "string" ? (
									<div className="space-y-6">
										{/* Main Profile Section */}
										<div className="text-center space-y-4">
											<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-3xl mb-4">
												✨
											</div>
											<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
												{insightResults.aiProfile.headline}
											</h1>
											{insightResults.aiProfile.vibe &&
												typeof insightResults.aiProfile.vibe === "string" && (
													<div className="inline-block px-4 py-2 bg-slate-700 rounded-full">
														<span className="text-sm font-medium text-blue-300">
															{insightResults.aiProfile.vibe}
														</span>
													</div>
												)}
										</div>

										{/* Description */}
										{insightResults.aiProfile.description &&
											typeof insightResults.aiProfile.description ===
												"string" && (
												<Card className="bg-slate-700 border-slate-600">
													<CardContent className="p-6">
														<h3 className="text-lg font-semibold text-slate-200 mb-3">
															About You
														</h3>
														<p className="text-slate-300 leading-relaxed">
															{insightResults.aiProfile.description}
														</p>
													</CardContent>
												</Card>
											)}

										{/* Traits */}
										<Card className="bg-slate-700 border-slate-600">
											<CardContent className="p-6">
												<h3 className="text-lg font-semibold text-slate-200 mb-4">
													Your Vibe
												</h3>
												<div className="flex flex-wrap gap-2">
													{insightResults.aiProfile.traits &&
													Array.isArray(insightResults.aiProfile.traits) ? (
														insightResults.aiProfile.traits.map(
															(trait: string, index: number) => (
																<span
																	key={index}
																	className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30"
																>
																	{trait}
																</span>
															)
														)
													) : (
														<span className="text-slate-400">
															No traits available
														</span>
													)}
												</div>
											</CardContent>
										</Card>

										{/* Compatibility */}
										{insightResults.aiProfile.compatibility &&
											typeof insightResults.aiProfile.compatibility ===
												"string" && (
												<Card className="bg-slate-700 border-slate-600">
													<CardContent className="p-6">
														<h3 className="text-lg font-semibold text-slate-200 mb-3">
															Who You&apos;ll Vibe With
														</h3>
														<p className="text-slate-300 leading-relaxed">
															{insightResults.aiProfile.compatibility}
														</p>
													</CardContent>
												</Card>
											)}

										{/* Action Buttons */}
										<div className="space-y-4 pt-4">
											<div className="flex gap-4">
												<Button
													onClick={findMatches}
													disabled={
														loadingMatches ||
														!connectionUserId.trim() ||
														generatingUsername
													}
													className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
												>
													{loadingMatches ? (
														<>
															<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
															Finding Your Tribe...
														</>
													) : (
														"Find My Tribe 🤝"
													)}
												</Button>
											</div>
										</div>
									</div>
								) : insightResults.aiProfile ? (
									<div className="text-center py-8">
										<div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
											<h3 className="text-lg font-semibold text-red-300 mb-2">
												Error Loading Profile
											</h3>
											<p className="text-red-400 text-sm">
												There was an issue generating your profile. Please try
												again.
											</p>
											<pre className="text-xs text-red-500 mt-4 overflow-auto max-h-32">
												{JSON.stringify(insightResults.aiProfile, null, 2)}
											</pre>
										</div>
									</div>
								) : (
									<div className="text-center py-8">
										<div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
										<p className="text-slate-400">
											Generating your unique profile...
										</p>
									</div>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}

				{/* Display Matches in overlay */}
				{showMatches && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setShowMatches(false)}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.3 }}
							className="bg-slate-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-6 border-b border-slate-700 flex items-center justify-between">
								<h2 className="text-2xl font-bold text-slate-200">
									Your Taste Tribe ✨
								</h2>
								<div className="flex items-center gap-3">
									<Button
										size="sm"
										onClick={() => {
											setShowMatches(false);
											setShowProfile(true);
										}}
										className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
									>
										<span className="mr-1">⚙️</span>
										Go to Profile
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowMatches(false)}
										className="text-slate-400 hover:text-slate-200"
									>
										✕
									</Button>
								</div>
							</div>

							<div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
								{matches.length > 0 ? (
									<div className="space-y-6">
										<div className="text-center mb-6">
											<p className="text-slate-300">
												Found{" "}
												<span className="font-bold text-blue-400">
													{matches.length}
												</span>{" "}
												people who share your vibe
											</p>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{matches.map((match) => (
												<Card
													key={match.user.user_id}
													className="bg-slate-700 border-slate-600 hover:border-slate-500 transition-colors"
												>
													<CardContent className="p-6">
														<div className="flex items-start justify-between mb-4">
															<div>
																<h3 className="text-lg font-semibold text-slate-200 mb-1">
																	{match.user.name}
																</h3>
																<p className="text-sm text-slate-400 mb-2">
																	{match.user.location}
																</p>
																<div className="flex items-center gap-2">
																	<div className="text-sm font-medium text-blue-400">
																		{(match.matchScore * 100).toFixed(0)}% match
																	</div>
																	<div className="flex text-yellow-400">
																		{[...Array(5)].map((_, i) => (
																			<span
																				key={i}
																				className={
																					i < Math.floor(match.matchScore * 5)
																						? "text-yellow-400"
																						: "text-slate-600"
																				}
																			>
																				★
																			</span>
																		))}
																	</div>
																</div>
															</div>
														</div>

														<p className="text-sm text-slate-300 mb-4 line-clamp-2">
															{match.user.bio}
														</p>

														{/* Shared interests */}
														<div className="space-y-3">
															<h4 className="text-sm font-medium text-slate-300">
																Shared Vibes:
															</h4>
															<div className="flex flex-wrap gap-2">
																{match.sharedFields.slice(0, 4).map((field) => (
																	<span
																		key={field}
																		className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30"
																	>
																		{field.replace("_", " ")}
																	</span>
																))}
																{match.sharedFields.length > 4 && (
																	<span className="px-2 py-1 bg-slate-600 text-slate-300 rounded-full text-xs">
																		+{match.sharedFields.length - 4} more
																	</span>
																)}
															</div>

															{/* Sample shared entities */}
															{Object.entries(match.sharedEntities)
																.slice(0, 2)
																.map(([type, entities]) => (
																	<div
																		key={type}
																		className="text-xs"
																	>
																		<span className="text-slate-400 capitalize">
																			{type}:
																		</span>
																		<span className="text-slate-300 ml-1">
																			{entities.slice(0, 3).join(", ")}
																			{entities.length > 3 &&
																				` +${entities.length - 3} more`}
																		</span>
																	</div>
																))}
														</div>

														{/* Connect button */}
														<div className="mt-4">
															<Button
																size="sm"
																className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
															>
																Connect 💫
															</Button>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									</div>
								) : (
									<div className="text-center py-12">
										<div className="text-6xl mb-4">🔍</div>
										<h3 className="text-xl font-semibold text-slate-200 mb-2">
											No matches found yet
										</h3>
										<p className="text-slate-400 max-w-md mx-auto">
											Be one of the first! More users are joining every day, and
											we&apos;ll notify you when we find your tribe.
										</p>
									</div>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
};
