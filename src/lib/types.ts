export type UserRole = "admin" | "staff" | "customer";

export type BarberRole = "BARBER" | "STYLIST";

export type Shop = {
  name: string;
  address: string;
  description: string;
  socials: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    website?: string;
  };
  imageUrl?: string;
};

export type Barber = {
  name: string;
  bio?: string;
  isActive: boolean;
  role?: BarberRole;
  photoUrl?: string;
  createdAt?: string;
};

export type Service = {
  name: string;
  price: number;
  duration: number;
  category: "men" | "women";
  imageUrl?: string;
  description?: string;
  createdAt?: string;
};

export type GalleryItem = {
  imageUrl: string;
  storagePath?: string;
  createdAt?: string;
};

export type BookingStatus = "pending" | "completed" | "cancelled";

export type Booking = {
  customerName: string;
  serviceName: string;
  barberName: string;
  date: string;
  status: BookingStatus;
  notes?: string;
};
