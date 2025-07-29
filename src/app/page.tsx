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
		<div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
			<div className="container mx-auto px-4 py-8 h-full">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="max-w-7xl mx-auto"
				>
					<motion.h1
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.6 }}
						className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
					>
						Build Your Taste Profile
					</motion.h1>

					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4, duration: 0.6 }}
						className="text-xl text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
					>
						Discover personalized recommendations by sharing your preferences
						across different categories
					</motion.p>

					<motion.form
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6, duration: 0.6 }}
						onSubmit={handleSubmit}
						className="w-full mb-12"
					>
						<Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
							<CardContent className="p-8">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
									{QLOO_TYPES.map((type, index) => (
										<motion.div
											key={type}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
											className="space-y-2"
										>
											<Label
												htmlFor={type}
												className="capitalize text-sm font-semibold text-slate-700 dark:text-slate-300"
											>
												{type.replace("_", " ")}
											</Label>
											<Input
												id={type}
												placeholder={`Enter a ${type.replace("_", " ")}`}
												value={formData[type] || ""}
												onChange={(e) => handleChange(type, e.target.value)}
												className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-300"
											/>
										</motion.div>
									))}
								</div>
							</CardContent>
						</Card>

						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 1.2, duration: 0.4 }}
							className="text-center mt-8"
						>
							<Button
								type="submit"
								size="lg"
								className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
							>
								Generate My Profile
							</Button>
						</motion.div>
					</motion.form>

					{/* Display insights below */}
					{Object.keys(insightResults).length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="w-full"
						>
							<h2 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-slate-200">
								Your Personalized Recommendations
							</h2>
							<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
								{Object.entries(insightResults).map(
									([type, results], index) => (
										<motion.div
											key={type}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1, duration: 0.4 }}
											className="space-y-4"
										>
											<h3 className="text-xl font-semibold capitalize text-slate-700 dark:text-slate-300">
												Recommended Brands for {type.replace("_", " ")}
											</h3>
											<div className="space-y-3">
												{Array.isArray(results) && results.length > 0
													? results.map((item, itemIndex) => (
															<motion.div
																key={item.entity_id}
																initial={{ opacity: 0, x: -20 }}
																animate={{ opacity: 1, x: 0 }}
																transition={{
																	delay: index * 0.1 + itemIndex * 0.05,
																	duration: 0.3,
																}}
															>
																<Card className="hover:shadow-lg transition-all duration-200 bg-white/90 backdrop-blur-sm dark:bg-slate-800/90 border-slate-200 dark:border-slate-700">
																	<CardContent className="p-4">
																		<p className="font-medium text-slate-800 dark:text-slate-200">
																			{item.name}
																		</p>
																		<p className="text-sm text-muted-foreground">
																			Popularity: {item.popularity?.toFixed(2)}
																		</p>
																	</CardContent>
																</Card>
															</motion.div>
													  ))
													: null}
											</div>
										</motion.div>
									)
								)}
							</div>
						</motion.div>
					)}
				</motion.div>
			</div>
		</div>
	);
}
