# Project Folder Structure & Development Rules

This document outlines the architectural patterns and folder structures used in this project. These rules should be followed for consistency and can be used as a template for future projects.

## 1. Backend (Node.js/Express)
The backend follows a **Model-View-Controller (MVC)**-inspired architecture focused on API development.

### Folder Structure:
- **`config/`**: Database connections, environment configurations, and external service settings.
- **`controllers/`**: Contains the core business logic. Each controller manages a specific resource or feature.
- **`models/`**: Database schema definitions (e.g., Mongoose models for MongoDB).
- **`routes/`**: Defines API endpoints and maps them to their respective controller functions.
- **`middlewares/`**: Logic executed during the request-response cycle (Authentication, Error Handling, Logging).
- **`utils/`**: General-purpose helper functions and logic (e.g., Date formatting, string manipulation).
- **`mqtt/`**: Specialized logic for hardware communication, including publishers, subscribers, and dedicated routes.
- **`scripts/`**: One-off or maintenance scripts.
- **`upload/`**: Local storage for uploaded files and static media.

### Key Rules:
- Business logic MUST reside in `controllers/`, NOT in `routes/`.
- Use `middlewares/` for cross-cutting concerns like JWT validation.
- Every route file should be documented or self-explanatory in its purpose.

---

## 2. Frontend Website (React - Admin)
The admin dashboard is built with **React** and follows a component-based modular structure.

### Folder Structure:
- **`src/components/`**: Atomic, reusable UI components (Buttons, Cards, Modals).
- **`src/pages/`**: Full views or pages composed of multiple components.
- **`src/hooks/`**: Custom React hooks for shared logic (fetching data, form state).
- **`src/routes/`**: Centralized routing configuration using React Router.
- **`src/assets/`**: Static images, icons, and styles.
- **`src/utils/`**: Helper functions specific to frontend logic.
- **`src/config/`**: Client-side environment variables and API base URLs.

### Key Rules:
- Keep components small and focused on a single responsibility.
- Use `pages/` only for route entry points.
- Extract repeated logic into custom `hooks/`.

---

## 3. Mobile App (Flutter)
The mobile application is built using **Flutter** and follows a **Feature-Driven Architecture** combined with a robust **Controller Pattern**.

### Folder Structure:
- **`lib/core/`**: Core infrastructure shared across the app.
    - **`services/`**: API clients, permission handling, local storage.
    - **`config/`**: Constants, API endpoints, and app-wide settings.
    - **`controllers/`**: Global state controllers.
    - **`routes/`**: App navigation and route definitions.
    - **`View/`**: Core UI views like splash screens.
- **`lib/feature/`**: Feature-specific modules (e.g., `user_profile`, `motor_control`). Each feature contains its own views and logic.
- **`lib/utils/`**: Helper utilities.
    - **`theme/`**: Centralized UI styling and colors.
    - **`widgets/`**: Reusable Flutter widgets.
    - **`responsive/`**: Logic for handling different screen sizes.
- **`assets/`**: Images, fonts, and local data files.

### Key Rules:
- **Form Management**: Use the `TextEditingController` pattern for all forms. Always initialize in `initState()` and dispose in `dispose()`.
- **Modularity**: New features should be placed in `lib/feature/` to maintain a clean separation of concerns.
- **Consistency**: Follow the established `ui_utils.dart` for standard UI spacing and styling.

---

## 4. General Project Rules
- **Environment Variables**: Never commit `.env` files. Always provide a `.env.example` or update documentation.
- **Documentation**: Use Markdown files for technical specifications (e.g., `HARDWARE_INTERFACE_SPECIFICATION.md`).
- **Consistency**: Follow the existing naming conventions (camelCase for JS/Dart variables, PascalCase for classes/components).
