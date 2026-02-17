# Kopfkino

Kopfkino is a specialized tool for visualizing and managing film production elements. It allows creators to organize Scenes, Shots, Characters, and Locations, providing a structured way to build a visual narrative.

## Features

- **Project Management:** Create and manage Scenes, Shots, Characters, and Locations.
- **Visual Storytelling:** Upload or generate images for each element to visualize the production.
- **Drag-and-Drop Organization:** Easily reorder shots within a scene to refine the sequence.
- **Authentication:** Secure user access powered by Firebase Authentication.
- **Modern UI:** A clean, responsive interface built with Tailwind CSS and Headless UI, supporting both light and dark modes.

## Tech Stack

- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Headless UI](https://headlessui.com/) + [Lucide React](https://lucide.dev/)
- **Backend:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **Routing:** [React Router](https://reactrouter.com/)
- **State Management:** React Context API
- **Utilities:** [dnd-kit](https://dndkit.com/) (Drag & Drop), [clsx](https://github.com/lukeed/clsx)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/simonbuechi/kopfkino.git
    cd kopfkino
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add your Firebase configuration:

    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Locally preview the production build.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
