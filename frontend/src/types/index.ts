export interface User {
  id: number;
  email: string;
  mobile?: string;
  full_name: string;
  role: 'user' | 'admin';
  dob?: string;
  gender?: string;
  address?: string;
  profile_completion: number;
  is_active: boolean;
  is_phone_verified?: boolean;
  mpin_enabled?: boolean;
  biometric_enabled?: boolean;
  created_at?: string;
  passengers?: Passenger[];
}

export interface Passenger {
  id?: number;
  name: string;
  age: number;
  gender: string;
  berth_preference: string;
  id_type?: string;
  id_number?: string;
  meal_preference?: string;
}

export interface Station {
  id: number;
  code: string;
  name: string;
  city: string;
  state: string;
  zone?: string;
  railway_zone?: string;
  division?: string;
  search_aliases?: string;
  is_active?: boolean;
  is_junction?: boolean;
  is_major?: boolean;
  platform_count: number;
  latitude?: number;
  longitude?: number;
}

export interface MPINStatus {
  mpin_enabled: boolean;
  has_mpin: boolean;
  is_locked: boolean;
  locked_until?: string | null;
  attempts_remaining: number;
}

export interface BiometricStatus {
  biometric_enabled: boolean;
  credentials_count: number;
  device_names: string[];
}

export interface BiometricChallenge {
  challenge: string;
  rp_id: string;
  rp_name: string;
  user_id: string;
  user_name: string;
  user_display_name: string;
}

export interface ClassAvailability {
  class_code: string;
  class_name: string;
  fare: number;
  status: string;
  status_type: 'AVAILABLE' | 'RAC' | 'WL';
  seats_left: number;
  confirm_probability?: string;
}

export interface Train {
  id: number;
  number: string;
  name: string;
  train_type: string;
  source_station: Station;
  destination_station: Station;
  departure_time: string;
  arrival_time: string;
  duration_hours: number;
  running_days: string;
  available_classes: string;
  classes: ClassAvailability[];
}

export interface ScheduleStop {
  id: number;
  stop_sequence: number;
  station_code: string;
  station_name: string;
  city: string;
  arrival_time: string;
  departure_time: string;
  halt_minutes: number;
  day_number: number;
  distance_km: number;
  platform_number: number;
}

export interface TrainDetail extends Train {
  schedules: ScheduleStop[];
}

export interface BookingPassenger {
  id: number;
  name: string;
  age: number;
  gender: string;
  berth_preference?: string;
  allocated_coach?: string;
  allocated_seat?: number;
  allocated_berth_type?: string;
  status: string;
}

export interface Booking {
  id: number;
  booking_ref: string;
  pnr_number: string;
  train_number: string;
  train_name: string;
  from_station_code: string;
  from_station_name: string;
  to_station_code: string;
  to_station_name: string;
  journey_date: string;
  travel_class: string;
  quota: string;
  status: 'CONFIRMED' | 'WAITING' | 'CANCELLED' | 'COMPLETED';
  base_fare: number;
  taxes: number;
  total_amount: number;
  qr_code?: string;
  created_at: string;
  passengers: BookingPassenger[];
  payment_method?: string;
  payment_status?: string;
}

export interface PNRPassenger {
  passenger: string;
  booking_status: string;
  current_status: string;
}

export interface PNRStatus {
  pnr_number: string;
  train_number: string;
  train_name: string;
  journey_date: string;
  from_station: string;
  to_station: string;
  boarding_point: string;
  travel_class: string;
  quota: string;
  chart_status: string;
  passengers: PNRPassenger[];
  demo_notice: string;
}

export interface UnreservedTicket {
  id: number;
  ticket_ref: string;
  ticket_type: 'JOURNEY' | 'PLATFORM' | 'SEASON';
  from_station: string;
  to_station?: string;
  passenger_count: number;
  travel_class: string;
  duration_type?: string;
  fare: number;
  validity_start: string;
  validity_end: string;
  qr_payload: string;
  status: string;
  created_at: string;
}

export interface FoodItem {
  id: number;
  item_name: string;
  description?: string;
  category: string;
  price: number;
  is_veg: boolean;
  image_url?: string;
  is_available: boolean;
}

export interface FoodVendor {
  id: number;
  vendor_name: string;
  station_id: number;
  cuisine_type: string;
  rating: number;
  image_url?: string;
  is_active: boolean;
  items: FoodItem[];
}

export interface FoodOrder {
  id: number;
  order_ref: string;
  vendor_name: string;
  train_number: string;
  delivery_station: string;
  coach: string;
  seat: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  items: {
    id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export interface Complaint {
  id: number;
  complaint_ref: string;
  pnr?: string;
  train_number?: string;
  station_code?: string;
  category: string;
  description: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'ASSIGNED' | 'RESOLVED';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: number;
  refund_ref: string;
  booking_id: number;
  original_amount: number;
  cancellation_charge: number;
  refund_amount: number;
  reason?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  transaction_type: 'CREDIT' | 'DEBIT' | 'REFUND';
  amount: number;
  reference: string;
  description: string;
  created_at: string;
}

export interface Wallet {
  balance: number;
  transactions: WalletTransaction[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface CoachPositionItem {
  coach_code: string;
  coach_type: string;
  sequence_order: number;
  platform_zone: string;
}

export interface CoachPosition {
  train_number: string;
  train_name: string;
  station_code: string;
  station_name: string;
  total_coaches: number;
  platform_number: number;
  coaches: CoachPositionItem[];
  demo_notice: string;
}

export interface TimelineStop {
  station_code: string;
  station_name: string;
  scheduled_arrival: string;
  scheduled_departure: string;
  actual_arrival: string;
  actual_departure: string;
  delay_minutes: number;
  is_passed: boolean;
  is_current: boolean;
  platform: number;
  distance_km: number;
}

export interface RunningStatus {
  train_number: string;
  train_name: string;
  current_station: string;
  current_station_name: string;
  next_station: string;
  next_station_name: string;
  status_summary: string;
  delay_minutes: number;
  distance_covered_km: number;
  total_distance_km: number;
  progress_percentage: number;
  last_updated: string;
  timeline: TimelineStop[];
  demo_notice: string;
}
