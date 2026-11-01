
# Real-Time Voice Chat Application
### Customer ↔ Agent Communication

A browser-based voice calling application where a Customer and an Agent can connect using a shared room code, communicate through two-way audio using WebRTC, and exchange text messages in real time.

If either participant disconnects, the call automatically ends for both users.

## Tech Stack

- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Real-Time Communication:** Socket.IO
- **Voice Communication:** WebRTC
- **Icons:** React Icons

## Features

- Two-way real-time voice communication using WebRTC.
- Customer and Agent role-based room joining.
- Room capacity limited to one Customer and one Agent.
- Real-time text chat with sender name, role and timestamps.
- Connection status: Waiting, Connecting, Connected and Disconnected.
- Microphone mute and unmute controls.
- Live call duration timer.
- End-call functionality.
- Automatic call termination when either participant disconnects.
- Browser refresh and connection failure handling.
- Responsive interface for desktop and mobile.
- Light and dark theme support.
- Downloadable chat transcript.

## Project Structure

```text
voice-chat/
│
├── client/
│   ├── dist/                  # Generated production build
│   │   ├── assets/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── CallScreen.jsx
│   │   │   ├── EndedScreen.jsx
│   │   │   └── JoinScreen.jsx
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── screenshots/
│   ├── Agent Active Call.png
│   ├── Call Ended Page.png
│   ├── Customer Active Call.png
│   ├── Join CallPage.png
│   └── Mobile View Page.png
│
├── server/
│   ├── index.js
│   ├── test.js
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

**Note:** The project contains two `index.html` files for different purposes:

- `client/index.html` – Main Vite/React frontend entry file.
- `client/dist/index.html` – Automatically generated production build file.

The `dist` folder is generated when building the frontend and should not be manually edited.

## Installation and Setup

### Prerequisites

- Node.js 18+
- npm
- Modern web browser
- Working microphone

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd voice-chat
```

### 2. Install Dependencies

From the project root directory, run:

```bash
npm run install:all
```

### 3. Start the Application in Development Mode

```bash
npm run dev
```

Application URLs:

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

### 4. Run the Application in Production Mode

To run the complete application on port **3001**, first build the React frontend:

```bash
npm run build --prefix client
```

This generates the production build inside `client/dist/`.

Then start the backend:

```bash
cd server
node index.js
```

Open the application:

**http://localhost:3001**

Backend health check:

http://localhost:3001/health

The Express server serves the built React application from `client/dist/` when the production build is available.

### 5. Test the Application

1. Open the frontend in two browser tabs or separate browsers.
2. In the first tab, enter your name, select **Customer**, and enter room code `demo`.
3. In the second tab, enter your name, select **Agent**, and enter the same room code `demo`.
4. Click **Start Call** in both tabs.
5. Allow microphone permissions.
6. Once connected, test voice communication, chat, mute/unmute and end call.

**Note:** Use headphones when testing on the same computer to avoid audio feedback. Microphone access requires HTTPS or localhost.

## Backend Testing

Run the backend tests using:

```bash
npm test --prefix server
```

The integration tests cover:

- Health check API.
- Customer and Agent room joining.
- Duplicate-role and room capacity restrictions.
- Chat message broadcasting.
- Invalid payload validation.
- Participant disconnection.
- Call termination and room cleanup.
- WebRTC signaling events.

**Test Results: 64 Passed, 0 Failed.**

## Application Screenshots

### Join Call Screen

![Join Call Screen](screenshots/Join%20CallPage.png)

### Customer Active Call

![Customer Active Call](screenshots/Customer%20Active%20Call.png)

### Agent Active Call

![Agent Active Call](screenshots/Agent%20Active%20Call.png)

### Mobile View

![Mobile View](screenshots/Mobile%20View%20Page.png)

### Call Ended Screen

![Call Ended](screenshots/Call%20Ended%20Page.png)

## Architecture

- **Socket.IO:** Handles room management, signaling, chat and participant presence.
- **WebRTC:** Handles peer-to-peer audio communication.
- **Express.js:** Provides the backend server and health-check API.
- **React.js:** Provides the user interface and calling experience.

WebRTC offer, answer and ICE candidate information is exchanged through Socket.IO to establish peer-to-peer audio communication.

## Author

**Parth Jagad**

- **GitHub:** [github.com/parthjagad09](https://github.com/parthjagad09)
- **Portfolio:** [parthjagad.vercel.app](https://parthjagad.vercel.app/)
- **LinkedIn:** [linkedin.com/in/parth-jagad-97664725b](https://www.linkedin.com/in/parth-jagad-97664725b/)
