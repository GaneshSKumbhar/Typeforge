# Typeforge

Typeforge is a browser-based typing practice app built with vanilla JavaScript and Vite. Practice timed tests, word-count tests, code snippets, or targeted weak-key drills. Your practice history is saved in the browser; signing in enables cloud sync and the public leaderboard.

## Features

- Timed tests (15, 30, 60, and 120 seconds) and word-count tests (10, 25, and 50 words).
- Code snippets with punctuation and symbols.
- Optional punctuation and number practice.
- Weak-key practice based on local key accuracy history.
- Live WPM and accuracy, a personal-best ghost caret, and a post-test pace chart.
- Local history, personal bests, daily streaks, and per-key accuracy.
- Dark, light, and ocean themes, plus font size, accent, caret, sound, and live-stat settings.
- Firebase Authentication and Firestore integration for accounts, cloud sync, and leaderboards.
- Responsive layout and reduced-motion support.

## Requirements

- Node.js 20.19+ or 22.12+ (required by the installed Vite 8 release).
- npm.
- A modern browser.
- A Firebase project only if you want authentication, cloud sync, and shared leaderboard scores.

## Run locally

```sh
npm install
npm run dev
```

Vite prints a local URL, usually `http://localhost:5173`. Open it in a browser. For a production build and a local preview:

```sh
npm run build
npm run preview
```

The production files are written to `dist/`. This project does not currently define an automated test script.

## Use the app

1. Open **Test** and choose a mode and duration or word count.
2. Click the typing area if it does not already have focus, then type the displayed prompt.
3. Correct a character by pressing Backspace, then enter the expected character. Wrong characters are marked and the caret continues to advance.
4. Press **Tab** or **Escape** to restart. Use **Ctrl+Backspace** (or **Alt+Backspace**) to erase the current word.
5. Review the results and use **Practice weak keys** to start an adaptive drill when enough key history exists.

Punctuation and numbers can be enabled from the test toolbar. Code mode always presents code snippets. Settings and local results are stored in this browser's `localStorage`; clearing site data removes them.

## Firebase setup

The Firebase web configuration is read from `window.FIREBASE_CONFIG` in `index.html`.

1. Create a Firebase project and register a **Web app** in the Firebase console.
2. Create a Cloud Firestore database.
3. In **Authentication → Sign-in method**, enable Email/Password and, if desired, Google sign-in. Configure authorized domains for local and deployed use.
4. Copy the Firebase web app configuration into the `FIREBASE_CONFIG` object in `index.html`.
5. Deploy the Firestore rules from this repository. The project is associated with `typeforge-5200d` by `.firebaserc`; change that association if deploying to a different Firebase project.

```sh
firebase login
firebase use typeforge-5200d
firebase deploy --only firestore:rules
```

The web API key in Firebase's client configuration is expected to be present in a browser app. Protect data with Firebase Authentication, Firestore rules, and any appropriate API-key restrictions; do not put service-account credentials or other server secrets in `index.html`.

### How cloud data and leaderboard scores work

- Guests can practice. Their settings, key stats, personal bests, activity, and history remain local to that browser.
- Signed-in users sync their profile and practice data to their own `users/{uid}` Firestore document.
- The public leaderboard reads `boards/{board}/scores` and displays up to 25 scores, sorted by WPM.
- A score is submitted only for a signed-in user, for a counted test with more than 10 keystrokes, in time or word mode, with punctuation and numbers disabled, accuracy of at least 85%, and WPM no higher than 300.
- Each user has one score document per board; a new score replaces the saved score only when its WPM is higher.
- A newly created or unused board can be empty. Local practice scores are not retroactively uploaded just by signing in; complete a qualifying test while signed in to publish a score.

The Firestore rules in `firestore.rules` allow public reads of leaderboard scores and restrict score writes to the authenticated owner, with WPM and accuracy limits. User documents are private to their owner. Review the rules before deploying changes to a production Firebase project.

## Deploy to Firebase Hosting

The repository's `firebase.json` serves the Vite build from `dist/` and rewrites app routes to `index.html`.

```sh
npm run build
firebase deploy --only hosting
```

To deploy hosting and Firestore rules together:

```sh
npm run build
firebase deploy --only hosting,firestore:rules
```

## Project structure

```text
.
├── index.html             # App shell, document metadata, Firebase web config
├── public/                # Static public assets, including favicon.svg
├── src/
│   ├── main.js             # App startup, routing, and global effects
│   ├── engine.js           # Typing prompt, input, scoring, and test lifecycle
│   ├── firebase.js         # Authentication, Firestore sync, and score APIs
│   ├── store.js            # Local state and localStorage persistence
│   ├── data/words.js       # Word pool, code prompts, and theme names
│   ├── styles/index.css    # Design system and responsive styles
│   └── views/              # Test, leaderboard, profile, settings, and auth views
├── firestore.rules         # Firestore access rules
└── firebase.json          # Firebase Hosting and rules configuration
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the app into `dist/`. |
| `npm run preview` | Serve the production build locally. |

## License

No license file is currently included. Contact the repository owner before redistributing or reusing this project if you need explicit licensing terms.
