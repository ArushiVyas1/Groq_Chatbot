🍽️ AI Dining Assistant & Concierge

An interactive, AI-powered dining concierge web application built with Next.js 14, Groq SDK, Tailwind CSS, and Clerk Authentication. The platform features persistent cross-session conversational memory, dietary filtering, dynamic visual menus, interactive booking confirmations, and user feedback integration.

✨ Features

⚡ Fast AI Responses: Powered by Groq's high-speed inference engine utilizing the openai/gpt-oss-120b model.

🔐 Secure Authentication: Integrated with Clerk for user management and session isolation (user.id).

🧠 Cross-Session Memory: AI recalls preferences, dietary restrictions, and previous visits across multiple user chats.

🥗 Dietary Filters & Badges: One-click filter chips (Pure Veg, Vegan, Gluten-Free, Jain) and spice level indicators (🌶️).

🖼️ Rich Visual Menus: Markdown rendering with integrated food photography from Unsplash and full GFM table support.

📅 Interactive Booking Cards: Automated JSON parsing renders custom UI confirmation cards for table reservations.

⭐ 5-Star Feedback Collector: In-chat feedback cards gather ratings and reviews to further personalize future dining recommendations.

📧 Email Notifications: Integrated with Resend for sending booking confirmation emails.

🛠️ Tech Stack

Framework: Next.js 14 (App Router)

Styling: Tailwind CSS

AI Provider: Groq SDK

Authentication: Clerk

Markdown Parsing: react-markdown & remark-gfm

Email Service: Resend

🚀 Getting Started

Prerequisites

Ensure you have the following installed:

Node.js (v18 or higher)

npm, yarn, or pnpm

1. Clone the Repository

git clone https://github.com/your-username/groq-dining-assistant.git
cd groq-dining-assistant


2. Install Dependencies

npm install


3. Environment Setup

Create a .env.local file in the root directory and add your API keys:

# Groq AI Key
GROQ_API_KEY=your_groq_api_key_here

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Resend Email Key
RESEND_API_KEY=your_resend_api_key_here


4. Run the Development Server

npm run dev


Open http://localhost:3000 in your browser to view the application.

📁 Project Structure

├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # Groq AI backend API route & system prompt
│   ├── components/
│   │   ├── BookingCard.tsx      # Table reservation UI card component
│   │   └── FeedbackCard.tsx     # 5-star rating & review card component
│   ├── globals.css              # Global styles & Tailwind CSS imports
│   ├── layout.tsx               # Root layout wrapped with ClerkProvider
│   └── page.tsx                 # Main chat interface & session manager
├── public/                      # Static assets
├── .env.local                   # Local environment variables
├── package.json
└── README.md


🤖 How It Works

User Query: The user sends a request or selects a quick action filter.

Context Injection: The backend (app/api/chat/route.ts) compiles recent chat history, active dietary filters, and past user session logs.

Groq Inference: The system prompt and dataset are evaluated by Groq's LLM engine.

Structured JSON Parsing:

Blocks marked as ```booking are parsed into interactive <BookingCard /> components.

Blocks marked as ```feedback are parsed into interactive <FeedbackCard /> components.

📄 License

This project is licensed under the MIT License.
