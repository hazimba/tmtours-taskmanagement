export enum EntryMode {
  FIT = "FIT",
  GIT = "GIT",
}

export enum Tags {
  HOT = "HOT",
  POPULAR = "POPULAR",
  NEW = "NEW",
  RECOMMENDED = "RECOMMENDED",
}

export enum PackageSession {
  PEAK = "PEAK",
  OFFPEAK = "OFFPEAK",
  ALLSEASON = "ALLSEASON",
  SPRING = "SPRING",
  AUTUMN = "AUTUMN",
  SUMMER = "SUMMER",
  WINTER = "WINTER",
}

export enum Appearance {
  NORMAL = "NORMAL",
  HIGHLIGHT = "HIGHLIGHT",
  PROMOTION = "PROMOTION",
}

export enum PackageType {
  GROUP = "GROUP",
  GROUND = "GROUND",
  UMRAH = "UMRAH",
  MICE = "MICE",
}

export enum MealPlan {
  FULLBOARD = "FULLBOARD",
  HALFBOARD = "HALFBOARD",
  BREAKFASTONLY = "BREAKFASTONLY",
  NOMEAL = "NOMEAL",
}

export enum UserPosition {
  SALES = "SALES",
  ADMIN = "ADMIN",
  DESIGNER = "DESIGNER",
  MANAGER = "MANAGER",
  MARKETING = "MARKETING",
  SUPPORT = "SUPPORT",
  IT = "IT",
  HR = "HR",
  FINANCE = "FINANCE",
  LEGAL = "LEGAL",
  OPERATIONS = "OPERATIONS",
  RESEARCH = "RESEARCH",
  SALES_SUPPORT = "SALES_SUPPORT",
  ECOMMERCE = "ECOMMERCE",
}

export enum UserDepartment {
  SALES = "SALES",
  ADMIN = "ADMIN",
  DESIGNER = "DESIGNER",
  MANAGER = "MANAGER",
  MARKETING = "MARKETING",
  SUPPORT = "SUPPORT",
  IT = "IT",
  HR = "HR",
  FINANCE = "FINANCE",
  LEGAL = "LEGAL",
  OPERATIONS = "OPERATIONS",
  RESEARCH = "RESEARCH",
  SALES_SUPPORT = "SALES_SUPPORT",
  ECOMMERCE = "ECOMMERCE",
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum PackageStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  created_at: string;
  updated_at: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  location: string;
}

export interface Package {
  uuid: string;
  title: string;
  subtitle: string;
  route: string;
  keywords: string[];
  highlight: string;
  itinerary: string[];
  optional_tours: string;
  flight_schedule: {
    range: {
      from: Date;
      to?: Date;
    };
  }[];
  freebies: string;
  includes: string;
  excludes: string;
  important_notes: string;
  conditions: string;
  embedded: string;
  web_priority: number;
  web_tier: number;
  sale_period: {
    from: Date;
    to?: Date;
  };
  update_period: Date;
  sale_able_market: string;
  is_publish: boolean;
  entry_mode: EntryMode;
  session: PackageSession;
  country: string;
  appearance: Appearance;
  type: PackageType;
  meal_plan: MealPlan;
  location: string;
  tour_code: string;
  features: string[];
  main_image_url: string;
  sub_image_urls: string[];
  tags: string[];
  price_original: string;
  price_discount: string;
  price_from: string;
  price_to: string;
  package_includes: string[];
  package_excludes: string[];
  package_freebies: string[];
  additional_remarks: string[];
  status: PackageStatus;
  created_at: Date;
  updated_at: Date;
  sales_id: string;
}

export interface ImageSlider {
  id: string;
  title: string;
  subtitle: string;
  buttontext: string;
  buttonpath: string;
  imageurl: string;
  isActive: boolean;
  // future will do join
  // package_uuid: string | null;
  // packages: Package[];
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: string;
  message: string;
  created_at: Date;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  is_publish: boolean;
  created_at: Date;
}

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  quote: string;
  is_publish: boolean;
  image_url: string | null;
  created_at: Date;
}

export interface SiteSetting {
  id: string;
  show_slider: boolean;
  show_packages: boolean;
  show_partners: boolean;
  show_contact: boolean;
  show_testimonials: boolean;
  created_at: Date;
}

export interface Enquiries {
  id: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  message: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  bg_image_url: string;
  keywords: string;
  is_publish: boolean;
  created_at: Date;
}

export interface ImageAlbum {
  id: string;
  name: string;
  image_url: string;
  created_at: Date;
}

export interface Blog {
  id: string;
  created_at: string;
  updated_at: string;

  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image?: string | null;
  cover_image_path?: string | null;

  author?: User | null;

  category?: string | null;
  author_id?: string | null;
  status: BlogStatus;
  published_at?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
}

export enum BlogStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum BlogCategory {
  GENERAL = "GENERAL",
  TRAVEL_TIPS = "TRAVEL TIPS & HACKS",
  DESTINATION_GUIDES = "DESTINATION GUIDES",
  CULTURE_AND_LIFESTYLE = "CULTURE AND LIFESTYLE",
  FOOD_AND_CUISINE = "FOOD AND CUISINE",
  TRAVEL_STORIES = "TRAVEL STORIES & EXPERIENCES",
  NEWS_AND_UPDATES = "NEWS AND UPDATES",
}

// export type TaskStatus =
//   | "TODO"
//   | "IN_PROGRESS"
//   | "REVIEW"
//   | "COMPLETED"
//   | "CANCELLED";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface TaskAttachment {
  url: string;
  type: "IMAGE" | "PDF" | "DOC" | "EXCEL" | "OTHER";
  name?: string;
}

export interface Task {
  id: string;

  created_by: string;
  assigned_to?: string;
  parent_id?: string;

  title: string;
  description?: string;

  status: TaskStatus;
  priority: TaskPriority;

  category?: string;
  tags: string[];
  sort_order: number;

  attachments: TaskAttachment[];
  is_archived: boolean;

  start_date?: string;
  due_date?: string;
  completed_at?: string;

  created_at: string;
  updated_at: string;
}
