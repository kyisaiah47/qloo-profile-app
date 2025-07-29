"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
		artist: "The Beatles",
		album: "Abbey Road",
		book: "1984",
		movie: "Inception",
		tv_show: "Breaking Bad",
		destination: "Paris",
		place: "Coffee shop",
		brand: "Nike",
		videogame: "The Witcher 3",
		podcast: "Joe Rogan",
		actor: "Leonardo DiCaprio",
		director: "Christopher Nolan",
		author: "George Orwell",
		person: "Albert Einstein",
		locality: "New York",
		tag: "Adventure",
		demographics: "Millennials",
	};
	return placeholders[type] || "Example";
};

export default function ProfileForm() {
	const [formData, setFormData] = useState<Record<string, string>>({});
	const [insightResults, setInsightResults] = useState<
		Record<string, InsightItem[]>
	>({});

	const handleChange = (type: string, value: string) => {
		setFormData({ ...formData, [type]: value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const resolvedEntities: Record<string, InsightItem | null> = {};
		const insightMap: Record<string, InsightItem[]> = {};

		for (const type of QLOO_TYPES) {
			const value = formData[type];
			if (!value) continue;

			const res = await fetch("/api/qloo-search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: value, type }),
			});

			const json = await res.json();
			const entity = json.data?.results?.[0];
			resolvedEntities[type] = entity || null;

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
				insightMap[type] = insights?.data?.results ?? [];
			}
		}

		console.log("Resolved Entities:", resolvedEntities);
		console.log("Qloo Insights:", insightMap);
		Object.entries(insightMap).map(([type, results]) => {
			console.log(`Insights for ${type}:`, Object.values(results)[0]);
		});
		setInsightResults(insightMap);
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

			<div className="h-full flex flex-col relative z-10 p-6">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="flex-1 flex flex-col max-w-7xl mx-auto w-full"
				>
					{/* Compact Header */}
					<div className="text-center mb-8">
						<motion.h1
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.6 }}
							className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-200 via-blue-400 to-indigo-400 bg-clip-text text-transparent"
						>
							Build Your Taste Profile
						</motion.h1>

						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.4, duration: 0.6 }}
							className="text-lg text-slate-300 max-w-2xl mx-auto"
						>
							Discover personalized recommendations by sharing your preferences
							across different categories
						</motion.p>
					</div>

					<motion.form
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6, duration: 0.6 }}
						onSubmit={handleSubmit}
						className="flex-1 flex flex-col"
					>
						<Card className="shadow-xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm flex-1">
							<CardContent className="p-8 h-full flex flex-col">
								<div className="text-center mb-8">
									<h2 className="text-xl font-semibold text-slate-200 mb-2">
										Share Your Preferences
									</h2>
									<p className="text-sm text-slate-400">
										Fill in categories that matter to you
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1">
									{QLOO_TYPES.map((type, index) => (
										<motion.div
											key={type}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												delay: 0.8 + index * 0.05,
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
											<Input
												id={type}
												placeholder={`e.g. ${getPlaceholder(type)}`}
												value={formData[type] || ""}
												onChange={(e) => handleChange(type, e.target.value)}
												className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400"
											/>
										</motion.div>
									))}
								</div>

								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 1.2, duration: 0.4 }}
									className="text-center mt-6 pt-4 border-t border-slate-700"
								>
									<Button
										type="submit"
										size="lg"
										className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg text-white"
									>
										Generate Recommendations
									</Button>
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
										Your Recommendations
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
													{type.replace("_", " ")} Brands
												</h3>
												<div className="space-y-2">
													{Array.isArray(results) && results.length > 0 ? (
														results.slice(0, 5).map((item) => (
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
														))
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
		</div>
	);
}
