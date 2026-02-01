🎓 MENTOR

Mentor is a modern, scalable learning management system built for speed, clarity, and real-world production use.
It focuses on clean UI, fast performance, and mentor-driven learning experiences.
Built with Vite + React + TypeScript + Tailwind + shadcn/ui


📌 Project Information
Project Name: MENTOR


Type: Web Application (Frontend-first)
Status: Active Development

Custom Domain: Supported
🌍 Live URL

Preview: Add after publish
Production: Custom domain supported

Best for
Rapid UI iteration
Non-local development
Fast prototyping


💻 Local Development (IDE)
✅ Requirements
Node.js 20 LTS (recommended)
npm

Install Node with nvm:
https://github.com/nvm-sh/nvm#installing-and-updating

🛠 Setup Steps
# 1. Clone repository
git clone <YOUR_GIT_URL>

# 2. Move into project
cd mentorlms

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev


App runs on:
http://localhost:5173


✍️ Option 3: Edit directly on GitHub
Open any file
Click ✏️ Edit
Commit changes


Best for:
README updates

Minor fixes
☁️ Option 4: GitHub Codespaces
Code → Codespaces → New
Fully cloud-based dev environment
No local setup required


🧱 Tech Stack
Core
⚡ Vite – fast bundler
⚛️ React – UI library
🟦 TypeScript – type safety


UI & Styling
🎨 Tailwind CSS
🧩 shadcn/ui
Tooling
ESLint
PostCSS
Browserslist



📂 Project Structure
mentorlms/
├── public/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components
│   ├── layouts/         # App layouts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & helpers
│   ├── services/        # API & business logic
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript types
│   ├── main.tsx         # App entry
│   └── App.tsx
├── index.html
├── package.json
├── tsconfig.json
└── README.md


🧠 Application Architecture
High-level Flow
User → React UI → Hooks → Services → API (future)
Design Principles
Component-driven architecture
Clear separation of concerns
Scalable folder structure
Strict typing with TypeScript


🔐 Environment Variables
Create a .env file in the root:

VITE_APP_NAME=Mentor
VITE_API_BASE_URL=http://localhost:8000



All environment variables must start with VITE_
📜 Available Scripts
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Lint codebase


🎨 UI & UX Conventions
Text-only metadata (no OG images)
No favicons or external icons
Clean, Swiggy-like layout philosophy
Mobile-first responsive design


🧪 Troubleshooting
Dev server not starting
npm install
npm run dev

Browserslist warning
Safe to ignore, or fix with:
npm install caniuse-lite@latest browserslist@latest

Port already in use
npm run dev -- --port 5174

🛣 Roadmap
Phase 1 (Current)

Core UI
Routing
Layout system

Phase 2
Authentication
Mentor profiles
Course listing

Phase 3
Backend integration
Payments
Admin dashboard


💼 Portfolio Value
This project demonstrates:
Modern frontend architecture
Real production tooling
Clean code organization


Scalable UI systems
Ideal for:
Mid-level frontend roles
Full-stack transitions


Startup interviews
🤝 Contributing Guidelines
Use meaningful commit messages
Follow existing folder structure
Prefer reusable components
Keep UI consistent


📄 License
Public project.
Free to use for learning, portfolio, and internal purposes.
