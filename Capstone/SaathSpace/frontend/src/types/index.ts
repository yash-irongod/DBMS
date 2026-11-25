export interface User {
  user_id: number;
  full_name: string;
  email: string;
  account_role: 'member' | 'admin';
  created_at: string;
}

export interface City {
  city_id: number;
  city_name: string;
  total_listings: number;
  verified_listings: number;
  historical_listings: number;
  avg_rent: number | null;
  min_rent: number | null;
  max_rent: number | null;
}

export interface Locality {
  locality_id: number;
  city_id: number;
  locality_name: string;
  city_name: string;
  listing_count: number;
}

export interface Amenity {
  amenity_id: number;
  amenity_name: string;
}

export interface Listing {
  listing_id: number;
  owner_user_id: number | null;
  locality_id: number;
  locality_name: string;
  city_id: number;
  city_name: string;
  title: string;
  listing_kind: 'entire_unit' | 'private_room' | 'shared_room' | 'pg_hostel' | 'other';
  source_property_type?: string;
  rent_amount: number;
  rent_period: 'monthly' | 'weekly' | 'daily' | 'unknown';
  security_deposit: number | null;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  furnishing_status: 'furnished' | 'semi_furnished' | 'unfurnished' | 'unknown';
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  availability_status: 'available' | 'unavailable' | 'reserved' | 'unverified' | 'inactive';
  data_origin: 'public_dataset' | 'user_submitted' | 'synthetic_demo';
  last_verified_at: string | null;
  created_at: string;
  is_saved?: boolean;
  save_count?: number;
  total_enquiries?: number;
  total_saves?: number;
  owner_name?: string | null;
  owner_email?: string | null;
  amenities?: string[] | { amenity_id: number; amenity_name: string }[] | null;
}

export interface RoommateProfile {
  user_id: number;
  full_name: string;
  email: string;
  preferred_city_id: number | null;
  preferred_city_name: string | null;
  budget_min: number;
  budget_max: number;
  move_in_date: string | null;
  food_preference: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'no_preference';
  smoking_preference: 'non_smoker_only' | 'okay_with_smoker' | 'no_preference';
  pets_preference: 'no_pets' | 'pets_ok' | 'no_preference';
  sleep_schedule: 'early' | 'regular' | 'late' | 'no_preference';
  cleanliness_preference: 'relaxed' | 'average' | 'very_clean' | 'no_preference';
  updated_at?: string;
  match_score?: number | null;
  city_score?: number;
  budget_score?: number;
  food_score?: number;
  smoking_score?: number;
  pets_score?: number;
  sleep_score?: number;
  cleanliness_score?: number;
  connection_direction?: 'incoming' | 'outgoing' | 'none';
  request_status?: 'pending' | 'accepted' | 'declined' | 'cancelled' | null;
  request_id?: number | null;
}

export interface Enquiry {
  enquiry_id: number;
  listing_id: number;
  listing_title: string;
  rent_amount: number;
  locality_name?: string;
  city_name?: string;
  message: string;
  enquiry_status: 'new' | 'responded' | 'closed' | 'withdrawn';
  created_at: string;
  owner_name?: string;
  enquirer_name?: string;
  enquirer_email?: string;
}

export interface RoommateRequest {
  request_id: number;
  requester_user_id: number;
  recipient_user_id: number;
  requester_name?: string;
  requester_email?: string;
  recipient_name?: string;
  recipient_email?: string;
  message: string | null;
  request_status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  preferred_city?: string;
  budget_min?: number;
  budget_max?: number;
}

export interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
