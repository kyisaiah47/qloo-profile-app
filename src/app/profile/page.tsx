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

	const handleChange = (type: string, value: string) => {
		setFormData({ ...formData, [type]: value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// later: send to Qloo lookup endpoint
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
		</div>
	);
}
