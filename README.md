# Kopfkino

Kopfkino is a specialized tool for visualizing and managing film production elements. It allows creators to organize Scenes, Shots, Characters, and Locations, providing a structured way to build a visual narrative.

## Features

- **Project Management:** Create and manage Scenes, Shots, Characters, and Locations.
- **Visual Storytelling:** Upload or generate images for each element to visualize the production.
- **AI Image Generation:** Generate character images via the [Pollinations API](https://gen.pollinations.ai) directly from the character form.
- **Drag-and-Drop Organization:** Easily reorder shots within a scene to refine the sequence.
- **Authentication:** Secure user access powered by Firebase Authentication.
- **Modern UI:** A clean, responsive interface built with Tailwind CSS and Headless UI, supporting both light and dark modes.

## Tech Stack

- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Headless UI](https://headlessui.com/) + [Lucide React](https://lucide.dev/)
- **Backend:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **AI:** [Pollinations API](https://gen.pollinations.ai) (Image Generation)
- **Routing:** [React Router](https://reactrouter.com/)
- **State Management:** React Context API
- **Utilities:** [dnd-kit](https://dndkit.com/) (Drag & Drop), [clsx](https://github.com/lukeed/clsx)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/simonbuechi/kopfkino.git
    cd kopfkino
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. **Environment Configuration:**
    Create a `.env` file in the root directory with your Firebase and Pollinations credentials:

    ```env
    # Firebase
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # Pollinations BYOP — users connect their own account via OAuth, no key needed here
    # Optional: your app's publishable key for a branded consent screen
    # VITE_POLLINATION_APP_KEY=pk_your_publishable_key
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```

## AI Image Generation

Kopfkino integrates the [Pollinations API](https://gen.pollinations.ai) (`gen.pollinations.ai`) to generate images directly from text prompts.

### How it works

- Open any character and click **Generate Image** (below the image panel or next to the Description label).
- A modal lets you configure the prompt, model, size, seed, and prompt enhancement.
- On confirm, the image is fetched from the API, compressed to WebP, and uploaded to Firebase Storage — the same pipeline used for manual image uploads.
- Progress is shown via toast notifications (`Generating…` → `Uploading…` → `Image generated!`).
- The generated image is set on the character but not saved until you click **Save**.

### Default settings

Global defaults (model, size, seed, enhance) are configurable via the **Settings** dialog (cogwheel icon, top right). They pre-fill the modal on every request but can be overridden per generation.

### Authentication — BYOP (Bring Your Own Pollen)

No API key is stored in the app. Each user connects their own Pollinations account via OAuth:

1. Click **Settings → Connect Pollinations Account** (or click **Generate Image** when not connected)
2. The app redirects to `enter.pollinations.ai/authorize`
3. The user logs in and approves — they can set a pollen budget and expiry
4. Pollinations redirects back with a personal key in the URL fragment
5. The key is stored in `localStorage` and sent as `Authorization: Bearer` on each request

**Result:** The app owner pays $0. Each user's own pollen balance is charged. Keys expire in 30 days (users are prompted to reconnect).

To show a branded consent screen, create a publishable App Key (`pk_...`) at [enter.pollinations.ai](https://enter.pollinations.ai) and add it as `VITE_POLLINATION_APP_KEY`.

### Available models

| Model | Description |
|---|---|
| `zimage` | Z-Image Turbo — default, fast with 2× upscaling |
| `flux` | Flux Schnell — fast, low cost |
| `klein` | FLUX.2 Klein 4B — fast generation and editing |
| `gptimage` | GPT Image 1 Mini — OpenAI |
| `gptimage-large` | GPT Image 1.5 — OpenAI, higher quality |
| `wan-image` | Wan 2.7 Image — Alibaba, up to 2K |
| `qwen-image` | Qwen Image Plus — Alibaba via DashScope |
| `kontext` | FLUX.1 Kontext — in-context editing |

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Locally preview the production build.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
