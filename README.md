# Sakhi Suta Luxury (74)

Build a **production-ready, dark luxury 3D saree e-commerce website** named **“Sakhi Suta”** using Lovable AI. The website must be visually premium, highly interactive, fully editable via admin, and scalable.



---



## 🧠 CORE INSTRUCTION



This must NOT be a simple template.

Generate a **fully functional, component-based, CMS-driven website** with clean structure, reusable components, and admin-editable data.



---



## 🎨 DESIGN SYSTEM



* Theme: **Dark Luxury**



  * Colors: Black (#0B0B0B), Deep Maroon, Gold (#D4AF37)

* Style: High-end Indian fashion brand

* UI Effects:



  * Smooth animations

  * 3D hover tilt

  * Glassmorphism cards

  * Soft glow highlights

* Typography:



  * Headings: Elegant serif

  * Body: Modern sans-serif



---



## 🧱 SITE STRUCTURE



### Pages:



* Home

* Shop by Region (Map Page)

* Category Page (State-wise)

* Product Page

* Cart & Checkout

* Login/Signup

* Admin Dashboard



---



## 🏠 HOMEPAGE COMPONENTS



* Hero Section:



  * 3D saree model or animated showcase

  * Tagline: “Elegance Woven in Every Thread”

  * CTA buttons



* Featured Collections (dynamic from CMS)



* “Shop by Region” preview section (mini map)



---



## 🗺️ INTERACTIVE INDIA MAP (CRITICAL FEATURE)



### REQUIREMENTS:



* Ask user:

  ➝ “Please upload a clean India map outline (SVG preferred with separated states)”



* Use uploaded map to create:



  * **Clickable regions for ALL 29 states**

  * Each state must be individually mapped



### INTERACTION:



* Hover:



  * Gold glow highlight

  * Tooltip:



    * State Name

    * Saree Types



* Click:



  * Redirect to `/state/[state-name]`



### EXAMPLE DATA MAPPING:



Create structured mapping like:



{

"Odisha": ["Sambalpuri", "Bomkai"],

"West Bengal": ["Baluchari", "Tant"],

"Tamil Nadu": ["Kanchipuram"],

"Gujarat": ["Bandhani", "Patola"],

"Uttar Pradesh": ["Banarasi"],

"Assam": ["Muga Silk"]

}



Ensure ALL 29 states are included.



---



## 🛍️ CATEGORY (STATE) PAGE



Dynamic route: `/state/[state-name]`



* Header: “{State} Sarees Collection”

* Subcategories: Saree types of that state

* Product grid:



  * Image

  * Name

  * Price

  * Quick view

* Filters:



  * Price

  * Fabric

  * Occasion



---



## 👗 PRODUCT PAGE



* 3D viewer or image zoom

* Multiple images (including fabric detail)

* Info:



  * Fabric

  * Origin

  * Work

  * Description

* Buttons:



  * Add to Cart

  * Buy Now

  * Wishlist



---



## 💳 CHECKOUT SYSTEM



Integrate Indian payments:



* UPI (Google Pay, PhonePe, Paytm)

* Cards (Debit/Credit)



Flow:

Cart → Address → Payment → Confirmation



Use mock API if real integration not possible.



---



## ⚙️ ADMIN PANEL (VERY IMPORTANT)



Create CMS-like dashboard:



### Admin Can:



* Edit:



  * Logo

  * Brand name

  * Colors

* Manage:



  * Products (CRUD)

  * Prices

  * Images

  * Descriptions

* Manage:



  * States

  * Saree types per state

* Upload/Replace:



  * India Map SVG

* View:



  * Orders

  * Customers



---



## 🗂️ DATA STRUCTURE



Create structured collections:



* States:



  * name

  * sareeTypes[]



* Products:



  * id

  * name

  * price

  * images[]

  * state

  * sareeType

  * fabric

  * description



* Orders



* Users



---



## ✨ EXTRA FEATURES



* Wishlist

* Search bar (auto-suggestions)

* Reviews & ratings

* Smooth page transitions

* Fully mobile responsive



---



## ⚡ PERFORMANCE



* Optimize images

* Lazy loading

* Smooth animations (no lag)



---



## 🎯 FINAL OUTPUT



* Fully working website

* Modular components

* Editable CMS backend

* Accurate clickable India map

* Scalable for future additions



---



## ❗ FINAL AI INSTRUCTION



Before building:



➡️ Ask user to upload India map SVG

➡️ Ensure ALL states are clickable and correctly mapped



Focus heavily on:



* Map accuracy

* Luxury UI

* Smooth 3D experience



---



Generate this as a **complete deployable project**, not just UI mockup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sakhi-suta-online.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4f2a925d-64b3-4d95-9187-8f19b50b8e7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
