"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
	const [insightResults, setInsightResults] = useState<Record<string, any[]>>(
		{}
	);

	const handleChange = (type: string, value: string) => {
		setFormData({ ...formData, [type]: value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const resolvedEntities: Record<string, any> = {};
		const insightMap: Record<string, any[]> = {};

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
		<div className="max-w-3xl mx-auto py-10 px-4">
			<motion.h1
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-3xl font-bold mb-6 text-center"
			>
				Build Your Taste Profile
			</motion.h1>

			<form
				onSubmit={handleSubmit}
				className="grid gap-6"
			>
				{QLOO_TYPES.map((type) => (
					<Card
						key={type}
						className="shadow-md"
					>
						<CardContent className="p-4">
							<Label
								htmlFor={type}
								className="capitalize mb-1 block"
							>
								{type.replace("_", " ")}
							</Label>
							<Input
								id={type}
								placeholder={`Enter a ${type}`}
								value={formData[type] || ""}
								onChange={(e) => handleChange(type, e.target.value)}
							/>
						</CardContent>
					</Card>
				))}

				<Button
					type="submit"
					className="mt-4"
				>
					Submit Profile
				</Button>
			</form>

			{/* Optional: Display insights below */}
			<div className="mt-10">
				{Object.entries(insightResults).map(([type, results]) => (
					<div
						key={type}
						className="mb-6"
					>
						<h2 className="text-xl font-semibold mb-2 capitalize">
							Recommended Brands for {type}
						</h2>
						<div className="grid grid-cols-2 gap-4">
							{Object.values(results)[0].map((item) => (
								<Card key={item.entity_id}>
									<CardContent className="p-4">
										<p className="font-medium">{item.name}</p>
										<p className="text-sm text-muted-foreground">
											Popularity: {item.popularity?.toFixed(2)}
										</p>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
