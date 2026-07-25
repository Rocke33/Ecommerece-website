# 🛒 Bongo Shop (Rocke Dev E-Commerce Hub)

A high-performance, full-stack Single Page Application (SPA) e-commerce hub engineered with a React/TypeScript frontend, Tailwind CSS, and a robust backend infrastructure powered by Supabase (PostgreSQL). The application features smooth client-side routing, live payment verification flows, real-time database functions, and optimized deployment configurations on Vercel.

🌐 **Live Application:** [bongo-shop-nu.vercel.app](https://bongo-shop-nu.vercel.app/)

---

## 🚀 Core Technical Features

*   **Advanced Database Aggregations (Supabase RPCs):** Implemented highly performant custom database functions to compile real-time tracking for the "Top Sales" catalog stream, securely bypassing strict Row Level Security (RLS) constraints for unauthorized guest views.
*   **Dynamic Client-Side Routing:** Configured production-grade distributed single-page rewrite fallbacks via a custom `vercel.json` architecture to guarantee zero `404 Not Found` navigation dropouts upon hard page refreshes.
*   **Interactive UI/UX & Global Search:** Designed a responsive, viewport-synchronized contextual framework allowing live catalog queries across next-gen electronics, apparel, and lifestyle items.
*   **End-To-End Secure Purchase Flows:** Built a comprehensive checkout handling structural validation, automated cart teardowns, and live Bangladeshi mobile financial services verification references (bKash, Nagad, Cash on Delivery).
*   **Administrative Inventory Management:** Features an integrated Admin Control interface for real-time item configurations and core order tracking pipelines.

---

## 🛠️ The Modern Tech Stack

*   **Frontend UI Layer:** React (Vite ecosystem), TypeScript
*   **Styling Engine:** Tailwind CSS (Modern responsive utility layouts)
*   **Backend & Database:** Supabase (PostgreSQL relational architecture with RPC triggers)
*   **Hosting & Operations:** Vercel Global Edge Network

---

## 📦 Repository Architecture

```text
├── public/                 # Static graphical assets
├── src/
│   ├── components/         # Reusable application components (CheckoutForm, etc.)
│   ├── pages/              # Structured view panels (Home, Products, Profile, Admin)
│   ├── supabaseClient.ts   # Client wrapper interface configuration
│   ├── App.tsx             # Main core application router layout container
│   └── main.tsx            # Global entry point mounting execution
├── vercel.json             # Single Page Application rewrite rules & cache routing
├── package.json            # Package dependencies 
└── README.md               # Repository documentation