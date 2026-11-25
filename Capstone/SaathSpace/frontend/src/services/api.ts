import { 
  User, City, Locality, Amenity, Listing, 
  RoommateProfile, Enquiry, RoommateRequest, Pagination 
} from '../types';

const envApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/+$/, '')}/api` : '/api';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Important for session cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; database: string; stats: any }>('/health'),

  // Reference
  getCities: () => fetchJson<{ cities: City[] }>('/reference/cities'),
  getLocalities: (cityId?: number, search?: string) => {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    if (search) params.append('search', search);
    return fetchJson<{ localities: Locality[] }>(`/reference/localities?${params.toString()}`);
  },
  getAmenities: () => fetchJson<{ amenities: Amenity[] }>('/reference/amenities'),

  // Auth
  register: (payload: { full_name: string; email: string; password: string }) => 
    fetchJson<{ message: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload: { email: string; password: string }) => 
    fetchJson<{ message: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  logout: () => fetchJson<{ message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () => fetchJson<{ user: User | null; profile: RoommateProfile | null }>('/auth/me'),
  updateProfile: (payload: { full_name: string }) =>
    fetchJson<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  getDemoUsers: () => fetchJson<{ demo_accounts: any[]; default_password: string }>('/auth/demo-users'),

  // Listings
  getListings: (filters: {
    city_id?: number;
    locality_id?: number;
    min_rent?: number;
    max_rent?: number;
    listing_kind?: string;
    bedrooms?: number;
    furnishing_status?: string;
    data_origin?: string;
    availability_status?: string;
    amenity_ids?: string;
    search?: string;
    sort_by?: string;
    page?: number;
    per_page?: number;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val.toString());
      }
    });
    return fetchJson<{ listings: Listing[]; pagination: Pagination }>(`/listings?${params.toString()}`);
  },
  getFeaturedListings: () => fetchJson<{ featured_listings: Listing[] }>('/listings/featured'),
  getListingDetails: (id: number) => fetchJson<{ listing: Listing }>(`/listings/${id}`),
  toggleSaveListing: (id: number) => 
    fetchJson<{ message: string; is_saved: boolean }>(`/listings/${id}/save`, { method: 'POST' }),
  submitEnquiry: (id: number, message: string) =>
    fetchJson<{ message: string; enquiry: Enquiry }>(`/listings/${id}/enquiry`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  // Roommates
  getRoommates: (filters: {
    city_id?: number;
    food_preference?: string;
    smoking_preference?: string;
    pets_preference?: string;
    sleep_schedule?: string;
    cleanliness_preference?: string;
    max_budget?: number;
    min_score?: number;
  } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val.toString());
      }
    });
    return fetchJson<{ roommates: RoommateProfile[]; is_authenticated: boolean }>(`/roommates?${params.toString()}`);
  },
  getRoommateDetails: (userId: number) => fetchJson<{ profile: RoommateProfile }>(`/roommates/${userId}`),
  updateOwnRoommatePreferences: (payload: Partial<RoommateProfile>) =>
    fetchJson<{ message: string; profile: RoommateProfile }>('/roommates/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  sendRoommateRequest: (recipientUserId: number, message: string) =>
    fetchJson<{ message: string; request: RoommateRequest }>('/roommates/request', {
      method: 'POST',
      body: JSON.stringify({ recipient_user_id: recipientUserId, message })
    }),
  updateRoommateRequestStatus: (requestId: number, status: 'accepted' | 'declined' | 'cancelled') =>
    fetchJson<{ message: string; request: RoommateRequest }>(`/roommates/request/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // User Dashboard
  getDashboardSummary: () => fetchJson<{
    profile: RoommateProfile | null;
    saved_listings: Listing[];
    enquiries: Enquiry[];
    incoming_requests: RoommateRequest[];
    outgoing_requests: RoommateRequest[];
    recommended_roommates: RoommateProfile[];
  }>('/dashboard/summary'),

  // Owner Dashboard
  getOwnerListings: () => fetchJson<{ listings: Listing[] }>('/owner/listings'),
  createListing: (payload: any) =>
    fetchJson<{ message: string; listing_id: number }>('/owner/listings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateListing: (id: number, payload: any) =>
    fetchJson<{ message: string }>(`/owner/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  updateListingAvailability: (id: number, availability_status: string) =>
    fetchJson<{ message: string }>(`/owner/listings/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ availability_status })
    }),
  getOwnerEnquiries: () => fetchJson<{ enquiries: Enquiry[] }>('/owner/enquiries'),
  updateEnquiryStatus: (enquiryId: number, enquiry_status: string) =>
    fetchJson<{ message: string }>(`/owner/enquiries/${enquiryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ enquiry_status })
    }),

  // Admin
  getAdminAnalytics: () => fetchJson<{
    totals: any;
    city_stats: any[];
    status_distribution: any[];
    kind_distribution: any[];
    furnishing_distribution: any[];
    recent_users: any[];
  }>('/admin/analytics')
};
