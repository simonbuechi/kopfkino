
# Kopfkino Style Guide

This document outlines the design system and style guidelines for the Kopfkino application. The design focuses on a clean, modern aesthetic using a monochromatic Zinc color palette with support for both light and dark modes.

## 1. Design Philosophy

-   **Minimalist & Content-Focused:** The UI recedes to let the content (images, text) take center stage.
-   **Monochromatic:** Rely heavily on the Zinc scale for a neutral, premium look.
-   **High Contrast:** clear distinction between background, surface, and content tiers.
-   **Interactive Feedback:** Subtle hover states and clear focus rings for accessibility.

## 2. Color Palette

The application uses the Tailwind CSS `zinc` color scale.

### Backgrounds
| Usage | Light Mode | Dark Mode | Class Example |
| :--- | :--- | :--- | :--- |
| **App Background** | `bg-zinc-50` | `bg-black` | `bg-zinc-50 dark:bg-black` |
| **Surface / Card** | `bg-white` | `bg-zinc-900` | `bg-white dark:bg-zinc-900` |
| **Sidebar / Panel** | `bg-zinc-50` | `bg-black` | `bg-zinc-50 dark:bg-black` |
| **Header** | `bg-white/50` | `bg-zinc-950/50` | `backdrop-blur-sm` |

### Text
| Usage | Light Mode | Dark Mode | Class Example |
| :--- | :--- | :--- | :--- |
| **Primary** | `text-zinc-900` | `text-zinc-100` | `text-zinc-900 dark:text-zinc-100` |
| **Secondary** | `text-zinc-500` | `text-zinc-400` | `text-zinc-500 dark:text-zinc-400` |
| **Placeholder** | `text-zinc-500` | `text-zinc-500` | `placeholder:text-zinc-500` |

### Borders & Dividers
| Usage | Light Mode | Dark Mode | Class Example |
| :--- | :--- | :--- | :--- |
| **Subtle** | `border-zinc-200` | `border-zinc-800` | `border-zinc-200 dark:border-zinc-800` |
| **Active / Hover** | `border-zinc-300` | `border-zinc-700` | `hover:border-zinc-300` |

### Interactive Elements
| Usage | Style |
| :--- | :--- |
| **Primary Button** | `bg-zinc-100` (Light) / `text-zinc-900` |
| **Focus Ring** | `focus:ring-2 focus:ring-zinc-500` or `focus:ring-zinc-950/10` |
| **Danger** | `text-red-500` `bg-red-500/10` `border-red-500/20` |

## 3. Typography

-   **Font Family:** `Inter` (`font-sans`)
-   **Body Size:** `text-sm` (14px) or `text-base` (16px) depending on density.
-   **Headings:** `font-semibold` or `font-medium`.

## 4. UI Components

### Buttons
Buttons should use the `Button` component:
-   **Primary:** `bg-zinc-100 text-zinc-900 hover:bg-zinc-200`
-   **Secondary:** `bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700`
-   **Ghost:** `hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100`

### Inputs
Inputs use a consistent style with a subtle border that darkens on hover/focus.
-   **Base:** `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg`
-   **Focus:** `focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10`

### Cards
Cards are used to group content and elevate it from the background.
-   **Container:** `bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm`
-   **Hover Effect:** Optional `hover:-translate-y-1 hover:shadow-md` for interactive cards.

### Navigation (Sidebar)
-   **Active Item:** High contrast background & text (`bg-white dark:bg-zinc-900`) with a ring border.
-   **Inactive Item:** Low contrast text (`text-zinc-500`), subtle hover effect.

## 5. Iconography
-   **Library:** `lucide-react`
-   **Size:** Standard icon size is `20px` (or `size={20}` prop).
-   **Color:** Inherits text color, often matches secondary text (`text-zinc-500`).

## 6. Layout
-   **Sidebar Layout:** Fixed sidebar on the left, scrollable main content area on the right.
-   **Spacing:** Use reasonable padding `p-4`, `p-6`, `p-8` to let content breathe.
-   **Backdrop Blur:** Used in sticky headers to maintain context.
