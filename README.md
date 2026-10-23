# ProofBrand 🛡️

**AI-Powered Brand Governance and Content Review Platform**

ProofBrand helps organisations maintain a consistent, trustworthy, and professional brand identity by reviewing content against approved brand guidelines before publication.

Content created by employees, marketing teams, agencies, and AI tools can contain unsupported claims, inconsistent messaging, outdated information, or language that does not match the brand. ProofBrand aims to identify these issues and help teams improve content before it goes live.

## ✨ Features

- **User Authentication** — Sign up and log in using email and password.
- **Brand Guidelines Management** — Define brand voice, approved terminology, messaging rules, and restricted claims.
- **Content Review** — Submit content for review against brand guidelines.
- **Issue Detection** — Identify potential tone inconsistencies, unsupported claims, misleading statements, and off-brand language.
- **Review Reports** — View review findings and suggested improvements.
- **Review History** — Access previously submitted content reviews.
- **Overview Dashboard** — Access the main dashboard and review activity.

*Feature availability depends on the current application implementation and configuration.*

## 🛠️ Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **UI:** React
- **Styling:** Tailwind CSS
- **Authentication and Backend:** Supabase
- **Package Manager:** pnpm

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account

### 1. Clone the repository

```bash
git clone https://github.com/shrewe/ProofBrand.git
cd ProofBrand
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a file named `.env.local` in the project root, alongside `package.json`.

Add your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the placeholder values with the credentials from your Supabase project.

**Security:** Never commit `.env.local` or expose secret/service-role keys in client-side code or public repositories.

### 4. Configure Supabase Authentication

1. Create or open your Supabase project.
2. Find your project URL and publishable key in the project API settings.
3. Enable email authentication.
4. Configure the site's URL and redirect URLs in Supabase Authentication settings as needed.
5. Configure email verification according to your preferred signup flow.

For additional setup details, see [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for production

```bash
pnpm build
```

To run the production build locally:

```bash
pnpm start
```

## 📁 Project Structure

```text
ProofBrand/
├── app/                    # Next.js application routes
│   ├── auth/                # Authentication callback
│   ├── guidelines/          # Brand guidelines page
│   ├── login/               # Login and sign-up interface
│   ├── review/              # New content review workflow
│   └── reviews/             # Review history and reports
├── components/
│   ├── brand/               # Brand-related components
│   ├── guidelines/          # Guideline management UI
│   ├── history/             # Review history UI
│   ├── overview/            # Overview dashboard
│   ├── report/              # Review reports
│   ├── review/              # Content review components
│   ├── shell/               # Application layout and navigation
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── supabase/            # Supabase client and session utilities
│   ├── analysis.ts          # Content analysis utilities
│   ├── services.ts          # Application service functions
│   └── types.ts             # TypeScript types
├── public/                  # Static assets
├── proxy.ts                 # Request/session handling
├── .env.example             # Environment variable template
├── SUPABASE_SETUP.md        # Supabase setup instructions
└── package.json             # Dependencies and scripts
```

## 🔄 How It Works

1. **Sign in:** Users access the platform through email and password authentication.
2. **Define guidelines:** Users establish the brand's voice, approved terminology, and content rules.
3. **Submit content:** Users submit marketing copy or other content for review.
4. **Analyse content:** The application checks submitted content against available guidelines and configured review logic.
5. **Review findings:** Users inspect detected issues and recommendations.
6. **Track reviews:** Users revisit past reviews and reports through Review History.

## 🎯 Intended Users

- Marketing and communications teams
- Brand managers
- Content creators and copywriters
- Digital marketing agencies
- Organisations using AI-generated content

## 🔮 Future Scope

Potential future improvements include:

- Advanced AI-powered semantic and visual brand checks
- Verification against approved facts and source documents
- Detection of outdated claims and assets
- Accessibility and visual consistency checks
- Team collaboration and approval workflows
- Integrations with content management and publishing platforms

## 🔐 Security

- Keep environment variables and private credentials out of version control.
- Use Supabase authentication and appropriate access controls.
- Apply server-side authorization and database policies before storing sensitive or organisation-specific content.
- Validate submitted content and user inputs.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome. For significant changes, open an issue or discuss the proposed change before submitting a pull request.

## 📄 License

No license has been specified yet. Add a `LICENSE` file before distributing the project under an open-source license.

---

**ProofBrand — Review before you publish. Protect the brand you build.**
