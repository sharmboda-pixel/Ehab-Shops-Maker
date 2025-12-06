import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Send, Sparkles, Store, Globe, CheckCircle, ShoppingBag, 
  Palette, Cpu, ArrowLeft, Smartphone, Monitor, Share2, 
  Copy, Star, ShieldCheck, Truck, Zap, Mail, Menu, X,
  ChevronDown, ChevronUp, Instagram, Facebook, Twitter, Phone, MapPin,
  HelpCircle, Eye, MousePointerClick, LayoutDashboard, BarChart3, 
  Users, Package, Settings, LogOut, TrendingUp, AlertCircle, FileText,
  Search, Filter, MoreHorizontal, Server, Lock, Database, Key, Network, Download, FileCode, Github, ExternalLink, BookOpen, Cloud, UserCheck, User, LogIn, ArrowRight, Loader2
} from "lucide-react";
import Markdown from "react-markdown";
// استيراد مكتبة AWS SDK من CDN للعمل داخل المتصفح مباشرة
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3";
// استيراد مكتبة Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURATION (AWS & SUPABASE) ---

// 🔴 هام جداً: قم بوضع بيانات SUPABASE الخاصة بك هنا
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; // مثال: https://xyz.supabase.co
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // المفتاح الطويل الذي يبدأ بـ eyJ...

const AWS_CONFIG = {
    REGION: "us-east-1",
    ACCESS_KEY_ID: "AKIA3NWBQ5DCLQGVK22O", 
    SECRET_ACCESS_KEY: "QVRR+qO6jz5+hF1TkpzUupfGntPb62tv6SDG1OSQ", 
    BUCKET_NAME: "ehabgm-shops" 
};

const OWNER_PHONE = "201011500753"; 

// --- Safe Supabase Initialization ---
// هذه الدالة تمنع توقف التطبيق إذا كانت الروابط غير صحيحة
const createSafeSupabaseClient = () => {
    const isConfigured = SUPABASE_URL && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_URL.includes("YOUR_SUPABASE");
    
    if (isConfigured) {
        try {
            return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.error("Supabase Init Error:", e);
        }
    }

    // Mock client fallback (نسخة وهمية ليعمل التطبيق بدون اتصال)
    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signUp: async () => {
                alert("⚠️ الرجاء إعداد Supabase في الكود أولاً!\n(SUPABASE_URL & SUPABASE_ANON_KEY)");
                return { data: null, error: { message: "Configuration missing" } };
            },
            signInWithPassword: async () => {
                alert("⚠️ الرجاء إعداد Supabase في الكود أولاً!\n(SUPABASE_URL & SUPABASE_ANON_KEY)");
                return { data: null, error: { message: "Configuration missing" } };
            },
            signOut: async () => {},
        }
    };
};

const supabase = createSafeSupabaseClient();
const isSupabaseConfigured = SUPABASE_URL && SUPABASE_URL.startsWith("http") && !SUPABASE_URL.includes("YOUR_SUPABASE");

// --- Types ---

interface Product {
  id?: string;
  name: string;
  price: string;
  description: string;
  color: string;
  tag?: string; 
}

interface Feature {
  title: string;
  description: string;
  iconType: "shield" | "truck" | "zap" | "star";
}

interface Testimonial {
  author: string;
  text: string;
  rating: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
}

interface StoreConfig {
  storeName: string;
  tagline: string;
  aboutUs: string;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
  announcementBar: string;
  products: Product[];
  features: Feature[];
  testimonials: Testimonial[];
  faq: FAQItem[];
  blogPosts: BlogPost[];
  subdomain: string;
  contactEmail: string;
  whatsappNumber: string;
  currency: string;
  adminPassword?: string; 
  seoTitle?: string;
  seoKeywords?: string;
}

interface Message {
  role: "user" | "model" | "system";
  content: string;
  isThinking?: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// --- Initial State ---

const initialStoreConfig: StoreConfig = {
  storeName: "متجر الأحلام",
  tagline: "رحلة التسوق تبدأ من هنا",
  aboutUs: "نقدم لك تجربة تسوق فريدة تجمع بين الجودة والأناقة.",
  primaryColor: "#2563eb", 
  secondaryColor: "#f1f5f9", 
  fontStyle: "Modern",
  announcementBar: "خصم 20% لفترة محدودة - اطلب الآن!",
  products: [],
  features: [
    { title: "ضمان ذهبي", description: "استرجاع مجاني خلال 14 يوم", iconType: "shield" },
    { title: "شحن سريع", description: "توصيل خلال 24-48 ساعة", iconType: "truck" },
    { title: "دفع آمن", description: "بوابات دفع مشفرة بالكامل", iconType: "zap" },
  ],
  testimonials: [],
  faq: [
    { question: "كم تستغرق عملية التوصيل؟", answer: "عادة ما تستغرق من يوم إلى 3 أيام عمل حسب مدينتك." },
    { question: "هل المنتجات أصلية؟", answer: "نعم، جميع منتجاتنا أصلية 100% ومضمونة." }
  ],
  blogPosts: [],
  subdomain: "",
  contactEmail: "support@ehab.shop",
  whatsappNumber: "",
  currency: "ر.س",
  adminPassword: Math.random().toString(36).slice(-8),
  seoTitle: "",
  seoKeywords: "تسوق, متجر الكتروني, اونلاين"
};

// --- API Helper ---

const storeSchema = {
  type: Type.OBJECT,
  properties: {
    storeName: { type: Type.STRING, description: "اسم المتجر" },
    tagline: { type: Type.STRING, description: "الشعار التسويقي الرئيسي" },
    aboutUs: { type: Type.STRING, description: "نبذة عن المتجر" },
    primaryColor: { type: Type.STRING, description: "اللون الأساسي (Hex)" },
    secondaryColor: { type: Type.STRING, description: "لون الخلفية الفاتح (Hex)" },
    announcementBar: { type: Type.STRING, description: "نص الشريط العلوي للإعلانات" },
    suggestedSubdomain: { type: Type.STRING, description: "الدومين الفرعي المقترح بالإنجليزية" },
    currency: { type: Type.STRING, description: "العملة (مثلاً: ر.س، ج.م، $)" },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          price: { type: Type.STRING },
          description: { type: Type.STRING },
          color: { type: Type.STRING },
          tag: { type: Type.STRING, description: "علامة مميزة مثل: جديد، خصم، الأكثر مبيعاً" }
        }
      }
    },
    features: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          iconType: { type: Type.STRING, enum: ["shield", "truck", "zap", "star"] }
        }
      }
    },
    testimonials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          author: { type: Type.STRING },
          text: { type: Type.STRING },
          rating: { type: Type.NUMBER }
        }
      }
    },
    faq: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        }
      }
    },
    blogPosts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          date: { type: Type.STRING }
        }
      },
      description: "2 مقالات قصيرة مفيدة للعملاء تتعلق بمنتجات المتجر"
    },
    messageToUser: { type: Type.STRING, description: "ردك على المستخدم" }
  },
  required: ["storeName", "primaryColor", "messageToUser"]
};

const SYSTEM_INSTRUCTION = `
أنت "وكالة إيهاب شوب" (Ehab.Shop Agency AI).
مهمتك: بناء متجر إلكتروني متكامل واحترافي.

القواعد:
1. صمم كل قسم بعناية: المنتجات، المزايا، الأسئلة الشائعة، آراء العملاء، والمدونة.
2. استخدم محتوى تسويقي مقنع باللغة العربية.
3. كن مبدعاً في اختيار الألوان لتناسب هوية العلامة التجارية (مثلاً: الأخضر للأغذية الصحية، الأسود للفخامة).
4. أضف مقالات تدوينية (Blog Posts) مفيدة تزيد من قيمة المتجر.
`;

// --- ADVANCED Store Exporter Function (SPA + CMS) ---
const generateStaticStoreHTML = (config: StoreConfig) => {
  const safeConfig = { 
    ...config, 
    adminPassword: config.adminPassword || 'admin123',
    seoTitle: config.seoTitle || config.storeName,
    seoKeywords: config.seoKeywords || 'متجر, تسوق'
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title x-data x-text="$store.app.config.seoTitle || $store.app.config.storeName"></title>
    <meta name="description" :content="$store.app.config.aboutUs">
    <meta name="keywords" :content="$store.app.config.seoKeywords">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Cairo', sans-serif; }
        .primary-bg { background-color: var(--primary-color); }
        .primary-text { color: var(--primary-color); }
        .primary-border { border-color: var(--primary-color); }
        [x-cloak] { display: none !important; }
        .dashboard-layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
        @media (max-width: 768px) { .dashboard-layout { grid-template-columns: 1fr; } }
    </style>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-50 text-slate-800 selection:bg-indigo-200">
    
    <!-- APP ROOT -->
    <div x-data="app()" x-init="initApp()">
        
        <!-- === ROUTE: STOREFRONT === -->
        <template x-if="currentRoute === 'store'">
            <div>
                <!-- Announcement Bar -->
                <div x-show="config.announcementBar" class="text-white text-center py-2 text-xs font-bold" :style="'background-color: ' + config.primaryColor">
                    <span x-text="config.announcementBar"></span>
                </div>

                <!-- Navbar -->
                <nav class="bg-white/90 backdrop-blur sticky top-0 z-50 border-b border-gray-100 shadow-sm">
                    <div class="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                        <h1 class="text-2xl font-black flex items-center gap-2 cursor-pointer" :style="'color: ' + config.primaryColor" @click="currentRoute = 'store'">
                            <i data-lucide="store" class="w-6 h-6"></i>
                            <span x-text="config.storeName"></span>
                        </h1>
                        <div class="hidden md:flex gap-6 font-bold text-sm text-gray-600">
                            <a href="#" class="hover:text-black transition-colors">الرئيسية</a>
                            <a href="#products" class="hover:text-black transition-colors">المنتجات</a>
                            <a href="#contact" class="hover:text-black transition-colors">اتصل بنا</a>
                        </div>
                        <div class="flex items-center gap-4">
                            <button class="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <i data-lucide="shopping-bag" class="w-6 h-6 text-gray-700"></i>
                                <span class="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">0</span>
                            </button>
                        </div>
                    </div>
                </nav>

                <!-- Hero Section -->
                <header class="py-24 px-4 text-center bg-white relative overflow-hidden">
                    <div class="absolute inset-0 opacity-5" :style="'background-color: ' + config.primaryColor"></div>
                    <div class="relative z-10 max-w-4xl mx-auto">
                        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 text-xs font-bold mb-8">
                             <i data-lucide="star" class="w-3 h-3 text-yellow-500 fill-yellow-500"></i> خيار العملاء الأول
                        </div>
                        <h2 class="text-4xl md:text-6xl font-black mb-6 text-slate-900 leading-tight" x-text="config.tagline"></h2>
                        <p class="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed" x-text="config.aboutUs"></p>
                        <a href="#products" class="inline-block px-10 py-4 rounded-xl text-white font-bold shadow-xl hover:-translate-y-1 transition-transform" :style="'background-color: ' + config.primaryColor">تسوق الآن</a>
                    </div>
                </header>

                <!-- Products Grid -->
                <section id="products" class="py-24 px-4 bg-slate-50">
                    <div class="max-w-6xl mx-auto">
                        <div class="text-center mb-16">
                             <h2 class="text-3xl font-bold mb-4 text-slate-900">منتجاتنا المميزة</h2>
                             <div class="h-1 w-20 mx-auto rounded-full" :style="'background-color: ' + config.primaryColor"></div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <template x-for="product in config.products">
                                <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                                    <div class="h-72 flex items-center justify-center relative overflow-hidden" :style="'background-color: ' + (product.color || '#f1f5f9')">
                                        <span class="text-8xl font-black text-black/5 group-hover:scale-110 transition-transform duration-500" x-text="product.name.substring(0,2)"></span>
                                        <div x-show="product.tag" class="absolute top-4 right-4 bg-black text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider" x-text="product.tag"></div>
                                    </div>
                                    <div class="p-8">
                                        <div class="flex justify-between items-start mb-3">
                                            <h3 class="font-bold text-xl text-slate-900" x-text="product.name"></h3>
                                            <span class="font-bold text-lg" :style="'color: ' + config.primaryColor" dir="ltr"><span x-text="product.price"></span> <span x-text="config.currency"></span></span>
                                        </div>
                                        <p class="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed" x-text="product.description"></p>
                                        <button class="w-full py-4 rounded-xl border-2 font-bold transition-colors flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900" 
                                            :style="'border-color: ' + config.primaryColor + '; color: ' + config.primaryColor">
                                            <i data-lucide="shopping-cart" class="w-4 h-4"></i> إضافة للسلة
                                        </button>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </section>

                <!-- Footer -->
                <footer class="bg-slate-900 text-white py-16 px-4 mt-12 border-t border-slate-800">
                    <div class="max-w-6xl mx-auto text-center">
                        <h2 class="text-3xl font-bold mb-6 flex items-center justify-center gap-2">
                             <i data-lucide="store" class="w-8 h-8 text-slate-400"></i>
                             <span x-text="config.storeName"></span>
                        </h2>
                        <div class="mt-4">
                            <button @click="navigateToAdmin()" class="text-[10px] text-slate-700 hover:text-slate-500 font-mono transition-colors">الدخول كمسؤول</button>
                        </div>
                    </div>
                </footer>
            </div>
        </template>

        <!-- === ROUTE: LOGIN === -->
        <template x-if="currentRoute === 'login'">
            <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div class="bg-slate-900 p-10 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md relative z-10">
                    <div class="text-center mb-8">
                        <div class="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                             <i data-lucide="lock" class="w-8 h-8 text-indigo-500"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">لوحة التحكم</h2>
                        <p class="text-slate-400 text-sm">أدخل كلمة المرور للوصول إلى إعدادات المتجر</p>
                    </div>
                    <form @submit.prevent="checkLogin">
                        <div class="mb-6">
                            <input type="password" x-model="loginPassword" class="w-full bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center tracking-widest text-lg" placeholder="••••••••">
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all">دخول</button>
                        <p x-show="loginError" class="text-red-500 text-xs text-center mt-4 animate-bounce">كلمة المرور غير صحيحة</p>
                    </form>
                </div>
            </div>
        </template>

        <!-- === ROUTE: ADMIN DASHBOARD === -->
        <template x-if="currentRoute === 'admin'">
            <div class="dashboard-layout bg-slate-50 text-slate-800 font-sans">
                <!-- Sidebar -->
                <aside class="bg-slate-900 text-white flex flex-col h-screen sticky top-0 overflow-y-auto z-50">
                    <div class="p-6 border-b border-slate-800 flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-bold shadow-lg">E</div>
                        <div>
                            <div class="font-bold text-lg">لوحة الإدارة</div>
                            <div class="text-[10px] text-slate-400 font-mono">AWS Powered</div>
                        </div>
                    </div>
                    <nav class="flex-1 p-4 space-y-2">
                        <button @click="activeTab = 'dashboard'" :class="activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm">
                            <i data-lucide="layout-dashboard" class="w-5 h-5"></i> نظرة عامة
                        </button>
                         <button @click="activeTab = 'guide'" :class="activeTab === 'guide' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm">
                            <i data-lucide="book-open" class="w-5 h-5"></i> دليل الاستخدام
                        </button>
                        <button @click="activeTab = 'products'" :class="activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm">
                            <i data-lucide="package" class="w-5 h-5"></i> المنتجات
                        </button>
                        <button @click="activeTab = 'settings'" :class="activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm">
                            <i data-lucide="settings" class="w-5 h-5"></i> الإعدادات & SEO
                        </button>
                    </nav>
                    <div class="p-4 border-t border-slate-800">
                        <button @click="logout()" class="w-full flex items-center gap-2 text-slate-400 hover:text-white px-4 py-3 rounded-xl transition-colors text-sm font-bold">
                            <i data-lucide="log-out" class="w-4 h-4"></i> تسجيل خروج
                        </button>
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="flex-1 overflow-y-auto bg-slate-50 h-screen">
                    <header class="bg-white border-b border-gray-200 h-16 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                        <h2 class="font-bold text-xl text-slate-800" x-text="getPageTitle()"></h2>
                        <div class="flex items-center gap-4">
                            <a href="#" @click.prevent="currentRoute = 'store'" class="text-sm text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                <i data-lucide="external-link" class="w-4 h-4"></i> معاينة المتجر
                            </a>
                        </div>
                    </header>

                    <div class="p-8 max-w-5xl mx-auto">
                        
                        <!-- TAB: OVERVIEW -->
                        <div x-show="activeTab === 'dashboard'" class="space-y-6">
                            <!-- Welcome Alert -->
                            <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div class="relative z-10">
                                    <h3 class="text-2xl font-bold mb-2">مرحباً بك في لوحة تحكم متجرك! 🎉</h3>
                                    <p class="opacity-70 max-w-2xl leading-relaxed text-sm mb-6">لديك تحكم كامل في متجرك. يمكنك إدارة المنتجات وتغيير التصميم ومتابعة الأداء. جميع التغييرات يتم تطبيقها فوراً.</p>
                                    <button @click="activeTab = 'guide'" class="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">ابزأ من هنا (الدليل)</button>
                                </div>
                                <i data-lucide="sparkles" class="absolute top-4 left-4 w-40 h-40 text-white opacity-5 rotate-12"></i>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">عدد المنتجات</div>
                                    <div class="text-3xl font-black text-slate-800" x-text="config.products.length"></div>
                                </div>
                                <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">الزيارات (تجريبي)</div>
                                    <div class="text-3xl font-black text-slate-800">142</div>
                                </div>
                                <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">خادم الاستضافة</div>
                                    <div class="text-xl font-bold text-emerald-600 flex items-center gap-2">
                                        <i data-lucide="cloud" class="w-5 h-5"></i> AWS S3
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: GUIDE (ONBOARDING) -->
                        <div x-show="activeTab === 'guide'" class="space-y-8 animate-fade-in">
                            <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                                <h3 class="font-bold text-xl mb-6 text-slate-900 flex items-center gap-2">
                                    <i data-lucide="book-open" class="w-6 h-6 text-indigo-500"></i>
                                    دليل استخدام المتجر
                                </h3>
                                <div class="space-y-8">
                                    <!-- Step 1 -->
                                    <div class="flex gap-4">
                                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">1</div>
                                        <div>
                                            <h4 class="font-bold text-lg text-slate-800 mb-2">كيف أضيف منتجاً جديداً؟</h4>
                                            <p class="text-slate-600 text-sm leading-relaxed mb-4">
                                                انتقل إلى قسم <strong>"المنتجات"</strong> من القائمة الجانبية. اضغط على زر <strong>"إضافة منتج"</strong> الأخضر.
                                                سيظهر لك صف جديد، قم بتعبئة اسم المنتج والسعر والوصف. لا تنس الضغط على زر "حفظ" في الأسفل.
                                            </p>
                                        </div>
                                    </div>
                                    <!-- Step 2 -->
                                    <div class="flex gap-4">
                                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">2</div>
                                        <div>
                                            <h4 class="font-bold text-lg text-slate-800 mb-2">كيف أعدل ألوان المتجر واسمه؟</h4>
                                            <p class="text-slate-600 text-sm leading-relaxed mb-4">
                                                انتقل إلى قسم <strong>"الإعدادات & SEO"</strong>. ستجد خيارات لتغيير اسم المتجر، الشعار النصي، واللون الرئيسي.
                                                يمكنك أيضاً تحسين ظهورك في جوجل عن طريق تعديل "عنوان الصفحة (SEO)" والكلمات المفتاحية.
                                            </p>
                                        </div>
                                    </div>
                                    <!-- Step 3 -->
                                    <div class="flex gap-4">
                                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">3</div>
                                        <div>
                                            <h4 class="font-bold text-lg text-slate-800 mb-2">هل التعديلات تظهر فوراً؟</h4>
                                            <p class="text-slate-600 text-sm leading-relaxed mb-4">
                                                نعم! بمجرد الضغط على <strong>"حفظ التغييرات"</strong>، سيتم تحديث متجرك فوراً للزوار.
                                                نحن نستخدم تقنية (Client-Side Rendering) لضمان السرعة.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: SETTINGS -->
                        <div x-show="activeTab === 'settings'" class="space-y-8">
                            <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                                <h3 class="font-bold text-lg mb-6 text-slate-800 border-b pb-4">إعدادات الهوية</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-600 mb-2">اسم المتجر</label>
                                        <input type="text" x-model="config.storeName" class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-600 mb-2">الشعار النصي (Tagline)</label>
                                        <input type="text" x-model="config.tagline" class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-600 mb-2">اللون الرئيسي</label>
                                        <div class="flex items-center gap-3">
                                            <input type="color" x-model="config.primaryColor" class="h-12 w-20 rounded cursor-pointer">
                                            <input type="text" x-model="config.primaryColor" class="flex-1 border border-gray-300 rounded-lg px-4 py-3 uppercase font-mono">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-600 mb-2">شريط الإعلانات</label>
                                        <input type="text" x-model="config.announcementBar" class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                                    </div>
                                </div>
                                
                                <h3 class="font-bold text-lg mb-6 text-slate-800 border-b pb-4 pt-4">تحسين محركات البحث (SEO)</h3>
                                <div class="grid grid-cols-1 gap-6 mb-6">
                                     <div>
                                        <label class="block text-sm font-bold text-slate-600 mb-2">عنوان الصفحة (Page Title)</label>
                                        <input type="text" x-model="config.seoTitle" placeholder="أفضل متجر لبيع..." class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none">
                                    </div>
                                     <div>
                                        <label class="block text-sm font-bold text-slate-600 mb-2">الكلمات المفتاحية (Keywords)</label>
                                        <input type="text" x-model="config.seoKeywords" placeholder="تجارة, بيع, شراء, خصومات" class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none">
                                    </div>
                                </div>

                                <div class="flex justify-end">
                                    <button @click="saveChanges()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
                                        <i data-lucide="save" class="w-4 h-4"></i> حفظ التغييرات
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: PRODUCTS -->
                        <div x-show="activeTab === 'products'" class="space-y-6">
                             <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <h3 class="font-bold text-lg text-slate-800">قائمة المنتجات</h3>
                                <button @click="addProduct()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i> إضافة منتج
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 gap-4">
                                <template x-for="(product, index) in config.products">
                                    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start animate-fade-in">
                                        <div class="w-24 h-24 rounded-lg flex items-center justify-center text-3xl font-black text-black/10 shrink-0" :style="'background-color: ' + product.color" x-text="product.name.charAt(0)"></div>
                                        <div class="flex-1 w-full space-y-4">
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input type="text" x-model="product.name" class="font-bold text-slate-800 border-b border-gray-200 focus:border-indigo-500 outline-none bg-transparent py-1" placeholder="اسم المنتج">
                                                <div class="flex items-center gap-2">
                                                    <input type="text" x-model="product.price" class="font-bold text-emerald-600 border-b border-gray-200 focus:border-emerald-500 outline-none bg-transparent py-1 w-24 text-left" placeholder="السعر">
                                                    <span class="text-sm text-slate-400" x-text="config.currency"></span>
                                                </div>
                                            </div>
                                            <textarea x-model="product.description" class="w-full text-sm text-slate-500 border border-gray-200 rounded p-2 focus:border-indigo-500 outline-none resize-none" rows="2" placeholder="وصف المنتج"></textarea>
                                            <div class="flex justify-end gap-3 pt-2">
                                                <button @click="removeProduct(index)" class="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">حذف</button>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                             <div class="flex justify-end sticky bottom-6 z-30">
                                <button @click="saveChanges()" class="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-full font-bold shadow-2xl transition-all flex items-center gap-2 border-2 border-white/20 backdrop-blur-md">
                                    <i data-lucide="check" class="w-4 h-4"></i> حفظ جميع التعديلات
                                </button>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </template>
        
        <!-- Flash Message -->
        <div x-show="flashMessage" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0"
             x-transition:leave="transition ease-in duration-300"
             x-transition:leave-start="opacity-100 translate-y-0"
             x-transition:leave-end="opacity-0 translate-y-2"
             class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
            <i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>
            <span class="font-bold text-sm" x-text="flashMessage"></span>
        </div>

    </div>

    <!-- MAIN APP LOGIC -->
    <script>
        // 1. Inject Config from Builder
        const INJECTED_CONFIG = ${JSON.stringify(safeConfig)};

        function app() {
            return {
                config: INJECTED_CONFIG,
                currentRoute: 'store', // store, login, admin
                loginPassword: '',
                loginError: false,
                activeTab: 'dashboard',
                flashMessage: '',

                initApp() {
                    // Check URL hash for routing
                    this.checkHash();
                    window.addEventListener('hashchange', () => this.checkHash());
                    
                    // Load saved state from LocalStorage if exists
                    const saved = localStorage.getItem('ehab_store_' + this.config.subdomain);
                    if (saved) {
                        this.config = JSON.parse(saved);
                    }
                    
                    // Initialize Lucide Icons
                    this.$nextTick(() => {
                        if (window.lucide) window.lucide.createIcons();
                    });
                    
                    // Setup internal store to be accessible in <head>
                    Alpine.store('app', this);
                },

                checkHash() {
                    const hash = window.location.hash;
                    if (hash === '#/admin') {
                        // Check if already authenticated in session
                        if (sessionStorage.getItem('isAdmin') === 'true') {
                            this.currentRoute = 'admin';
                        } else {
                            this.currentRoute = 'login';
                        }
                    } else {
                        this.currentRoute = 'store';
                    }
                    this.$nextTick(() => {
                        if (window.lucide) window.lucide.createIcons();
                    });
                },

                checkLogin() {
                    if (this.loginPassword === this.config.adminPassword) {
                        sessionStorage.setItem('isAdmin', 'true');
                        this.currentRoute = 'admin';
                        this.loginPassword = '';
                        this.loginError = false;
                        window.location.hash = '#/admin';
                    } else {
                        this.loginError = true;
                    }
                },
                
                logout() {
                    sessionStorage.removeItem('isAdmin');
                    window.location.hash = '';
                    this.currentRoute = 'store';
                },

                navigateToAdmin() {
                    window.location.hash = '#/admin';
                },

                saveChanges() {
                    localStorage.setItem('ehab_store_' + this.config.subdomain, JSON.stringify(this.config));
                    this.showFlash('تم حفظ التغييرات بنجاح!');
                },

                addProduct() {
                    this.config.products.unshift({
                        name: 'منتج جديد',
                        price: '100',
                        description: 'وصف المنتج...',
                        color: '#cbd5e1'
                    });
                },

                removeProduct(index) {
                    if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                        this.config.products.splice(index, 1);
                    }
                },

                showFlash(msg) {
                    this.flashMessage = msg;
                    setTimeout(() => this.flashMessage = '', 3000);
                },
                
                getPageTitle() {
                    if (this.activeTab === 'dashboard') return 'نظرة عامة';
                    if (this.activeTab === 'guide') return 'دليل الاستخدام';
                    if (this.activeTab === 'products') return 'إدارة المنتجات';
                    return 'الإعدادات';
                }
            }
        }
    </script>
</body>
</html>`;
};


// --- Merchant Dashboard Component ---

const Dashboard = ({ config, onBack }: { config: StoreConfig; onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const getWhatsAppLink = () => {
    const message = `مرحباً إيهاب،\nلقد قمت بإنشاء متجر جديد.\nالاسم: ${config.storeName}\nالدومين: ${config.subdomain}.ehab.shop\n`;
    return `https://wa.me/201011500753?text=${encodeURIComponent(message)}`;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return (
           <div className="p-8 max-w-6xl mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">الطلبات</h2>
                <div className="flex gap-2">
                    <button className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-700 flex items-center gap-2"><Filter className="w-4 h-4" /> تصفية</button>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-500">تصدير CSV</button>
                </div>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-right text-sm">
                   <thead className="bg-slate-950 text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="p-4">رقم الطلب</th>
                        <th className="p-4">العميل</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">الإجمالي</th>
                        <th className="p-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800 text-slate-300">
                      {[1001, 1002, 1003, 1004].map((id) => (
                        <tr key={id} className="hover:bg-slate-800/50 transition-colors">
                           <td className="p-4 font-mono text-indigo-400">#{id}</td>
                           <td className="p-4">عميل افتراضي</td>
                           <td className="p-4 text-slate-500">منذ ساعتين</td>
                           <td className="p-4"><span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-md text-xs border border-yellow-500/20">قيد الانتظار</span></td>
                           <td className="p-4 font-bold">0.00 {config.currency}</td>
                           <td className="p-4 text-center text-slate-500 hover:text-white cursor-pointer"><MoreHorizontal className="w-4 h-4 mx-auto"/></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </div>
        );
      case "products":
        return (
           <div className="p-8 max-w-6xl mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">المنتجات ({config.products.length})</h2>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-500 flex items-center gap-2">
                    <Package className="w-4 h-4" /> إضافة منتج
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {config.products.map((p, i) => (
                    <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden group hover:border-indigo-500/50 transition-colors">
                       <div className="h-40 w-full flex items-center justify-center relative" style={{backgroundColor: p.color}}>
                          <span className="text-4xl font-black text-black/20">{p.name.charAt(0)}</span>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button className="p-2 bg-white rounded-full text-slate-900 hover:bg-slate-200"><Settings className="w-4 h-4" /></button>
                          </div>
                          {p.tag && <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">{p.tag}</span>}
                       </div>
                       <div className="p-4">
                          <h3 className="font-bold text-white truncate text-sm mb-1">{p.name}</h3>
                          <div className="flex justify-between items-center">
                             <span className="text-slate-400 text-xs font-mono">{p.price} {config.currency}</span>
                             <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                             </span>
                          </div>
                       </div>
                    </div>
                 ))}
                 <button className="bg-slate-900/50 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all min-h-[200px]">
                    <Package className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-bold">منتج جديد</span>
                 </button>
              </div>
           </div>
        );
      case "settings":
         return (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
               <h2 className="text-2xl font-bold mb-6 text-white">إعدادات المتجر</h2>
               <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 space-y-8">
                  <div>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-500"/> النطاق</h3>
                     <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300">
                        <span className="text-emerald-500"><CheckCircle className="w-4 h-4" /></span>
                        {config.subdomain}.ehab.shop
                        <span className="mr-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">نشط</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-400 text-sm mb-2 font-bold">اسم المتجر</label>
                        <input type="text" value={config.storeName} readOnly className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-sm mb-2 font-bold">لون الهوية</label>
                        <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-lg p-2 pr-4">
                            <div className="w-8 h-8 rounded shadow-sm" style={{backgroundColor: config.primaryColor}}></div>
                            <span className="text-slate-500 font-mono text-sm">{config.primaryColor}</span>
                        </div>
                      </div>
                  </div>

                  <div>
                     <label className="block text-slate-400 text-sm mb-2 font-bold">وصف المتجر (SEO)</label>
                     <textarea readOnly value={config.aboutUs} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 focus:outline-none h-24 resize-none text-sm leading-relaxed"></textarea>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                     <span className="text-xs text-slate-500">آخر تحديث: قبل دقيقة</span>
                     <button className="py-2 px-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-bold">
                        حذف المتجر
                     </button>
                  </div>
               </div>
            </div>
         );
      default:
        // Overview
        return (
            <main className="p-8 max-w-6xl mx-auto animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                         <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
                            <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <h3 className="text-slate-400 text-sm mb-1 font-medium">إجمالي المبيعات (تجريبي)</h3>
                        <p className="text-3xl font-bold text-white tracking-tight">0.00 <span className="text-lg text-slate-500 font-normal">{config.currency}</span></p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
                            <span className="text-xs text-blue-500 font-bold bg-blue-500/10 px-2 py-1 rounded-full">+5%</span>
                        </div>
                        <h3 className="text-slate-400 text-sm mb-1 font-medium">الزيارات الحالية</h3>
                        <p className="text-3xl font-bold text-white tracking-tight">1</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-purple-500/10 rounded-lg"><Package className="w-5 h-5 text-purple-500" /></div>
                        </div>
                        <h3 className="text-slate-400 text-sm mb-1 font-medium">الطلبات الجديدة</h3>
                        <p className="text-3xl font-bold text-white tracking-tight">0</p>
                    </div>
                </div>

                {/* Activation Alert */}
                <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 mb-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <h3 className="text-xl font-bold text-white">متجرك جاهز للإطلاق! 🚀</h3>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                لقد تم حجز الدومين <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{config.subdomain}.ehab.shop</span> بنجاح.
                                للبدء في استقبال الطلبات الحقيقية وتفعيل بوابات الدفع، يجب ربط المتجر بحسابك التجاري.
                            </p>
                        </div>
                        <a 
                            href={getWhatsAppLink()}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-green-900/20 transition-all transform hover:-translate-y-1 whitespace-nowrap group"
                        >
                            <Phone className="w-5 h-5 fill-current group-hover:animate-bounce" />
                            تفعيل المتجر الآن
                        </a>
                    </div>
                </div>

                {/* Recent Products Preview */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500"/> المنتجات المضافة حديثاً</h3>
                        <button onClick={() => setActiveTab("products")} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium hover:underline">عرض الكل</button>
                    </div>
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-950 text-slate-500">
                            <tr>
                                <th className="p-4 font-medium">المنتج</th>
                                <th className="p-4 font-medium">السعر</th>
                                <th className="p-4 font-medium">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {config.products.length > 0 ? config.products.slice(0, 3).map((p, i) => (
                                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-black/50" style={{backgroundColor: p.color}}>{p.name.charAt(0)}</div>
                                        <span className="font-bold text-slate-200">{p.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-400 font-mono">{p.price} {config.currency}</td>
                                    <td className="p-4"><span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-xs font-bold border border-emerald-500/20">نشط</span></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-500">لا توجد منتجات بعد</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex overflow-hidden" dir="rtl">
        {/* Sidebar */}
        <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">E</div>
                <div>
                    <span className="font-bold text-lg block">لوحة التاجر</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pro Account</span>
                </div>
            </div>
            
            <nav className="p-4 space-y-2 flex-1">
                <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === "overview" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                    <LayoutDashboard className="w-5 h-5" />
                    الرئيسية
                </button>
                <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === "orders" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                    <Package className="w-5 h-5" />
                    الطلبات
                    <span className="mr-auto bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">4</span>
                </button>
                <button onClick={() => setActiveTab("products")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === "products" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                    <ShoppingBag className="w-5 h-5" />
                    المنتجات
                </button>
                <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === "settings" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                    <Settings className="w-5 h-5" />
                    الإعدادات
                </button>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button onClick={onBack} className="w-full flex items-center gap-2 text-slate-500 hover:text-white transition-colors px-4 py-3 hover:bg-slate-800 rounded-xl">
                    <LogOut className="w-4 h-4" />
                    العودة للمصمم
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B0F19]">
            <header className="h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className="text-white font-bold text-lg">{config.storeName}</span>
                    <span className="text-slate-600">/</span>
                    <span>{activeTab === "overview" ? "الرئيسية" : activeTab === "orders" ? "الطلبات" : activeTab === "products" ? "المنتجات" : "الإعدادات"}</span>
                </div>
                <div className="flex items-center gap-6">
                     <div className="relative">
                        <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="بحث..." className="bg-slate-950 border border-slate-800 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-indigo-500 w-64 transition-all" />
                     </div>
                     <span className="flex items-center gap-2 text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 font-bold animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        بانتظار التفعيل
                     </span>
                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500 flex items-center justify-center font-bold">A</div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

// --- Publish Modal Component ---

const PublishModal = ({ config, onClose, onSuccess }: { config: StoreConfig; onClose: () => void; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [desiredSubdomain, setDesiredSubdomain] = useState(config.subdomain || "");
  const [clientPhone, setClientPhone] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [serverConfig, setServerConfig] = useState({
      ip: "",
      dbUrl: "",
      apiKey: ""
  });

  // Ensure admin password exists
  const [adminPassword] = useState(config.adminPassword || Math.random().toString(36).slice(-8));

  const handleNextStep = () => {
      setStep(prev => prev + 1);
  }

  // --- AWS Upload Logic ---
  const uploadStoreToAWS = async () => {
      // التحقق من وجود مفاتيح الاتصال
      if (!AWS_CONFIG.ACCESS_KEY_ID || !AWS_CONFIG.SECRET_ACCESS_KEY) {
          console.error("AWS Credentials Missing! Please set them in index.tsx");
          return false;
      }

      // إعداد العميل (Client)
      const s3Client = new S3Client({
          region: AWS_CONFIG.REGION,
          credentials: {
              accessKeyId: AWS_CONFIG.ACCESS_KEY_ID,
              secretAccessKey: AWS_CONFIG.SECRET_ACCESS_KEY
          }
      });

      // تحضير الملف
      const finalConfig = { ...config, adminPassword, subdomain: desiredSubdomain };
      const htmlContent = generateStaticStoreHTML(finalConfig);
      const fileName = `${desiredSubdomain || 'store'}.html`;

      // أمر الرفع
      const params = {
          Bucket: AWS_CONFIG.BUCKET_NAME,
          Key: fileName,
          Body: htmlContent,
          ContentType: "text/html",
          CacheControl: "max-age=0"
      };

      try {
          // Try with ACL public-read first
          try {
            await s3Client.send(new PutObjectCommand({
                ...params,
                ACL: "public-read" 
            }));
          } catch (aclError) {
             console.warn("ACL upload failed, trying without ACL (Bucket Policy might be sufficient)", aclError);
             // Retry without ACL
             await s3Client.send(new PutObjectCommand(params));
          }
          
          console.log("Successfully uploaded to AWS S3");
          return true;
      } catch (e) {
          console.error("AWS S3 Upload Error:", e);
          return false;
      }
  };

  const handlePublish = async () => {
    setStep(3);
    setUploadStatus("uploading");

    // محاولة الرفع الفعلي لـ AWS
    const uploaded = await uploadStoreToAWS();
    
    // تحميل نسخة احتياطية دائماً
    downloadStoreHTML();

    setTimeout(() => {
      setUploadStatus(uploaded ? "success" : "error"); 
      
      // في حالة النجاح، الرابط هو رابط البكت المباشر أو CloudFront إذا تم إعداده
      // سأفترض هنا رابط S3 المباشر للتجربة
      const publicLink = `https://${AWS_CONFIG.BUCKET_NAME}.s3.${AWS_CONFIG.REGION}.amazonaws.com/${desiredSubdomain}.html`;
      const adminLink = `${publicLink}#/admin`;
      
      // Send WhatsApp Notification to Owner
      const message = `🚀 *New Order Alert (AWS S3 Upload)*\n\nStore: ${config.storeName}\nSubdomain: ${desiredSubdomain}\nClient Phone: ${clientPhone}\n\n🔐 *Admin Access:*\nURL: ${adminLink}\nPass: ${adminPassword}\n\nStatus: ${uploaded ? 'Uploaded to AWS S3 ✅' : 'Upload Failed (Keys missing?) ❌'}`;
      const waLink = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(message)}`;
      window.open(waLink, '_blank');
      
      // onSuccess(); // Removed to allow user to see the success screen
    }, 4000); 
  };

  const fillMockData = () => {
      // تعبئة بيانات وهمية للعرض فقط في واجهة المستخدم، الاتصال الحقيقي يعتمد على الثوابت في الأعلى
      setServerConfig({
          ip: "54.234.112.55", // Mock AWS IP
          dbUrl: "postgres://admin:aws-rds-secure-db",
          apiKey: "aws_access_key_id_..."
      });
  };

  const downloadStoreHTML = () => {
    const finalConfig = { ...config, adminPassword, subdomain: desiredSubdomain };
    const htmlContent = generateStaticStoreHTML(finalConfig);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${desiredSubdomain || 'store'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStoreUrl = () => `https://${AWS_CONFIG.BUCKET_NAME}.s3.${AWS_CONFIG.REGION}.amazonaws.com/${desiredSubdomain}.html`;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-800 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
        </button>
        
        {step === 1 && (
          <div className="p-10 animate-fade-in">
            <div className="flex justify-center mb-8">
              <div className="bg-indigo-500/10 p-5 rounded-full ring-1 ring-indigo-500/50 relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20"></div>
                <Globe className="w-12 h-12 text-indigo-400 relative z-10" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-white mb-3">إطلاق متجرك للعالم 🚀</h2>
            <p className="text-center text-slate-400 mb-8 leading-relaxed">
              اختر اسم الدومين الفرعي الخاص بك على شبكة <span className="font-mono text-indigo-400">ehab.shop</span>
            </p>
            
            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">رابط المتجر المقترح</label>
                    <div className="flex bg-slate-950 rounded-xl border border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all overflow-hidden group hover:border-slate-700">
                        <span className="px-4 py-4 text-slate-500 bg-slate-900 border-l border-slate-800 font-mono text-sm flex items-center select-none" dir="ltr">.ehab.shop</span>
                        <input 
                        type="text" 
                        value={desiredSubdomain}
                        onChange={(e) => setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="my-awesome-store"
                        className="flex-1 bg-transparent text-white px-4 py-4 focus:outline-none text-left font-mono font-bold tracking-tight"
                        dir="ltr"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">رقم الواتساب (لإشعارك عند الانتهاء)</label>
                    <div className="flex bg-slate-950 rounded-xl border border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all overflow-hidden group hover:border-slate-700">
                        <Phone className="w-5 h-5 text-slate-500 m-4 ml-0" />
                        <input 
                        type="tel" 
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="05xxxxxxxx"
                        className="flex-1 bg-transparent text-white px-4 py-4 focus:outline-none text-right font-mono font-bold tracking-tight"
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={handleNextStep}
                disabled={!desiredSubdomain || !clientPhone}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
                التالي: إعداد السيرفر السحابي
            </button>
          </div>
        )}

        {step === 2 && (
            <div className="p-10 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-slate-800 rounded-xl"><Cloud className="w-6 h-6 text-indigo-400" /></div>
                    <div>
                        <h2 className="text-xl font-bold text-white">بيانات AWS Cloud</h2>
                        <p className="text-xs text-slate-400">تكوين S3 Buckets و CloudFront CDN</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">AWS Elastic IP (Host)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={serverConfig.ip}
                                onChange={(e) => setServerConfig({...serverConfig, ip: e.target.value})}
                                placeholder="e.g. 54.123.45.67" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                                dir="ltr"
                            />
                            <Network className="w-4 h-4 text-slate-600 absolute right-3 top-3.5" />
                        </div>
                    </div>
                    
                    {/* Admin Password Display */}
                    <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4">
                        <label className="block text-xs font-bold text-indigo-400 mb-2 flex items-center gap-2">
                             <Key className="w-3 h-3" />
                             كلمة مرور لوحة تحكم العميل (Admin)
                        </label>
                        <div className="flex items-center justify-between">
                            <span className="text-white font-mono font-bold text-lg tracking-wider select-all">{adminPassword}</span>
                            <span className="text-xs text-slate-500">تم التوليد تلقائياً</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 text-xs text-yellow-500 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>سيتم دمج لوحة التحكم (Admin Panel) داخل ملف المتجر تلقائياً لسهولة الإدارة.</p>
                </div>

                <div className="flex gap-3">
                     <button 
                        onClick={fillMockData}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                    >
                        تهيئة تلقائية
                    </button>
                    <button 
                        onClick={handlePublish}
                        disabled={!serverConfig.ip}
                        className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        رفع ونشر (Deploy)
                    </button>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="p-16 text-center animate-fade-in">
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    {uploadStatus === 'uploading' && <Cloud className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />}
                    {uploadStatus === 'success' && <CheckCircle className="absolute inset-0 m-auto w-10 h-10 text-emerald-400" />}
                    {uploadStatus === 'error' && <AlertCircle className="absolute inset-0 m-auto w-10 h-10 text-red-400" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-6">
                    {uploadStatus === 'uploading' ? 'جاري الرفع إلى AWS S3...' : (uploadStatus === 'success' ? 'تم النشر بنجاح! 🎉' : 'فشل الاتصال بـ AWS')}
                </h3>
                
                {uploadStatus === 'uploading' ? (
                    <div className="flex flex-col gap-3 text-sm text-slate-400 text-right max-w-xs mx-auto">
                        <div className="flex items-center gap-3 animate-fade-in [animation-delay:0.5s]">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-emerald-500" /></div>
                            <span>بناء التطبيق (Static Generation)</span>
                        </div>
                        <div className="flex items-center gap-3 animate-fade-in [animation-delay:1.5s]">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Lock className="w-3 h-3 text-emerald-500" /></div>
                            <span>إعداد بوابة الدخول الآمنة</span>
                        </div>
                        <div className="flex items-center gap-3 animate-fade-in [animation-delay:2.5s]">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Cloud className="w-3 h-3 text-emerald-500" /></div>
                            <span>مزامنة مع CloudFront CDN</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-emerald-100 text-sm leading-relaxed animate-fade-in text-right">
                        <p className="mb-4">
                           {uploadStatus === 'success' ? 'شكراً لك! لقد تم رفع ملفات المتجر بنجاح.' : 'لم نتمكن من الرفع لعدم وجود مفاتيح AWS، ولكن تم حفظ الملف محلياً.'}
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/30 mb-4">
                            <p className="text-xs text-slate-400 mb-1">رابط لوحة التحكم:</p>
                            <p className="text-emerald-400 font-mono text-xs dir-ltr">https://{desiredSubdomain}.ehab.shop/#/admin</p>
                            <div className="mt-2 pt-2 border-t border-slate-800">
                                <p className="text-xs text-slate-400 mb-1">كلمة المرور:</p>
                                <p className="text-white font-mono font-bold text-lg tracking-wider">{adminPassword}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 text-center">
                           تم تحميل نسخة احتياطية (HTML) على جهازك.
                        </p>
                        
                        {uploadStatus === 'success' && (
                            <div className="mt-6 flex flex-col gap-3">
                                <a 
                                    href={getStoreUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white text-emerald-600 px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    زيارة المتجر الحي
                                </a>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(getStoreUrl())}
                                    className="bg-slate-800 text-slate-300 px-6 py-3 rounded-full font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    نسخ الرابط
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// --- Authentication Component ---

const AuthScreen = () => {
    const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        try {
            if (authMode === 'register') {
                if (!formData.name) throw new Error("الاسم مطلوب");
                
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name,
                            phone: formData.phone
                        }
                    }
                });
                
                if (error) throw error;
                // If email confirmation is required, Supabase might not return a session immediately.
                if (!data.session && !error) {
                    alert("تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى التحقق منه.");
                }

            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });
                if (error) throw error;
            }
        } catch (error: any) {
            console.error("Auth Error:", error);
            setErrorMsg(error.message || "حدث خطأ أثناء الاتصال بالخادم");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            
            <div className="w-full max-w-5xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-slate-800">
                
                {/* Visual Side */}
                <div className="w-full md:w-1/2 relative bg-indigo-900 p-12 flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-2 text-indigo-300 text-xs font-bold mb-6">
                            <Sparkles className="w-4 h-4" />
                            الذكاء الاصطناعي بين يديك
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                            ابنِ متجرك الإلكتروني في <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">ثوانٍ معدودة</span>
                        </h1>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
                            انضم لأكثر من 10,000 تاجر يستخدمون إيهاب شوب لبناء مستقبل تجارتهم.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">مجاني</div>
                            <div className="text-xs text-slate-400">ابدأ بدون تكاليف</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">سريع</div>
                            <div className="text-xs text-slate-400">جاهز في دقيقة</div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full md:w-1/2 p-12 bg-slate-900">
                    <div className="flex justify-end mb-8">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button 
                                onClick={() => { setAuthMode('register'); setErrorMsg(""); }}
                                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                إنشاء حساب
                            </button>
                            <button 
                                onClick={() => { setAuthMode('login'); setErrorMsg(""); }}
                                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                دخول
                            </button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {authMode === 'register' ? 'ابدأ رحلتك الآن' : 'مرحباً بعودتك'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {authMode === 'register' ? 'قم بتعبئة البيانات لإنشاء متجرك فوراً' : 'سجل دخولك لمتابعة إدارة متاجرك'}
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {authMode === 'register' && (
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 mb-2">الاسم الكامل</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="محمد أحمد"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                    <User className="w-5 h-5 text-slate-600 absolute left-3 top-3" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">البريد الإلكتروني</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    required 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                <Mail className="w-5 h-5 text-slate-600 absolute left-3 top-3" />
                            </div>
                        </div>

                        {authMode === 'register' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">رقم الهاتف (اختياري)</label>
                                <div className="relative">
                                    <input 
                                        type="tel" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="05xxxxxxxx"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                    <Smartphone className="w-5 h-5 text-slate-600 absolute left-3 top-3" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">كلمة المرور</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    required 
                                    minLength={6}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                                <Lock className="w-5 h-5 text-slate-600 absolute left-3 top-3" />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 mt-6 group disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {authMode === 'register' ? 'إنشاء الحساب مجاناً' : 'تسجيل الدخول'}
                                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800">
                        <div className="flex gap-4">
                            <button className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-sm">
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [appMode, setAppMode] = useState<"builder" | "dashboard">("builder");
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(initialStoreConfig);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "أهلاً بك في **وكالة إيهاب شوب**. \n\nأنا مهندس المتاجر الذكي الخاص بك. سأقوم بتصميم وبرمجة متجرك بالكامل في ثوانٍ.\n\nما هو نشاط متجرك؟ (مثلاً: متجر عطور، إلكترونيات، ملابس أطفال...)" }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session?.user) {
              updateUserProfile(session.user);
              setIsAuthenticated(true);
          }
      });

      // 2. Listen for changes
      const {
          data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session?.user) {
              updateUserProfile(session.user);
              setIsAuthenticated(true);
          } else {
              setIsAuthenticated(false);
              setCurrentUser(null);
          }
      });

      return () => subscription.unsubscribe();
  }, []);

  const updateUserProfile = (user: any) => {
      setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || 'مستخدم',
          phone: user.user_metadata?.phone
      });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!process.env.API_KEY) {
      alert("API Key is missing!");
      return;
    }

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Current Store Config: ${JSON.stringify(storeConfig)}
        User Request: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: storeSchema
        }
      });

      const jsonResponse = JSON.parse(response.text);
      
      if (jsonResponse.storeName) {
        setStoreConfig(prev => ({
          ...prev,
          storeName: jsonResponse.storeName || prev.storeName,
          tagline: jsonResponse.tagline || prev.tagline,
          aboutUs: jsonResponse.aboutUs || prev.aboutUs,
          primaryColor: jsonResponse.primaryColor || prev.primaryColor,
          secondaryColor: jsonResponse.secondaryColor || prev.secondaryColor,
          announcementBar: jsonResponse.announcementBar || prev.announcementBar,
          currency: jsonResponse.currency || prev.currency,
          products: jsonResponse.products?.length > 0 ? jsonResponse.products : prev.products,
          features: jsonResponse.features?.length > 0 ? jsonResponse.features : prev.features,
          testimonials: jsonResponse.testimonials?.length > 0 ? jsonResponse.testimonials : prev.testimonials,
          faq: jsonResponse.faq?.length > 0 ? jsonResponse.faq : prev.faq,
          blogPosts: jsonResponse.blogPosts?.length > 0 ? jsonResponse.blogPosts : prev.blogPosts,
          subdomain: jsonResponse.suggestedSubdomain || prev.subdomain
        }));
      }

      setMessages((prev) => [
        ...prev,
        { role: "model", content: jsonResponse.messageToUser || "تم تحديث التصميم بنجاح!" }
      ]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "عذراً، واجهت مشكلة صغيرة في الخادم. هل يمكنك إعادة صياغة طلبك؟" }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCart = (product: Product) => {
    setCartItems([...cartItems, product]);
    setIsCartOpen(true);
  };

  if (!isAuthenticated) {
      return (
        <div>
            {!isSupabaseConfigured && (
                <div className="bg-red-600 text-white text-xs font-bold text-center py-2 px-4 fixed top-0 left-0 right-0 z-[100] shadow-lg animate-pulse">
                    ⚠️ تنبيه: لم يتم ربط Supabase بعد. يرجى إضافة الروابط (URL & Key) في الكود لتفعيل المصادقة الحقيقية.
                </div>
            )}
            <AuthScreen />
        </div>
      );
  }

  if (appMode === "dashboard") {
    return <Dashboard config={storeConfig} onBack={() => setAppMode("builder")} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {!isSupabaseConfigured && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1 px-4 fixed top-0 left-0 right-0 z-[100]">
            ⚠️ تنبيه: وضع المصادقة الوهمي (Supabase غير مربوط)
        </div>
      )}

      {/* Sidebar / Chat Interface */}
      <div className="w-full md:w-[420px] flex flex-col border-l border-slate-800 bg-slate-900/90 backdrop-blur-xl z-20 shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">Ehab.Shop</h1>
              <p className="text-[11px] text-slate-400 font-medium">Welcome, {currentUser?.name}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
             <LogOut className="w-3 h-3" />
             خروج
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"} animate-fade-in`}
            >
              {msg.role === "model" && (
                 <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center ml-2 shrink-0 border border-indigo-400">
                    <Cpu className="w-4 h-4 text-white" />
                 </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-md text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-800 text-slate-200 rounded-br-none border border-slate-700"
                    : "bg-white text-slate-800 rounded-bl-none shadow-xl"
                }`}
              >
                <div className={`prose prose-sm ${msg.role === "user" ? "prose-invert" : ""}`}>
                   <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 px-4">
              <div className="flex space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
              جاري التصميم...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                  if(e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                  }
              }}
              placeholder="اكتب ماذا تريد أن تبيع... (مثلاً: متجر أحذية رياضية)"
              className="w-full bg-slate-950 text-white rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-800 transition-all placeholder-slate-600 resize-none h-14 scrollbar-hide"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !input.trim()}
              className="absolute left-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2">
            Powered by Google Gemini 2.5 Flash
          </p>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="hidden md:flex flex-1 flex-col bg-slate-950 relative">
        
        {/* Toolbar */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur mt-6">
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              <button 
                onClick={() => setViewMode("desktop")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewMode === "desktop" ? "bg-slate-700 text-white shadow ring-1 ring-slate-600" : "text-slate-400 hover:text-white"}`}
              >
                <Monitor className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setViewMode("mobile")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${viewMode === "mobile" ? "bg-slate-700 text-white shadow ring-1 ring-slate-600" : "text-slate-400 hover:text-white"}`}
              >
                <Smartphone className="w-3 h-3" />
              </button>
            </div>
            
            <div className="h-6 w-px bg-slate-800"></div>

            {storeConfig.subdomain && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full group cursor-pointer hover:bg-indigo-500/20 transition-colors">
                 <Globe className="w-3 h-3 text-indigo-400 group-hover:animate-spin-slow" />
                 <span className="text-xs text-indigo-300 font-mono tracking-wide">{storeConfig.subdomain}.ehab.shop</span>
               </div>
            )}
          </div>

          <button
            onClick={() => setShowPublishModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            نشر المتجر الآن
          </button>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#0f1115] relative">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
           </div>

          <div 
            className={`transition-all duration-500 ease-in-out bg-white text-slate-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col
              ${viewMode === "mobile" 
                ? "w-[390px] h-[800px] rounded-[3.5rem] border-[12px] border-slate-900 bg-black shadow-2xl my-auto" 
                : "w-full max-w-[1200px] h-full rounded-lg border border-slate-800/50"}
            `}
            style={{
              fontFamily: "'Cairo', sans-serif"
            }}
          >
            {/* Mobile Notch Mockup */}
            {viewMode === "mobile" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-2xl z-50 flex justify-center items-center pointer-events-none">
                    <div className="w-16 h-1 bg-slate-800 rounded-full opacity-50"></div>
                </div>
            )}

            {/* --- STORE INNER CONTENT --- */}

            {/* Announcement Bar */}
            {storeConfig.announcementBar && (
              <div className="px-4 py-2 text-center text-xs font-bold text-white relative z-20" style={{ backgroundColor: storeConfig.primaryColor }}>
                {storeConfig.announcementBar}
              </div>
            )}

            {/* Navbar */}
            <nav className="px-6 h-16 sm:h-20 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-100" dir="rtl">
              <div className="flex items-center gap-4">
                  <div className="md:hidden">
                    <Menu className="w-6 h-6 text-slate-800" />
                  </div>
                  <div className="font-black text-xl sm:text-2xl tracking-tight flex items-center gap-2" style={{ color: storeConfig.primaryColor }}>
                    <Store className="w-6 h-6" />
                    {storeConfig.storeName}
                  </div>
              </div>
              
              <div className={`hidden md:flex gap-8 text-sm font-bold text-slate-600`}>
                <a href="#" className="hover:text-black transition-colors">الرئيسية</a>
                <a href="#" className="hover:text-black transition-colors">المنتجات</a>
                <a href="#blog" className="hover:text-black transition-colors">المدونة</a>
                <a href="#contact" className="hover:text-black transition-colors">اتصل بنا</a>
              </div>

              <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 hover:bg-slate-50 rounded-full transition-colors"
                 >
                    <ShoppingBag className="w-6 h-6 text-slate-800" />
                    {cartItems.length > 0 && (
                        <span className="absolute top-1 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm animate-bounce-short">
                            {cartItems.length}
                        </span>
                    )}
                 </button>
              </div>
            </nav>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                
                {/* Hero Section */}
                <header className="relative py-20 px-6 overflow-hidden min-h-[500px] flex items-center justify-center" dir="rtl">
                  <div className="absolute inset-0" 
                      style={{ 
                          background: `radial-gradient(circle at top left, ${storeConfig.secondaryColor}, white)`,
                          opacity: 0.8
                      }}>
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: storeConfig.primaryColor }}></div>
                  <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: storeConfig.primaryColor }}></div>
                  
                  <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 text-xs font-bold mb-8 animate-fade-in-up">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        الخيار الأول للعملاء في الشرق الأوسط
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 text-slate-900 leading-[1.1] tracking-tight drop-shadow-sm">
                      {storeConfig.tagline}
                    </h1>
                    <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                      {storeConfig.aboutUs}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                        className="px-10 py-4 rounded-xl text-white font-bold text-lg shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-all"
                        style={{ backgroundColor: storeConfig.primaryColor }}
                        >
                        تسوق الآن
                        </button>
                        <button className="px-10 py-4 rounded-xl text-slate-700 font-bold text-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                           <Eye className="w-5 h-5" />
                            شاهد الفيديو
                        </button>
                    </div>
                  </div>
                </header>

                {/* Features Section */}
                <section className="py-16 px-6 bg-white border-b border-slate-50" dir="rtl">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        {storeConfig.features.map((feature, i) => (
                            <div key={i} className="flex gap-4 items-start p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
                                    style={{ backgroundColor: storeConfig.primaryColor }}>
                                    {feature.iconType === 'shield' && <ShieldCheck className="w-6 h-6" />}
                                    {feature.iconType === 'truck' && <Truck className="w-6 h-6" />}
                                    {feature.iconType === 'zap' && <Zap className="w-6 h-6" />}
                                    {feature.iconType === 'star' && <Star className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{feature.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Products Grid */}
                <section className="py-24 px-6 bg-slate-50/50" dir="rtl">
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">منتجاتنا الحصرية</h2>
                            <p className="text-slate-500">تم اختيارها بعناية لتناسب ذوقك الرفيع</p>
                        </div>
                        <a href="#" className="hidden sm:block text-sm font-bold hover:underline" style={{ color: storeConfig.primaryColor }}>عرض المتجر بالكامل &larr;</a>
                    </div>
                  
                  {storeConfig.products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold">جاري استيراد المنتجات من المصنع...</p>
                      <p className="text-slate-300 text-sm mt-2">سيقوم الذكاء الاصطناعي بإضافة المنتجات الآن</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {storeConfig.products.map((product, idx) => (
                        <div key={idx} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-slate-100 overflow-hidden relative">
                          {product.tag && (
                              <div className="absolute top-4 right-4 z-10 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                  {product.tag}
                              </div>
                          )}
                          <div 
                            className="h-72 w-full flex items-center justify-center relative overflow-hidden group-hover:bg-opacity-90 transition-all cursor-pointer"
                            style={{ backgroundColor: product.color || "#e2e8f0" }}
                            onClick={() => setQuickViewProduct(product)}
                          >
                             <span className="text-6xl font-black text-black/10 select-none scale-150 group-hover:scale-100 transition-transform duration-500">
                                {product.name.substring(0,2)}
                             </span>
                             
                             {/* Quick Actions Overlay */}
                             <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center pb-6">
                                <button className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-lg text-sm hover:scale-105 transition-transform flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> نظرة سريعة
                                </button>
                             </div>
                          </div>
                          
                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg text-slate-900 leading-tight hover:text-indigo-600 transition-colors cursor-pointer">{product.name}</h3>
                              <span className="font-bold text-lg" dir="ltr" style={{ color: storeConfig.primaryColor }}>{product.price} {storeConfig.currency}</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>
                            <button 
                              onClick={() => addToCart(product)}
                              className="w-full py-3 rounded-xl font-bold border transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900"
                              style={{ 
                                borderColor: storeConfig.primaryColor, 
                                color: storeConfig.primaryColor,
                               }}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              إضافة للسلة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </section>

                {/* FAQ Section */}
                {storeConfig.faq.length > 0 && (
                    <section className="py-20 px-6 bg-white" dir="rtl">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">الأسئلة الشائعة</h2>
                            <div className="space-y-4">
                                {storeConfig.faq.map((item, i) => (
                                    <div key={i} className="border border-slate-100 rounded-2xl p-6 hover:border-slate-300 transition-colors bg-slate-50/50">
                                        <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                                            <HelpCircle className="w-5 h-5 text-slate-400" />
                                            {item.question}
                                        </h3>
                                        <p className="text-slate-500 leading-relaxed pr-7">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                 {/* Blog Section */}
                 {storeConfig.blogPosts.length > 0 && (
                    <section id="blog" className="py-20 px-6 bg-slate-50" dir="rtl">
                         <div className="max-w-6xl mx-auto">
                            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">مدونة المتجر</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {storeConfig.blogPosts.map((post, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                            <FileText className="w-3 h-3" />
                                            <span>{post.date}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3">{post.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                                        <a href="#" className="text-sm font-bold flex items-center gap-1" style={{ color: storeConfig.primaryColor }}>
                                            اقرأ المزيد <ArrowLeft className="w-3 h-3" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </section>
                 )}

                {/* Testimonials */}
                <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden" dir="rtl">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
                        <h2 className="text-3xl font-bold mb-4">قصص نجاح عملائنا</h2>
                        <div className="flex justify-center gap-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                        </div>
                    </div>
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {storeConfig.testimonials.length > 0 ? storeConfig.testimonials.map((t, i) => (
                            <div key={i} className="bg-slate-800 p-8 rounded-2xl relative border border-slate-700 hover:-translate-y-2 transition-transform duration-300">
                                <div className="text-6xl text-slate-700 absolute top-4 left-4 font-serif opacity-50">"</div>
                                <p className="text-slate-300 mb-6 relative z-10 text-sm leading-loose">{t.text}</p>
                                <div className="flex items-center gap-4 border-t border-slate-700 pt-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">{t.author}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">عميل مميز</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center text-slate-600">سيتم إضافة التقييمات قريباً</div>
                        )}
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-20 px-6 bg-white" dir="rtl">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">تواصل معنا</h2>
                        <div className="bg-slate-50 p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-6 text-right">
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500"/> العنوان</h3>
                                    <p className="text-slate-500 text-sm">الرياض، المملكة العربية السعودية</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-500"/> البريد الإلكتروني</h3>
                                    <p className="text-slate-500 text-sm">{storeConfig.contactEmail}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Phone className="w-5 h-5 text-indigo-500"/> الهاتف</h3>
                                    <p className="text-slate-500 text-sm">+966 50 000 0000</p>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-200 rounded-2xl flex items-center justify-center min-h-[200px] relative overflow-hidden group cursor-pointer">
                                <span className="text-slate-400 font-bold flex items-center gap-2 relative z-10"><MapPin className="w-6 h-6"/> Google Maps</span>
                                <div className="absolute inset-0 bg-slate-300 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Newsletter */}
                <section className="py-20 px-6 bg-white text-center border-t border-slate-100" dir="rtl">
                    <div className="max-w-2xl mx-auto p-10 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                        <Mail className="w-10 h-10 mx-auto mb-6 text-indigo-400" />
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">نشرة العروض السرية</h2>
                        <p className="text-slate-500 mb-8">كن أول من يعلم عن الخصومات الحصرية والمنتجات الجديدة.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input type="email" placeholder="أدخل بريدك الإلكتروني" className="flex-1 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                            <button 
                                className="px-8 py-3 rounded-xl font-bold text-white transition-shadow shadow-lg"
                                style={{ backgroundColor: storeConfig.primaryColor }}
                            >
                                اشتراك
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 px-6" dir="rtl">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-12">
                    <div className="text-right max-w-xs">
                        <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold text-xl">
                            <Store className="w-6 h-6" />
                            {storeConfig.storeName}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            {storeConfig.aboutUs.substring(0, 100)}...
                        </p>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors"><Twitter className="w-4 h-4 text-slate-600"/></div>
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors"><Instagram className="w-4 h-4 text-slate-600"/></div>
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 cursor-pointer transition-colors"><Facebook className="w-4 h-4 text-slate-600"/></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">روابط سريعة</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-indigo-600">الرئيسية</a></li>
                                <li><a href="#" className="hover:text-indigo-600">من نحن</a></li>
                                <li><a href="#" className="hover:text-indigo-600">المنتجات</a></li>
                                <li><a href="#" className="hover:text-indigo-600">اتصل بنا</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">الدعم الفني</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-indigo-600">الأسئلة الشائعة</a></li>
                                <li><a href="#" className="hover:text-indigo-600">سياسة الشحن</a></li>
                                <li><a href="#" className="hover:text-indigo-600">الإرجاع والاستبدال</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                        <p>© 2024 {storeConfig.storeName}. جميع الحقوق محفوظة.</p>
                        <p>Designed by Ehab.Shop Agency</p>
                </div>
                </footer>
            </div>

            {/* Quick View Modal */}
            {quickViewProduct && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-[500px] md:h-auto">
                        <button 
                            onClick={() => setQuickViewProduct(null)}
                            className="absolute top-4 left-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 z-10"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="w-full md:w-1/2 h-64 md:h-auto flex items-center justify-center" style={{ backgroundColor: quickViewProduct.color }}>
                            <span className="text-8xl font-black text-black/10">{quickViewProduct.name.charAt(0)}</span>
                        </div>
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{quickViewProduct.name}</h3>
                            <div className="text-xl font-bold text-emerald-600 mb-4">{quickViewProduct.price} {storeConfig.currency}</div>
                            <p className="text-slate-500 mb-8 leading-relaxed text-sm">{quickViewProduct.description}</p>
                            <button 
                                onClick={() => {
                                    addToCart(quickViewProduct);
                                    setQuickViewProduct(null);
                                }}
                                className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95"
                                style={{ backgroundColor: storeConfig.primaryColor }}
                            >
                                إضافة للسلة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Drawer */}
            <div className={`absolute top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} dir="rtl">
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">سلة المشتريات ({cartItems.length})</h3>
                        <button onClick={() => setIsCartOpen(false)}><X className="w-6 h-6 text-slate-500" /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {cartItems.length === 0 ? (
                            <div className="text-center text-slate-400 mt-20">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>السلة فارغة</p>
                            </div>
                        ) : (
                            cartItems.map((item, i) => (
                                <div key={i} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-16 h-16 rounded-lg shrink-0" style={{ backgroundColor: item.color }}></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                                        <p className="text-emerald-600 text-sm font-bold">{item.price} {storeConfig.currency}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6 mt-4">
                         <div className="flex justify-between font-bold text-lg mb-4 text-slate-900">
                             <span>المجموع</span>
                             <span>--- {storeConfig.currency}</span>
                         </div>
                         <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                             إتمام الطلب (تجريبي)
                         </button>
                    </div>
                </div>
            </div>

            {/* --- END STORE INNER CONTENT --- */}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal 
          config={storeConfig} 
          onClose={() => setShowPublishModal(false)}
          onSuccess={() => {
            setShowPublishModal(false);
            setAppMode("dashboard");
          }}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);