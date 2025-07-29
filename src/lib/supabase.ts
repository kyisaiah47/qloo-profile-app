import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need elevated permissions
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database Types
export interface InsightItem {
	entity_id: string;
	name: string;
	popularity?: number;
}

export interface UserProfile {
	id: string;
	created_at: string;
	user_id: string;
	interests: Record<string, string[]>;
	insights: Record<string, InsightItem[]>;
	contact?: string;
	profile_completed: boolean;
	taste_profile_headline?: string;
	taste_profile_description?: string;
	taste_profile_vibe?: string;
	taste_profile_traits?: string[];
	taste_profile_compatibility?: string;
	taste_profile_generated_at?: string;
}

export interface UserInterest {
	id: string;
	user_id: string;
	category: string;
	interest_name: string;
	entity_id?: string;
	created_at: string;
}

export interface UserInsight {
	id: string;
	user_id: string;
	category: string;
	insight_type: string;
	entity_id: string;
	entity_name: string;
	popularity_score?: number;
	metadata?: Record<string, unknown>;
	created_at: string;
}
