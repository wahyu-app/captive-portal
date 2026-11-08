# Wi-Fi Captive Portal

A responsive Wi-Fi captive portal interface featuring sign-in, password expiration, and connection status screens for desktop, tablet, and mobile devices.

## Tech Stack

- **HTML5** — Page structure, forms, and dialogs.
- **Tailwind CSS 4** — Styling and responsive layout.
- **Vanilla JavaScript** — UI states, validation, and interactions.
- **Node.js 20+** — Local development server and CSS watcher.
- **npm** — Dependency management and build commands.

## Requirements

- Node.js 20 or later and npm.
- A modern browser with support for the HTML Dialog and Popover APIs.

## Getting started

```sh
git clone git@github.com:wahyu-app/captive-portal.git
cd captive-portal
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The development server builds the CSS, watches for Tailwind changes, and serves the app on the local machine. Refresh the browser after changing HTML or JavaScript. Press `Ctrl+C` to stop the server.

To use another port on macOS or Linux:

```sh
PORT=5174 npm run dev
```

## Usage

Click or focus the **Work email** or **Password** input to open the account selector. Select an option to fill both fields, then select **Connect**.

| Option | Result |
| --- | --- |
| Successful sign-in | Connected screen |
| Incorrect email or password | Failed sign-in screen |
| Password expired | Password update form |

The password update form fills the current password automatically and provides live confirmation feedback. Saving returns to sign-in with a success message. **Sign out** returns from the connected screen to sign-in.

Authentication, Wi-Fi gateway integration, and password persistence are not implemented. The reserved passwords `incorrect` and `expired` select their respective UI states; any other nonblank password opens the connected screen after form validation. The support address, `helpdesk@perkom.test`, is an example contact.

### Direct state previews

| Screen | URL |
| --- | --- |
| Sign-in | [http://localhost:5173](http://localhost:5173) |
| Failed sign-in | [http://localhost:5173/?state=failed](http://localhost:5173/?state=failed) |
| Password expired | [http://localhost:5173/?state=expired](http://localhost:5173/?state=expired) |
| Connected | [http://localhost:5173/?state=connected](http://localhost:5173/?state=connected) |

## Interactions

- Connect, save, and sign out use a one-second processing state that prevents duplicate submissions.
- Previous sign-in results clear when credentials change, an account is selected, or another submission starts. Focusing inputs, toggling password visibility, and opening support preserve the message.
- Tab moves between inputs and the submit button, skipping password visibility buttons and the account options. Use arrow keys to enter and navigate the account selector, Enter to select, and Escape to dismiss it.
- Contact Support opens a dialog with a copy-email button. Successful copying displays **Copied** for two seconds; a failed copy provides instructions for copying manually.
- Form errors are associated with their inputs, and status updates use live regions for screen readers.

## Build

```sh
npm run build
```

This compiles and minifies `styles/input.css` into `assets/styles.css`. Edit the source stylesheet and rebuild rather than editing the generated CSS. The build does not create a separate output directory; the static app consists of `index.html`, `main.js`, and `assets/`.

## Project structure

```text
index.html         Page markup, forms, dialogs, and Tailwind classes
main.js            UI states, validation, feedback, and interactions
styles/input.css   Tailwind source, fonts, theme, and component styles
assets/            Compiled CSS, images, SVG icons, fonts, and licenses
scripts/dev.mjs    Local development server and CSS watcher
```

Colors and responsive presentation scaling are defined in `styles/input.css`. Page content and the support address are in `index.html`; credentials and state behavior are in `main.js`.

## Asset credits

- Inter font: [SIL Open Font License](assets/licenses/inter.txt).
- Lucide icons: [ISC License](assets/licenses/lucide.txt).
