'use client';

// [SC-179] Sovereign Injection: Financial & Vehicle Class Schema
export type VehicleClass = 'BUS' | 'MINIBUS' | 'VAN' | 'SEDAN' | 'SUV';

// [SC-067] Reputation System Types
export type CarrierTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface RatingStats {
  average: number;
  count: number;
  tier: CarrierTier;
}

// [SC-193] Enhanced Passenger Details (Security Manifest)
export type PassengerDetails = {
  name: string;
  nationality: string; // (+) Mandatory Nationality Field
  documentNumber: string;
  type: 'adult' | 'minor' | 'infant';
};

// [SC-065] Unified User Profile (Merging Carrier & Traveler)
export type UserProfile = {
  conditions: string;
  depositPercentage: number;
  currency: string;
  price: any;
  vehicleCategory: string;
  fullName: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role?: 'traveler' | 'carrier' | 'admin' | 'owner';
  isDeactivated?: boolean;
  
  // Carrier Specifics
  ratingStats?: RatingStats;
  currentActiveTripId?: string | null;
  
  vehicleType?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  plateNumber?: string;
  vehicleCapacity?: number;
  vehicleImageUrls?: string[];
  
  jurisdiction?: {
    origin: string;      
    destination: string; 
  };
  
  paymentInformation?: string; 
  bagsPerSeat?: number;
  numberOfStops?: number;
  
  // Meta
  createdAt?: any;
  updatedAt?: any;
  fcmTokens?: string[];
  lastTokenUpdate?: any;
  isPartial?: boolean;
  savedTemplates?: {name: string, price: number, notes: string}[];
  officeName?: string;
  officePhone?: string;
  sidePanelNumber?: string;
  
  // [SC-179] Sovereign Financial & Operational Fields
  vehicleClass?: VehicleClass;
  subscriptionStatus?: 'active' | 'frozen' | 'expired';
  subscriptionExpiresAt?: any;
  walletBalance?: number;
  isFinancialFrozen?: boolean;
  operatingCountry?: string;
  baseCity?: string;
  jurisdictionType?: string;
  // [SC-188] Emergency Credit Flag
  hasUsedEmergencyCredit?: boolean;
};

export type Trip = {
  departureTime: string;
  id: string;
  userId: string;
  carrierId?: string;
  carrierName?: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate?: string;
  estimatedDurationHours?: number;
  status: 'Planned' | 'In-Transit' | 'Completed' | 'Cancelled' | 'Awaiting-Offers' | 'Pending-Carrier-Confirmation' | 'Pending-Payment';
  
  // Logistics
  cargoDetails?: string;
  passengers?: number;
  passengersDetails?: PassengerDetails[];
  
  // Financials
  price?: number;
  currency?: string;
  depositPercentage?: number;
  availableSeats?: number;
  
  // Relations
  acceptedOfferId?: string | null;
  bookingIds?: string[];
  
  // Vehicle Snapshot
  vehicleType?: string;
  vehiclePlateNumber?: string;
  vehicleImageUrls?: string[];
  vehicleCategory?: 'small' | 'bus';
  vehicleCapacity?: number;
  
  // Trip Details
  conditions?: string;
  meetingPoint?: string;
  meetingPointLink?: string;
  bagsPerSeat?: number;
  numberOfStops?: number;
  notes?: string;

  // Requests Logic
  requestType?: 'General' | 'Direct';
  targetCarrierId?: string;
  preferredVehicle?: 'any' | 'small' | 'bus';
  isShared?: boolean;
  targetPrice?: number;

  // Metadata & System
  createdAt?: any;
  updatedAt?: any;
  cancellationReason?: string;
  
  // [SC-139] Transfer Logic
  originalCarrierId?: string;
  transferStatus?: 'Transferred';
  
  // [SC-089] Time Validation
  actualDepartureTime?: any;
  isStartedConfirmed?: boolean;
};

export type Booking = {
  id: string;
  tripId: string;
  userId: string;
  carrierId: string;
  seats: number;
  passengersDetails: PassengerDetails[];
  status: 'Confirmed' | 'Pending-Payment' | 'Cancelled' | 'Completed' | 'Pending-Carrier-Confirmation' | 'Rated';
  totalPrice: number;
  currency?: 'JOD' | 'SAR' | 'USD';
  createdAt?: any;
  updatedAt?: any;
  cancelledBy?: 'carrier' | 'traveler';
  cancellationReason?: string;
  consentTimestamp?: any;
  // [SC-105] Financial Notary
  cancelledAt?: any;
  cancellationFee?: number;
  refundStatus?: 'Non-Refundable (Late)' | 'Refundable (Early)';
  cancellationPolicySnapshot?: string;
};

export type Offer = {
  id: string;
  tripId: string;
  carrierId: string;
  price: number;
  currency?: string;
  notes?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
  vehicleType?: string;
  vehicleCategory?: 'small' | 'bus';
  vehicleModelYear?: number;
  availableSeats?: number;
  depositPercentage?: number;
  conditions?: string;
  estimatedDurationHours?: number;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'new_offer' | 'booking_confirmed' | 'trip_update' | 'payment_reminder' | 'new_booking_request' | 'rating_request' | 'group_chat_message';
  isRead: boolean;
  createdAt: string;
  link?: string;
};

export type Rating = {
  id: string;
  tripId: string;
  carrierId: string;
  userId: string;
  ratingValue: number;
  details: {
    priceAdherence: boolean;
    vehicleMatch: boolean;
    serviceStars: number;
    comment?: string;
  };
  createdAt: string;
};

export type Chat = {
  id: string;
  tripId: string;
  isGroupChat: boolean;
  type?: 'private' | 'trip_group';
  participants: string[];
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: any;
  unreadCounts?: { [userId: string]: number };
  isClosed?: boolean;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
  type?: 'system' | 'user';
};

export type TransferRequest = {
  id: string;
  originalTripId: string;
  fromCarrierId: string;
  toCarrierId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  updatedAt: any;
  tripDetails: {
      origin: string;
      destination: string;
      departureDate: string;
      passengerCount: number;
  };
};

// [SC-183] Financial Ledger Types
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRIP_COMMISSION' | 'SUBSCRIPTION_FEE' | 'PENALTY';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number; // المبلغ (سالب للخصم، موجب للإيداع)
  currency: string;
  type: TransactionType;
  description: string;
  relatedTripId?: string; // لربط الخصم بالرحلة
  createdAt: any;
  balanceAfter: number; // الرصيد بعد العملية (للأرشفة)
}

// [SC-184] SOVEREIGN PRICING SCHEMA
export interface PricingRule {
  id: string; // ISO Code (e.g., 'JO', 'SA')
  countryName: string;
  currency: string; // JOD, SAR
  travelerBookingFee: number; // رسوم الحجز الأساسية
  travelerDiscount: number;   // قيمة الخصم (للتحكم بالمجانية)
  carrierSeatPrice: number;   // سعر نقطة المقعد (نظام النقاط)
  carrierMonthlySub: number;  // سعر الاشتراك الشهري
  isActive: boolean;
  updatedAt?: any;
}

// [SC-190] THE TREASURY GATE: Top-up Request Schema
export type TopupRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'CLIQ' | 'BANK_TRANSFER' | 'CASH_OFFICE';

export interface TopupRequest {
  id: string;
  carrierId: string;
  carrierName: string;
  amount: number;
  currency: string; // Usually 'JOD'
  method: PaymentMethod;
  proofImageUrl: string; // رابط صورة الحوالة (The Evidence)
  status: TopupRequestStatus;
  
  // Audit Trail
  createdAt: any;
  processedAt?: any;
  processedBy?: string; // Admin ID responsible for approval
  rejectionReason?: string;
}
