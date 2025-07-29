"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
		const separators = [",", " ", "\t"];

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
	const [formData, setFormData] = useState<Record<string, string[]>>({});
	const [insightResults, setInsightResults] = useState<
		Record<string, InsightItem[]>
	>({});
	const [userId, setUserId] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [profileSaved, setProfileSaved] = useState(false);

	const handleChange = (type: string, values: string[]) => {
		setFormData({ ...formData, [type]: values });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
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
							const insightResults = insights?.data?.results ?? [];
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

			console.log("Resolved Entities:", resolvedEntities);
			console.log("Qloo Insights:", insightMap);

			// Save to database
			const saveResponse = await fetch("/api/save-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: userId || undefined, // Let the API generate one if not provided
					interests: formData,
					insights: insightMap,
				}),
			});

			const saveResult = await saveResponse.json();

			if (saveResult.success) {
				setUserId(saveResult.data.userId);
				setProfileSaved(true);
				console.log("Profile saved successfully!", saveResult);

				// Show insights
				setInsightResults(insightMap);
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
				<WelcomeScreen onGetStarted={() => setShowWelcome(false)} />
			) : (
				<ProfileFormScreen
					formData={formData}
					insightResults={insightResults}
					handleChange={handleChange}
					handleSubmit={handleSubmit}
					setInsightResults={setInsightResults}
					isLoading={isLoading}
					profileSaved={profileSaved}
					userId={userId}
				/>
			)}
		</div>
	);
}

const WelcomeScreen = ({ onGetStarted }: { onGetStarted: () => void }) => {
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
					<h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
						Vibe
					</h1>
					<p className="text-xl md:text-2xl text-slate-300 mb-4 font-light">
						Find your tribe through shared interests
					</p>
					<p className="text-lg text-slate-400 max-w-2xl mx-auto">
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
								<Button
									onClick={onGetStarted}
									size="lg"
									className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg text-white transform hover:scale-105"
								>
									Get Started ✨
								</Button>
								<p className="text-xs text-slate-500 mt-4">
									Takes less than 2 minutes to set up your profile
								</p>
							</motion.div>
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
};

interface ProfileFormScreenProps {
	formData: Record<string, string[]>;
	insightResults: Record<string, InsightItem[]>;
	handleChange: (type: string, values: string[]) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	setInsightResults: (results: Record<string, InsightItem[]>) => void;
	isLoading: boolean;
	profileSaved: boolean;
	userId: string;
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
								<h2 className="text-2xl font-semibold text-slate-200 mb-2">
									Build Your Taste Profile
								</h2>
								<p className="text-sm text-slate-400">
									Share your interests so we can find your perfect connections
								</p>
							</div>

							<div
								className="flex-1 overflow-y-auto pr-1 min-h-0 max-h-[calc(100vh-320px)] scrollbar-container"
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
								<Button
									type="submit"
									size="lg"
									disabled={isLoading}
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

				{/* Display insights in overlay */}
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
							className="bg-slate-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
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

							<div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{Object.entries(insightResults).map(([type, results]) => (
										<div
											key={type}
											className="space-y-3"
										>
											<h3 className="text-lg font-semibold capitalize text-slate-300 flex items-center gap-2">
												{getTypeEmoji(type)}
												{type.replace("_", " ")} Recommendations
											</h3>
											<div className="space-y-2">
												{Array.isArray(results) && results.length > 0 ? (
													(() => {
														console.log(`Results for ${type}:`, results);
														console.log(`First item structure:`, results[0]);
														return results.slice(0, 5).map((item) => {
															console.log(`Individual item for ${type}:`, item);
															return (
																<Card
																	key={item.entity_id}
																	className="p-3 hover:shadow-lg transition-shadow bg-slate-700 border-slate-600"
																>
																	<div className="flex items-center justify-between">
																		<div className="flex-1 min-w-0">
																			<p className="font-medium text-sm text-slate-200 truncate">
																				{item.name}
																			</p>
																			<p className="text-xs text-slate-400">
																				Score: {item.popularity?.toFixed(1)}
																			</p>
																		</div>
																		<div className="flex text-xs">
																			{[...Array(5)].map((_, i) => (
																				<span
																					key={i}
																					className={`${
																						i <
																						Math.floor(
																							(item.popularity || 0) / 20
																						)
																							? "text-yellow-400"
																							: "text-slate-600"
																					}`}
																				>
																					★
																				</span>
																			))}
																		</div>
																	</div>
																</Card>
															);
														});
													})()
												) : (
													<p className="text-sm text-slate-500">
														No recommendations found
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
};
