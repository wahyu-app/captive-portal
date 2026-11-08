# Wi-Fi Captive Portal

A responsive captive portal demo built with HTML, vanilla JavaScript, and Tailwind CSS 4. It includes sign-in, failed sign-in, password expiration, and connected screens with locally hosted fonts and assets.

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

## Trying the demo

Click or focus the **Work email** or **Password** input to open the demo account dropdown. Select an option to fill both fields, then select **Connect**.

| Option | Email | Password | Result |
| --- | --- | --- | --- |
| Successful sign-in | `demo@perkom.test` | `Demo123!` | Connected screen |
| Incorrect email or password | `demo@perkom.test` | `incorrect` | Failed sign-in screen |
| Password expired | `demo@perkom.test` | `expired` | Password update form |

The password update form fills the current password automatically and provides live confirmation feedback. Saving returns to sign-in with a success message. **Sign out** returns from the connected screen to sign-in.

This is a frontend simulation. It does not authenticate users, connect to a Wi-Fi gateway, or persist password changes. The reserved passwords `incorrect` and `expired` select their respective demo states; any other nonblank password connects after form validation. The support address, `helpdesk@perkom.test`, is a demo value.

### Direct state previews

| Screen | URL |
| --- | --- |
| Sign-in | [http://localhost:5173](http://localhost:5173) |
| Failed sign-in | [http://localhost:5173/?state=failed](http://localhost:5173/?state=failed) |
| Password expired | [http://localhost:5173/?state=expired](http://localhost:5173/?state=expired) |
| Connected | [http://localhost:5173/?state=connected](http://localhost:5173/?state=connected) |

## Interactions

- Connect, save, and sign out use a one-second processing state that prevents duplicate submissions.
- Previous sign-in results clear when credentials change, a demo account is selected, or another submission starts. Focusing inputs, toggling password visibility, and opening support preserve the message.
- Tab moves between inputs and the submit button, skipping password visibility buttons and the demo options. Use arrow keys to enter and navigate the demo dropdown, Enter to select, and Escape to dismiss it.
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
main.js            Demo states, validation, feedback, and interactions
styles/input.css   Tailwind source, fonts, theme, and component styles
assets/            Compiled CSS, images, SVG icons, fonts, and licenses
scripts/dev.mjs    Local development server and CSS watcher
```

Colors and responsive presentation scaling are defined in `styles/input.css`. Page content and the support address are in `index.html`; demo credentials and state behavior are in `main.js`.

## Asset credits

- Inter font: [SIL Open Font License](assets/licenses/inter.txt).
- Lucide icons: [ISC License](assets/licenses/lucide.txt).
