# 🇨🇴 Solana Colombia Website

Welcome to the official repository for the **Solana Colombia** website. This platform is designed to unite builders, developers, and visionaries across Colombia to build the future of Web3 on Solana.

## 🚀 Tech Stack

- **Framework:** [Astro 5](https://astro.build/) (Static Site Generation & Server-side Rendering)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQL database for builders/profiles)
- **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/)
- **Email:** [Resend](https://resend.com/)
- **Blockchain:** [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) & Wallet Adapter

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js:** `v18.20.8` or higher (Check `.nvmrc`)
- **npm:** Package manager included with Node.js

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Panmoni/solanacolombia-www.git
   cd solanacolombia-www
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in the required values (Resend API key, etc.).

### Development

To start the local development server:

```sh
npm run dev
```

> **Note:** The `dev` script automatically runs `npm run db:pull` to sync your local D1 database with the production data before starting the Astro server.

---

## 📝 Managing Content

The site uses **Astro Content Collections** for structured content.

### ✍️ Adding Blog Posts
Blog posts are stored in `src/content/blog/` as Markdown files.

1. Create a new `.md` file in `src/content/blog/`.
2. Use the following frontmatter:
   ```yaml
   ---
   draft: false
   title: "Your Post Title"
   snippet: "A short summary of the post."
   publishDate: "YYYY-MM-DD HH:mm"
   image:
     src: "/blog/path-to-image.png"
     alt: "Description of image"
   category: "Category Name"
   author: "Author Name"
   tags: ["tag1", "tag2"]
   ---
   # Your Content Here
   ```
3. Place images in `public/blog/`.

### 👥 Adding Team Members
Team members are stored in `src/content/team/` as JSON files.

1. Create a new `.json` file in `src/content/team/` (e.g., `name-lastname.json`).
2. Add the following structure:
   ```json
   {
       "name": "Full Name",
       "title": "Role/Title",
       "xUrl": "https://x.com/username",
       "xUsername": "username",
       "image": {
           "src": "/team/filename.png",
           "alt": "Full Name"
       },
       "order": 1
   }
   ```
3. Place headshots in `public/team/` (recommended size: 400x400px).

### 📸 Adding Gallery Photos
Gallery items are stored in `src/content/gallery/` as JSON files.

1. Create a new `.json` file in `src/content/gallery/` (e.g., `1.json`, `2.json`).
2. Add the following structure:
   ```json
   {
       "title": "Event Name",
       "description": "Short description of the event.",
       "image": {
           "src": "/img/filename.jpg",
           "alt": "Event Description"
       },
       "order": 1
   }
   ```
3. Place images in `public/img/`.

### 👷 Adding Builders & Projects
Unlike the blog or team members, **Builders and Projects are dynamic** and stored in the Cloudflare D1 database.

- **To Add a Builder:** Users must connect their Solana wallet on the `/builders` page and fill out the registration form.
- **To Add a Project:** Once registered as a builder, users can create and manage their projects directly from their dashboard.
- **Local Development:** When running locally, the `db:pull` script syncs the production database so you can see live data.

---

## 🗄️ Database (Cloudflare D1)

The site uses Cloudflare D1 for dynamic data like the Builders directory.

- **Local Development:** The database is stored locally in `.wrangler/`.
- **Syncing Data:** Use `npm run db:pull` to pull the latest production data to your local environment.
- **Wrangler:** Use `npx wrangler d1` to run migrations or execute SQL queries.

---

## 📁 Project Structure

```text
/
├── public/              # Static assets (images, icons, etc.)
├── src/
│   ├── components/      # Reusable UI components
│   ├── content/         # Content Collections (Blog, Team, Gallery)
│   ├── layouts/         # Page layouts
│   ├── pages/           # File-based routing
│   ├── styles/          # Global styles (Tailwind CSS)
│   └── content.config.ts # Content schema definitions
├── wrangler.toml        # Cloudflare configuration
└── astro.config.mjs     # Astro configuration
```

---

## 🤝 Contributing

We welcome contributions from the community!

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 🌐 Community

- **Telegram:** [Join our community](https://t.me/solana_colombia)
- **X (Twitter):** [@SolanaColombia](https://x.com/Solana_Colombia)
- **Website:** [solanacolombia.com](https://solanacolombia.com)

---

Built with ❤️ by the **Solana Colombia** community.
