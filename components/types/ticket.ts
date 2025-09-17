export type TicketStatus = "NEW" | "OPEN" | "DONE" | "CANCELLED";

export type TicketSource = "EMAIL" | "RINGCENTRAL" | "MANUAL";

export type LocationCategory = "ADULT DAY CARE" | "MEDICAL CENTER" | "Pharmacy" | "OTC" | "Research" | "Corporate";

export type SubLocation = 
  // ADC Locations
  "ADC_HIALEAH_WEST" | "ADC_HIALEAH_EAST" | "ADC_BIRD_ROAD" | "ADC_CUTLER_BAY" | 
  "ADC_HIALEAH" | "ADC_HIATUS" | "ADC_HOLLYWOOD" | "ADC_HOMESTEAD" | 
  "ADC_KENDALL" | "ADC_MARLINS_PARK" | "ADC_MIAMI_27TH" | "ADC_MIAMI_37TH" |
  "ADC_MIAMI_GARDENS" | "ADC_MIAMI_LAKES" | "ADC_NORTH_MIAMI" | "ADC_NORTH_MIAMI_BEACH" |
  "ADC_PEMBROKE_PINES" | "ADC_PLANTATION" | "ADC_TAMARAC" | "ADC_WEST_PALM_BEACH" | "ADC_WESTCHESTER" |
  
  // Medical Center Locations
  "HIALEAH_MC" | "HIALEAH_WEST_MC" | "HIALEAH_EAST_MC" | "BIRD_ROAD_MC" | 
  "HIATUS_MC" | "PEMBROKE_PINES_MC" | "PLANTATION_MC" |
  "WEST_PALM_BEACH_MC" | "HOLLYWOOD_MC" | "KENDALL_MC" | "HOMESTEAD_MC" |
  "CUTLER_RIDGE_MC" | "TAMARAC_MC" | "WESTCHESTER_MC" | "NORTH_MIAMI_BEACH_MC" |
  "MIAMI_GARDENS_MC" | "MARLINS_PARK_MC" | "MIAMI_27TH_MC" |
  "HIALEAH_GARDENS_SPECIALIST" | "BIRD_ROAD_SPECIALIST";
  

export type TicketLocation = {
  category: LocationCategory;
  subLocation?: SubLocation;
  locationId?: string;
  locationTypeId?: string;
  // New structure from API
  id?: string;
  location?: {
    id: string;
    name: string;
    locationTypeId: string;
    [key: string]: any;
  };
};

export type Attachment = {
  id: string;
  filename: string;
  contentType: string;
  size?: number;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  uploadedByName?: string;
};

export type Ticket = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  phoneNumber: string;
  description: string;
  status: TicketStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  subcategory?: string | { name: string; displayName: string } | null;
  assigneeId?: string | null;
  assignee?: Person | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  audio?: Attachment[] | Attachment | null;
  source?: TicketSource | null;
  location?: TicketLocation | null;
  locations?: TicketLocation[] | null;
  attachments?: Attachment[] | null; // Email attachments (documents, images, etc.)
  // Legacy support
  audioUrl?: string | null;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type ListResponse = {
  success: boolean;
  data: { items: Ticket[] };
};

export type UICategory = {
  name: string;
  displayName: string;
  subcats: { name: string; displayName: string }[];
};