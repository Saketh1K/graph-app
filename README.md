# SAP O2C Graph Explorer 🚀

A high-performance, AI-powered graph visualization and query system for SAP Order-to-Cash (O2C) datasets.

![Dashboard Preview](https://github.com/Saketh1K/graph-app/raw/main/public/preview.png)

## ✨ Features

- **Force-Directed Graph**: Real-time visualization of Sales Orders, Deliveries, Billing, and Journal Entries.
- **AI Conversational Interface**: Ask questions in natural language (powered by Gemini 1.5 Flash).
- **Automated SQL Generation**: Dynamic translation of natural language to specialized SQL for graph-relational queries.
- **End-to-End Traceability**: Full visibility from Order creation to Financial Posting.
- **Premium Design**: Modern, glassmorphic UI built with Next.js and Tailwind CSS.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visuals**: [react-force-graph-2d](https://github.com/vasturiano/react-force-graph-2d)
- **Database**: [SQLite](https://www.sqlite.org/)
- **AI Engine**: [Google Gemini 1.5 Flash](https://aistudio.google.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Saketh1K/graph-app.git
cd graph-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set Environment Variables
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📊 Data Model

The system unifies fragmented SAP JSONL files into a cohesive SQLite database with the following entity relationships:
- **SalesOrder** → linked to → **Delivery**
- **Delivery** → linked to → **Billing**
- **Billing** → linked to → **JournalEntry**

## ☁️ Deployment

Deployed with ❤️ on [Vercel](https://vercel.com).
