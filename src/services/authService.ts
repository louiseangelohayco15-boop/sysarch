// Authentication service communicating with backend API

export type Role = "resident" | "staff" | "secretary";
export type AuthPortal = "resident" | "staff";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface Resident {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  contactNumber?: string;
  address: string;
  household: string;
  membersCount: number;
  age: number;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  occupation?: string;
  is_pwd: boolean;
  citizenship?: string;
  notes?: string;
  status: string;
  beneficiarySelectionCount?: number;
  lastBeneficiarySelectedAt?: string;
  householdMembers?: HouseholdMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HouseholdMember {
  id: string;
  fullName: string;
  relationship: string;
  age: number;
  gender?: string;
  occupation?: string;
  civilStatus?: string;
}

export interface Program {
  id: string;
  [key: string]: unknown;
}

export interface EventRecord {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  details?: string;
  timestamp: string;
}

export interface DashboardOverview {
  barangayName: string;
  district: string;
  city: string;
  totalResidents: number;
  seniorResidents: number;
  pwdResidents: number;
  pendingBeneficiaries: number;
  claimedBeneficiaries: number;
  publishedEvents: number;
}

export interface UserAccount {
  id: string;
  username: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  contactNumber?: string;
  address?: string;
  role: Role;
  isActive: boolean;
}

export interface RegisterPayload {
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  address?: string;
  password: string;
  role: Role;
}

interface RegisterRequestPayload extends RegisterPayload {
  portal: AuthPortal;
}

interface AuthSuccessResponse {
  token: string;
  user: User;
}

interface ApiError {
  error: string;
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof (value as { error: unknown }).error === "string";
}

function getErrorMessage(value: unknown, fallback: string): string {
  return isApiError(value) ? value.error : fallback;
}

const API_ROOT = import.meta.env.VITE_API_ROOT ?? "/api";

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(API_ROOT + path, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> | undefined) } });
  } catch {
    throw { error: "Cannot connect to the API server. Start `npm run server` and keep the frontend dev server running." } satisfies ApiError;
  }
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as TResponse;
}

export async function registerUser(
  payload: RegisterPayload,
  portal: AuthPortal = "resident"
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestPayload: RegisterRequestPayload = { ...payload, portal };
    await request<{ success: boolean }>("/register", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Registration failed") };
  }
}

export async function loginUser(
  username: string,
  password: string,
  portal: AuthPortal = "resident"
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const result = await request<AuthSuccessResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password, portal }),
    });
    if (result.token) {
      localStorage.setItem("auth_token", result.token);
      return { success: true, user: result.user };
    }
    return { success: false, error: "No token received" };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Login failed") };
  }
}

export function logout() {
  localStorage.removeItem("auth_token");
}

export async function fetchResidents() {
  return await request<Resident[]>("/residents");
}

export async function createResident(resident: Omit<Resident, "id">) {
  return await request<Resident>("/residents", { method: "POST", body: JSON.stringify(resident) });
}

export async function updateResident(id: string, resident: Omit<Resident, "id">) {
  return await request<Resident>(`/residents/${id}`, { method: "PUT", body: JSON.stringify(resident) });
}

export async function deleteResident(id: string) {
  return await request<{ success: boolean }>(`/residents/${id}`, { method: "DELETE" });
}

export async function fetchMyResident() {
  return await request<Resident | null>("/residents/me");
}

export async function saveMyResident(resident: Omit<Resident, "id">) {
  return await request<Resident>("/residents/me", { method: "POST", body: JSON.stringify(resident) });
}

export async function fetchPrograms() {
  return await request<Program[]>("/programs");
}

export async function fetchBeneficiaries() {
  return await request<Resident[]>("/beneficiaries");
}

export async function recordBeneficiarySelection(id: string) {
  return await request<Resident>(`/beneficiaries/${id}/select`, { method: "POST" });
}

export async function fetchLogs() {
  return await request<ActivityLog[]>("/logs");
}

export async function fetchUsers() {
  return await request<UserAccount[]>("/users");
}

export async function exportBackup() {
  return await request<Record<string, unknown>>("/backup");
}

export async function fetchEvents() {
  return await request<EventRecord[]>("/events");
}

export async function fetchDashboardOverview() {
  return await request<DashboardOverview>("/dashboard/overview");
}

export async function createEvent(event: Omit<EventRecord, "id">) {
  return await request<EventRecord>("/events", { method: "POST", body: JSON.stringify(event) });
}

export async function updateEvent(id: string, event: Omit<EventRecord, "id">) {
  return await request<EventRecord>(`/events/${id}`, { method: "PUT", body: JSON.stringify(event) });
}

export async function deleteEvent(id: string) {
  return await request<{ success: boolean }>(`/events/${id}`, { method: "DELETE" });
}

// helper
export function isLoggedIn() {
  return !!localStorage.getItem("auth_token");
}
