import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  addDoc,
  updateDoc,
  limit,
  startAfter,
  onSnapshot,
  increment,
  DocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { generateOrderNumber } from "../utils/orderNumber";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShippingMethod {
  id: string;
  name: string;
  price: string;
  estimatedDays: string;
  description: string;
}

export interface PickupStation {
  id: string;
  county: string;
  town: string;
  stationName: string;
  address: string;
  contactPhone: string;
  isActive: boolean;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  tagline?: string;
  description?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  currency?: string;
  category?: string;
  logoUrl?: string;
  businessHours?: Record<string, { open: string; close: string; closed: boolean }>;
  paymentMethods?: {
    mpesa?: { enabled: boolean; buyGoods?: { enabled: boolean; tillNumber?: string }; paybill?: { enabled: boolean; paybillNumber?: string; accountNumber?: string } };
    bank?: { enabled: boolean; bankName?: string; accountName?: string; accountNumber?: string };
    card?: { enabled: boolean };
    cash?: { enabled: boolean };
  };
  shippingMethods?: ShippingMethod[];
  pickupStations?: PickupStation[];
  biometricEnabled?: boolean;
  whatsappInstanceName?: string;
  preferredLanguage?: string;
  heroSlides?: Array<{ tag: string; title: string; desc: string; cta: string; cls: string }>;
  createdAt: any;
  updatedAt: any;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  originalPrice?: number;
  costPrice?: number;
  category?: string;
  categoryName?: string;
  brand?: string;
  condition?: string;
  emoji?: string;
  badge?: string;
  sold?: number;
  revenue?: string;
  imageUrl?: string;
  images?: string[];
  stock?: number;
  lowStockAlert?: number;
  sku?: string;
  barcode?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  warranty?: string;
  weight?: number;
  weightUnit?: string;
  status?: "active" | "paused" | "draft" | "in" | "low" | "out";
  views?: number;
  orders?: number;
  rating?: number;
  shippingMethods?: Array<{ id: string; name: string; price: number }>;
  paymentMethods?: Array<{ id: string; name: string; details: string }>;
  variants?: Array<{ id: string; specs: Record<string, string>; sku: string; price: number; stock: number }>;
  specifications?: Record<string, string | number>;
  specs?: Record<string, string[]>;
  active?: boolean;
  trackInventory?: boolean;
  allowWhatsApp?: boolean;
  orderLink?: string;
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  orderLink?: string;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  deliveryAddress?: string;
  items?: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  paymentDetails?: string;
  deliveryMethod?: string;
  pickupLocation?: string;
  notes?: string;
  source?: string;
  status: OrderStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  segment?: "vip" | "regular" | "new" | "inactive";
  spent?: number;
  orders?: number;
  avg?: number;
  lastOrder?: string;
  tags?: string[];
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Conversation {
  id: string;
  phone: string;
  name: string;
  email?: string;
  userId?: string;
  channel?: 'whatsapp' | 'inapp';
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: number;
  status?: string;
  ai?: boolean;
  isGroup?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  conversationId: string;
  type: "sent" | "received" | "date";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  ai?: boolean;
  product?: { emoji: string; name: string; price: number; desc: string };
  createdAt: any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  email: string;
  subject: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: number;
  status: 'open' | 'closed' | 'pending';
  createdAt: any;
  updatedAt: any;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  type: "sent" | "received";
  text: string;
  time: string;
  createdAt: any;
}

export interface WhatsAppSettings {
  id: string;
  businessName?: string;
  welcomeMessageEnabled: boolean;
  welcomeMessage: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  awayMessageEnabled: boolean;
  awayMessage: string;
  quickReplies?: Array<{ id: string; keyword: string; message: string }>;
  createdAt: any;
  updatedAt: any;
}

export interface ProductSettings {
  id: string;
  storeDescription?: string;
  returnPolicy?: string;
  warrantyInfo?: string;
  createdAt: any;
  updatedAt: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAIN_BUSINESS_ID = "main";

function cleanData<T extends Record<string, any>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined)) as Partial<T>;
}

// ─── Service: Business Profile (shared single doc) ───────────────────────────

export const businessProfileService = {
  async getProfile(): Promise<BusinessProfile | null> {
    const snap = await getDoc(doc(db, "businessProfiles", MAIN_BUSINESS_ID));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as BusinessProfile;
  },

  async saveProfile(data: Partial<BusinessProfile>): Promise<void> {
    await setDoc(doc(db, "businessProfiles", MAIN_BUSINESS_ID), {
      ...cleanData(data),
      id: MAIN_BUSINESS_ID,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  },

  // ── Store config (shipping, pickup, payments) ──

  async getStoreConfig(): Promise<{
    shippingMethods: ShippingMethod[];
    pickupStations: PickupStation[];
    paymentMethods: BusinessProfile['paymentMethods'];
  }> {
    const profile = await this.getProfile();
    return {
      shippingMethods: profile?.shippingMethods || [],
      pickupStations: profile?.pickupStations || [],
      paymentMethods: profile?.paymentMethods || {},
    };
  },

  async saveShippingMethods(methods: ShippingMethod[]): Promise<void> {
    await this.saveProfile({ shippingMethods: methods });
  },

  async savePickupStations(stations: PickupStation[]): Promise<void> {
    await this.saveProfile({ pickupStations: stations });
  },

  async savePaymentMethods(methods: BusinessProfile['paymentMethods']): Promise<void> {
    await this.saveProfile({ paymentMethods: methods });
  },
};

// ─── Service: Products (shared) ──────────────────────────────────────────────

export const productService = {
  async createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const docRef = doc(collection(db, "products"));
    const productData: Product = {
      ...product,
      id: docRef.id,
      stock: product.stock || 0,
      status: product.status || "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, productData);
    return productData;
  },

  async getProducts(): Promise<Product[]> {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  },

  async getProductsPaginated(
    pageSize: number,
    cursor?: DocumentSnapshot,
    statusFilter?: string
  ): Promise<{ products: Product[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    const constraints: any[] = [];
    if (statusFilter && statusFilter !== "all") {
      constraints.push(where("status", "==", statusFilter));
    }
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(pageSize + 1));
    if (cursor) constraints.push(startAfter(cursor));

    const q = query(collection(db, "products"), ...constraints);
    const snap = await getDocs(q);
    const hasMore = snap.docs.length > pageSize;
    const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
    const lastVisible = docs.length > 0 ? docs[docs.length - 1] : null;

    return {
      products: docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[],
      lastVisible,
      hasMore,
    };
  },

  async getProductById(productId: string): Promise<Product | null> {
    const snap = await getDoc(doc(db, "products", productId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
  },

  async updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    const snap = await getDoc(doc(db, "products", productId));
    if (!snap.exists()) throw new Error("Product not found");
    await setDoc(doc(db, "products", productId), { ...cleanData(data), updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteProduct(productId: string): Promise<void> {
    const snap = await getDoc(doc(db, "products", productId));
    if (!snap.exists()) throw new Error("Product not found");
    await deleteDoc(doc(db, "products", productId));
  },

  async getProductCounts(): Promise<{ all: number; active: number; paused: number; draft: number }> {
    const [allSnap, activeSnap, pausedSnap, draftSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(query(collection(db, "products"), where("status", "==", "active"))),
      getDocs(query(collection(db, "products"), where("status", "==", "paused"))),
      getDocs(query(collection(db, "products"), where("status", "==", "draft"))),
    ]);
    return { all: allSnap.size, active: activeSnap.size, paused: pausedSnap.size, draft: draftSnap.size };
  },
};

// ─── Service: Orders (shared) ────────────────────────────────────────────────

export const orderService = {
  async createOrder(order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
    const docRef = doc(collection(db, "orders"));
    const orderData: Order = {
      ...order,
      id: docRef.id,
      orderNumber: generateOrderNumber(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, orderData);
    return orderData;
  },

  async getOrders(statusFilter?: string, filters?: { customerId?: string }): Promise<Order[]> {
    const constraints: any[] = [];
    if (statusFilter && statusFilter !== "all") {
      constraints.push(where("status", "==", statusFilter));
    }
    if (filters?.customerId) {
      constraints.push(where("customerId", "==", filters.customerId));
    }
    constraints.push(orderBy("createdAt", "desc"));
    const q = query(collection(db, "orders"), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  },

  async getOrdersPaginated(
    pageSize: number,
    cursor?: DocumentSnapshot,
    statusFilter?: string
  ): Promise<{ orders: Order[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> {
    const constraints: any[] = [];
    if (statusFilter && statusFilter !== "all") {
      constraints.push(where("status", "==", statusFilter));
    }
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(pageSize + 1));
    if (cursor) constraints.push(startAfter(cursor));

    const q = query(collection(db, "orders"), ...constraints);
    const snap = await getDocs(q);
    const hasMore = snap.docs.length > pageSize;
    const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
    const lastVisible = docs.length > 0 ? docs[docs.length - 1] : null;

    return {
      orders: docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[],
      lastVisible,
      hasMore,
    };
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  },

  async updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) throw new Error("Order not found");
    await setDoc(doc(db, "orders", orderId), { ...cleanData(data), updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteOrder(orderId: string): Promise<void> {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) throw new Error("Order not found");
    await deleteDoc(doc(db, "orders", orderId));
  },

  async getOrderCounts(): Promise<Record<string, number>> {
    const statuses = ["pending", "processing", "delivered", "cancelled", "refunded"];
    const [allSnap, ...statusSnaps] = await Promise.all([
      getDocs(collection(db, "orders")),
      ...statuses.map(s => getDocs(query(collection(db, "orders"), where("status", "==", s)))),
    ]);
    const counts: Record<string, number> = { all: allSnap.size };
    statuses.forEach((s, i) => { counts[s] = statusSnaps[i].size; });
    return counts;
  },
};

// ─── Service: Customers (shared) ─────────────────────────────────────────────

export const customerService = {
  async createCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const docRef = doc(collection(db, "customers"));
    const customerData: Customer = {
      ...customer,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, customerData);
    return customerData;
  },

  async getCustomers(): Promise<Customer[]> {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
  },

  async getCustomerById(customerId: string): Promise<Customer | null> {
    const snap = await getDoc(doc(db, "customers", customerId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Customer;
  },

  async updateCustomer(customerId: string, data: Partial<Customer>): Promise<void> {
    const snap = await getDoc(doc(db, "customers", customerId));
    if (!snap.exists()) throw new Error("Customer not found");
    await setDoc(doc(db, "customers", customerId), { ...cleanData(data), updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCustomer(customerId: string): Promise<void> {
    const snap = await getDoc(doc(db, "customers", customerId));
    if (!snap.exists()) throw new Error("Customer not found");
    await deleteDoc(doc(db, "customers", customerId));
  },
};

// ─── Service: Conversations (shared) ─────────────────────────────────────────

export const conversationService = {
  async getConversations(channel?: 'whatsapp' | 'inapp'): Promise<Conversation[]> {
    const constraints: any[] = [];
    if (channel) constraints.push(where("channel", "==", channel));
    constraints.push(orderBy("lastMessageTime", "desc"));
    const snap = await getDocs(query(collection(db, "conversations"), ...constraints));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
  },

  onConversations(channel: 'whatsapp' | 'inapp', callback: (conversations: Conversation[]) => void): Unsubscribe {
    const constraints: any[] = [where("channel", "==", channel)];
    constraints.push(orderBy("lastMessageTime", "desc"));
    return onSnapshot(query(collection(db, "conversations"), ...constraints), (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[]);
    });
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  },

  onMessages(conversationId: string, callback: (messages: Message[]) => void): Unsubscribe {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
    });
  },

  async sendMessage(conversationId: string, message: Omit<Message, "id" | "conversationId" | "createdAt">): Promise<Message> {
    const docRef = doc(collection(db, "messages"));
    const messageData: Message = {
      ...message,
      id: docRef.id,
      conversationId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, messageData);

    // Also update conversation's last message metadata + bump unread for received
    const unreadUpdate: Record<string, any> = {
      lastMessage: message.text,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (message.type === 'received') {
      unreadUpdate.unread = increment(1);
    }
    await setDoc(doc(db, "conversations", conversationId), unreadUpdate, { merge: true });

    return messageData;
  },

  async updateConversation(conversationId: string, data: Partial<Conversation>): Promise<void> {
    await setDoc(doc(db, "conversations", conversationId), { ...cleanData(data), updatedAt: serverTimestamp() }, { merge: true });
  },
};

// ─── Service: WhatsApp Settings (shared single doc) ─────────────────────────

export const whatsappSettingsService = {
  async getSettings(): Promise<WhatsAppSettings | null> {
    const snap = await getDoc(doc(db, "whatsappSettings", MAIN_BUSINESS_ID));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as WhatsAppSettings;
  },

  async saveSettings(data: Partial<WhatsAppSettings>): Promise<void> {
    await setDoc(doc(db, "whatsappSettings", MAIN_BUSINESS_ID), {
      ...cleanData(data),
      id: MAIN_BUSINESS_ID,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  },
};

// ─── Service: Product Settings (shared single doc) ──────────────────────────

export const productSettingsService = {
  async getSettings(): Promise<ProductSettings | null> {
    const snap = await getDoc(doc(db, "productSettings", MAIN_BUSINESS_ID));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ProductSettings;
  },

  async saveSettings(data: Partial<ProductSettings>): Promise<void> {
    await setDoc(doc(db, "productSettings", MAIN_BUSINESS_ID), {
      ...cleanData(data),
      id: MAIN_BUSINESS_ID,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  },
};

// ─── Service: Support Tickets (in-app member messages) ─────────────────────

export const supportTicketService = {
  async getTickets(): Promise<SupportTicket[]> {
    const q = query(collection(db, "supportTickets"), orderBy("lastMessageTime", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicket[];
  },

  onTickets(callback: (tickets: SupportTicket[]) => void): Unsubscribe {
    const q = query(collection(db, "supportTickets"), orderBy("lastMessageTime", "desc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportTicket[]);
    });
  },

  async getMessages(ticketId: string): Promise<SupportMessage[]> {
    const q = query(
      collection(db, "supportMessages"),
      where("ticketId", "==", ticketId),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportMessage[];
  },

  onMessages(ticketId: string, callback: (messages: SupportMessage[]) => void): Unsubscribe {
    const q = query(
      collection(db, "supportMessages"),
      where("ticketId", "==", ticketId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportMessage[]);
    });
  },

  async sendMessage(ticketId: string, message: Omit<SupportMessage, "id" | "ticketId" | "createdAt">): Promise<SupportMessage> {
    const docRef = doc(collection(db, "supportMessages"));
    const messageData: SupportMessage = {
      ...message,
      id: docRef.id,
      ticketId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, messageData);

    // Update ticket's last message
    await setDoc(doc(db, "supportTickets", ticketId), {
      lastMessage: message.text,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return messageData;
  },

  async createTicket(ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">): Promise<SupportTicket> {
    const docRef = doc(collection(db, "supportTickets"));
    const ticketData: SupportTicket = {
      ...ticket,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, ticketData);
    return ticketData;
  },

  async updateTicket(ticketId: string, data: Partial<SupportTicket>): Promise<void> {
    await setDoc(doc(db, "supportTickets", ticketId), { ...cleanData(data), updatedAt: serverTimestamp() }, { merge: true });
  },
};

// ─── Service: Search Analytics ──────────────────────────────────────────────

export const searchAnalyticsService = {
  async recordSearch(term: string): Promise<void> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;
    const ref = doc(db, "searchAnalytics", normalized);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        count: increment(1),
        lastSearched: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        term: normalized,
        count: 1,
        lastSearched: serverTimestamp(),
      });
    }
  },

  async getTopSearches(limitCount: number = 5): Promise<string[]> {
    const q = query(
      collection(db, "searchAnalytics"),
      orderBy("count", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().term as string);
  },
};

// ─── Service: Wishlist (per-user subcollection) ─────────────────────

export interface WishlistDbItem {
  productId: string;
  createdAt: any;
}

export const wishlistService = {
  async getWishlist(userId: string): Promise<WishlistDbItem[]> {
    const q = query(collection(db, "wishlists", userId, "items"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as WishlistDbItem));
  },

  async addToWishlist(userId: string, productId: string): Promise<void> {
    await setDoc(doc(db, "wishlists", userId, "items", productId), {
      productId,
      createdAt: serverTimestamp(),
    });
  },

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await deleteDoc(doc(db, "wishlists", userId, "items", productId));
  },

  async clearWishlist(userId: string): Promise<void> {
    const q = query(collection(db, "wishlists", userId, "items"));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  },
};

// ─── Service: User Profile (per-user doc + subcollections) ────────

export interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  role: 'admin' | 'client';
  language?: string;
  currency?: string;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  locationAccess?: boolean;
  createdAt: any;
  updatedAt: any;
}

export async function createUserDocument(
  userId: string,
  email: string,
  data: { displayName: string; role: 'admin' | 'client'; phone?: string }
): Promise<void> {
  await setDoc(doc(db, "users", userId), {
    displayName: data.displayName,
    email,
    phone: data.phone || '',
    role: data.role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export interface UserAddressDb {
  id?: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
  createdAt: any;
}

export interface UserPaymentDb {
  id?: string;
  type: 'card' | 'paypal';
  displayName: string;
  displayDescription: string;
  cardLastFour?: string;
  expiry?: string;
  email?: string;
  isDefault: boolean;
  createdAt: any;
}

export const userProfileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as unknown as UserProfile;
  },

  async saveProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    await setDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  },

  async savePreferences(userId: string, prefs: {
    language?: string;
    currency?: string;
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    locationAccess?: boolean;
  }): Promise<void> {
    await setDoc(doc(db, "users", userId), {
      ...prefs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  // Addresses
  async getAddresses(userId: string): Promise<UserAddressDb[]> {
    const q = query(collection(db, "users", userId, "addresses"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserAddressDb));
  },

  async addAddress(userId: string, data: Omit<UserAddressDb, "id" | "createdAt">): Promise<string> {
    const docRef = doc(collection(db, "users", userId, "addresses"));
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
    return docRef.id;
  },

  async updateAddress(userId: string, addrId: string, data: Partial<UserAddressDb>): Promise<void> {
    await setDoc(doc(db, "users", userId, "addresses", addrId), data, { merge: true });
  },

  async deleteAddress(userId: string, addrId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "addresses", addrId));
  },

  // Payments
  async getPayments(userId: string): Promise<UserPaymentDb[]> {
    const q = query(collection(db, "users", userId, "payments"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserPaymentDb));
  },

  async addPayment(userId: string, data: Omit<UserPaymentDb, "id" | "createdAt">): Promise<string> {
    const docRef = doc(collection(db, "users", userId, "payments"));
    await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
    return docRef.id;
  },

  async updatePayment(userId: string, payId: string, data: Partial<UserPaymentDb>): Promise<void> {
    await setDoc(doc(db, "users", userId, "payments", payId), data, { merge: true });
  },

  async deletePayment(userId: string, payId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId, "payments", payId));
  },
};
