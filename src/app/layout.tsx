import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const sora = Sora({
	variable: "--font-sora",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "KindredAI - AI that finds your kind",
	description:
		"Connect with like-minded people who share your passions through AI-powered matching",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} ${sora.variable} ${inter.className} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
