# ▶️ StreamTube

> **A modern YouTube-inspired video streaming platform built with React, Redux Toolkit, React Router, Tailwind CSS and the YouTube Data API.**

StreamTube is a frontend-focused video streaming application inspired by the core experience of YouTube.

The goal wasn't simply to recreate the interface.

The goal was to understand and implement the **engineering decisions behind a modern content platform** — from debounced search and cached suggestions to infinite scrolling, dynamic routing, video playback, comments pagination, global state management, responsive UI, and loading states.

---

# 🚀 Live Demo

### 🎥 Try StreamTube

👉 **[Open StreamTube](https://streamyoutube.vercel.app/)**

### 💻 Source Code

👉 **[View Source Code](https://github.com/AmitFrontEnd/StreamTube)**

---


# ⭐ Before You Leave...

If you explore this project, I'd love for you to do one thing:

### **Don't just look at the UI. Look at the code.**

This project was built while learning and experimenting with React architecture, API integration, Redux Toolkit, custom hooks and frontend engineering.

So there are definitely places where the implementation can be improved.

Maybe:

* a component should be structured differently
* a hook can be optimized
* a Redux state shape can be cleaner
* an API call can be handled better
* an effect dependency can be improved
* a folder structure can be more scalable
* a piece of state doesn't belong where it currently lives
* an implementation can be made more reusable

### **Find those things.**

Open the repository.

Read the code.

Break the architecture.

Tell me what you'd change.

> **A good code review is more valuable to me than a star.**

And yes...

⭐ **If you like the project, a Star is always appreciated.**

---

# 🎯 Why I Built StreamTube

While building projects, it's very easy to focus only on making the UI look good.

I wanted this project to focus more on what happens **behind the UI**.

For example:

How does a search suggestion system work?

How can repeated search requests be avoided?

How can API results be cached?

How can infinite scrolling be implemented?

How should video details and channel details be fetched?

How can comments be loaded progressively?

How should global state be managed?

How should a page behave while API data is still loading?

Those questions became the real project.

---

# ✨ Core Features

## 🔎 Smart Search Suggestions

When the user starts typing in the search box, StreamTube fetches search suggestions dynamically.

The search system includes:

* Debounced API requests
* Search suggestion caching
* Redux-based cache storage
* Desktop search experience
* Dedicated mobile search interface
* Click-outside detection
* Clear-search functionality
* URL-based search results

### Search flow

```text
User types
    ↓
Input stored in Redux
    ↓
200ms debounce
    ↓
Check Redux cache
    ↓
Cache found?
   ↙       ↘
 Yes        No
 ↓           ↓
Use cache   API request
              ↓
        Store in cache
              ↓
        Display suggestions
```

The important part here is that typing the same query repeatedly doesn't necessarily require another suggestion request.

---

# 🧠 Search Result Caching

Search suggestions are stored in a dedicated Redux slice.

```text
searchSlice
     ↓
{
   "react": [...],
   "javascript": [...],
   "redux": [...]
}
```

When the same query is entered again, the application first checks the existing cache.

This helps reduce unnecessary network requests and also makes repeated searches feel faster.

---

# 📱 Responsive Search Experience

The search UI behaves differently depending on screen size.

### Desktop

```text
┌──────────────────────────────────────────────┐
│ Logo │        Search Bar       │ 🎤 │ Create │
└──────────────────────────────────────────────┘
```

### Mobile

```text
┌──────────────────────────────────────────────┐
│ ← │             Search               │ 🔍 │
└──────────────────────────────────────────────┘
```

The mobile search interface is separated into its own reusable component:

```text
MobileSearchHeader
```

This keeps the mobile-specific interaction independent from the desktop header.

---

# 🎬 Video Discovery

The home page fetches popular videos from the YouTube Data API.

Each video card displays:

* Thumbnail
* Title
* Channel name
* View count
* Published time
* Duration
* Verification-style indicator
* More options UI

Example:

```text
┌──────────────────────────────┐
│                              │
│          Thumbnail           │
│                              │
│                     12:35    │
└──────────────────────────────┘

Video title goes here...

Channel Name ✓
1.2M views • 2 days ago
```

---

# ♾️ Infinite Scrolling

The home feed doesn't load everything at once.

Instead, StreamTube uses an `IntersectionObserver` to detect when the user reaches the bottom of the content.

```text
Initial request
      ↓
Videos loaded
      ↓
User scrolls
      ↓
Loader enters viewport
      ↓
IntersectionObserver fires
      ↓
Next page requested
      ↓
New videos appended
```

This is implemented through the custom hook:

```text
usePopularMovies()
```

The hook manages:

* Initial loading
* Pagination
* `nextPageToken`
* Loading state
* IntersectionObserver
* Redux updates

---

# 💬 Infinite Comments

Comments are also loaded progressively.

Instead of requesting all comments in one shot:

```text
Video
  ↓
First 30 comments
  ↓
User reaches bottom
  ↓
Next page
  ↓
More comments
  ↓
Continue...
```

The custom hook:

```text
useComments()
```

handles:

* Comment fetching
* Pagination
* `nextPageToken`
* Loading state
* IntersectionObserver
* Appending new comments

---

# ▶️ Dynamic Watch Page

Clicking a video navigates to:

```text
/watch?v=VIDEO_ID
```

The video ID is extracted from the URL using React Router's search params.

Example:

```text
/watch?v=dQw4w9WgXcQ
```

The application then uses that ID to fetch the required video information.

---

# 🎥 Embedded Video Player

The watch page embeds the selected YouTube video dynamically.

```text
User clicks video
       ↓
Video ID added to URL
       ↓
Watch page reads ID
       ↓
YouTube iframe loads
       ↓
Video starts playing
```

The page also displays surrounding information such as:

* Video title
* Channel information
* Subscriber count
* Views
* Published date
* Description
* Likes
* Comments
* Subscribe state

---

# 📺 Channel Information

The watch page doesn't only fetch the video.

It also fetches the video's channel information.

```text
Video ID
   ↓
Video API
   ↓
Channel ID
   ↓
Channel API
   ↓
Channel Details
```

This allows StreamTube to display:

* Channel name
* Channel avatar
* Subscriber count
* Verification-style indicator

This is handled through:

```text
useVideoandChannelDetail()
```

---

# 🔔 Interactive Watch Page

The watch page contains a collection of familiar video-platform interactions:

* Like
* Dislike
* Subscribe
* Share
* Download
* More options
* Show more
* Show less

Some of these are currently UI-level interactions, intentionally focusing on the frontend experience.

---

# 📄 Expandable Video Description

Long video descriptions are initially collapsed.

The user can expand and collapse them.

```text
Short description
      ↓
   Show more
      ↓
Full description
      ↓
   Show less
```

This is handled with local React state:

```javascript
const [showFullDesc, setShowFullDesc] = useState(false);
```

---

# 💡 Loading States

The application doesn't simply show a blank page while waiting for API responses.

It uses shimmer components for different sections.

### Video cards

```text
VideoCardShimmer
```

### Watch page

```text
MainVideoShimmer
```

### Comments

```text
CommentCardShimmer
```

This creates a more realistic loading experience.

---

# 🌗 Dark Mode

StreamTube supports both:

* Light mode
* Dark mode

Tailwind's `dark:` utilities are used throughout the UI.

Example:

```text
bg-white
dark:bg-[#0f0f0f]
```

The goal is to keep the interface visually consistent in both themes.

---

# 🧭 Sidebar Navigation

The sidebar is designed around the familiar structure of a modern video platform.

### Main navigation

* Home
* Shorts
* Subscriptions

### Personal section

* History
* Playlists
* Your videos
* Watch later
* Liked videos

### Subscriptions

* Code with Harry
* Chai aur Code
* Akshay Saini
* Thapa Technical

### Explore

* Movies
* Gaming
* News
* Sports
* Learning
* Fashion & Beauty
* Music
* Live

The sidebar visibility is controlled through Redux state.

---

# 🗺️ Routing Architecture

React Router handles the application's navigation.

```text
/
│
├── /
│   └── Home
│
├── /watch
│   └── Video Watch Page
│
└── /results
    └── Search Results
```

The application uses nested routes with:

```text
App
 └── Body
      ├── Home
      ├── Watch
      └── Results
```

This allows shared UI such as the header and sidebar to remain mounted while the page content changes through `<Outlet />`.

---

# 🧠 Redux Architecture

Redux Toolkit is used for global state.

The store contains multiple slices.

```text
Redux Store
│
├── app
│   ├── sidebar state
│   ├── search input
│   └── suggestion visibility
│
├── search
│   └── suggestion cache
│
└── videos
    ├── popular videos
    └── selected video details
```

---

# 🧩 App Slice

The application slice controls UI-level global state.

```text
appSlice
│
├── isOpen
├── inputSearch
└── showSuggestions
```

Actions include:

```text
toggleSideBar()
addInputSearchValue()
clearInputSearch()
toggleShowSuggestion()
```

---

# 🗃️ Search Slice

The search slice is used as a cache.

```text
searchSlice
    ↓
Query → Suggestions
```

Action:

```text
addtoCache()
```

This allows search suggestions to be reused instead of requesting them again.

---

# 🎞️ Video Slice

The video slice stores video-related global data.

```text
videoSlice
│
├── popularVideos
└── videoDetails
```

Actions:

```text
addPopularMovies()
addVideoDetails()
```

---

# 🪝 Custom Hooks

One of the biggest architectural decisions in this project was moving API logic into reusable custom hooks.

### `usePopularMovies`

Responsible for:

* Popular video API
* Pagination
* Loading state
* Infinite scrolling
* Redux updates

### `useComments`

Responsible for:

* Comment API
* Pagination
* Loading state
* Infinite scrolling

### `useVideoandChannelDetail`

Responsible for:

* Video details
* Channel details
* Redux video state

This keeps API logic out of large UI components.

---

# 🏗️ Project Architecture

```text
src/
│
├── components/
│   │
│   ├── Header/
│   │   ├── Header.jsx
│   │   └── MobileSearchHeader.jsx
│   │
│   ├── HomePage/
│   │   ├── VideoCard.jsx
│   │   ├── VideoCardContainer.jsx
│   │   ├── VideoCardShimmer.jsx
│   │   ├── SearchContainer.jsx
│   │   └── SuggestionContainer.jsx
│   │
│   ├── WatchPage/
│   │   ├── MainVideoContainer.jsx
│   │   ├── MainVideoShimmer.jsx
│   │   ├── SearchResultCard.jsx
│   │   ├── CommentCard.jsx
│   │   ├── CommentCardShimmer.jsx
│   │   └── CommentsContainer.jsx
│   │
│   ├── Sidebar.jsx
│   └── Body.jsx
│
├── hooks/
│   ├── useComments.js
│   ├── usePopularMovies.js
│   └── useVideoandChannelDetail.js
│
├── utils/
│   ├── appSlice.js
│   ├── searchSlice.js
│   ├── videoSlice.js
│   ├── appStore.js
│   ├── constants.js
│   └── helper.js
│
├── pages/
│   └── ...
│
├── App.jsx
├── main.jsx
└── index.css
```

---

# 🧰 Tech Stack

## Frontend

* React
* JavaScript
* React Router DOM
* Tailwind CSS
* Vite

## State Management

* Redux Toolkit
* React Redux

## UI

* Lucide React
* Responsive Tailwind utilities
* Custom shimmer loading states

## API

* YouTube Data API
* YouTube embedded player
* Google Search Suggestions API

## Development

* Vite
* ESLint
* Git
* GitHub

---

# ⚡ Important Engineering Concepts Practiced

This project helped me work with several concepts that are much closer to real frontend development than simple component rendering.

### React

* Functional components
* Props
* Local state
* `useEffect`
* `useRef`
* Conditional rendering
* Reusable components

### Redux

* `createSlice`
* Global state
* Actions
* Selectors
* Redux-based caching

### API Integration

* REST APIs
* Query parameters
* Pagination
* `nextPageToken`
* Multiple dependent API requests
* Async data handling

### Browser APIs

* `IntersectionObserver`
* DOM event listeners

### Routing

* Nested routes
* Dynamic query parameters
* Search params
* `Outlet`
* `Link`

### UI Engineering

* Responsive layouts
* Mobile-specific interfaces
* Shimmer loading
* Dark mode
* Hover states
* Expand/collapse patterns

---

# 🔥 The Interesting Part: Search Architecture

The search system is one of the areas I spent significant time understanding.

The flow is:

```text
                    User Input
                        │
                        ↓
                 Redux inputSearch
                        │
                        ↓
                   200ms delay
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
        Cache contains?       Cache missing
              ↓                   ↓
        Use cached data       API Request
                                  ↓
                           Save in Redux
                                  ↓
                         Update suggestions
```

This was a practical exercise in understanding:

**debouncing + caching + global state + API calls**

all working together.

---

# ♾️ Infinite Scroll Architecture

The feed and comments use a similar concept:

```text
API
 ↓
Current page
 ↓
nextPageToken
 ↓
IntersectionObserver
 ↓
Next API request
 ↓
Append results
 ↓
Repeat
```

This prevents the application from loading a huge dataset at once.

---

# 📱 Responsive Design

The UI was designed for different screen sizes rather than simply shrinking the desktop version.

### Desktop

* Sidebar
* Full search bar
* Voice search
* Create button
* Notifications
* Profile

### Mobile

* Compact header
* Dedicated mobile search mode
* Back navigation
* Responsive video cards
* Stacked watch-page layout

---

# 🧪 Current Project State

StreamTube is primarily a **frontend-focused project**.

The goal was to reproduce the experience and architecture of a real video platform rather than implement every backend capability.

Some controls are therefore currently UI demonstrations rather than full production features.

For example:

```text
Like
Dislike
Subscribe
Share
Download
Notifications
Create
```

The project focuses primarily on:

> **React architecture + API integration + state management + UI engineering**

---

# 📈 What I Learned

Building StreamTube taught me that frontend development is not just about writing JSX.

The difficult part is often deciding:

**Where should the state live?**

**When should the API be called?**

**How can duplicate requests be avoided?**

**How should asynchronous data be represented in the UI?**

**How should components communicate?**

**What should happen when the API is slow?**

**What should happen when the user scrolls faster than the data loads?**

**How should mobile interaction differ from desktop interaction?**

Those decisions became one of the most valuable parts of this project.

---

# 🚧 Future Improvements

The current version is intentionally frontend-focused, but there are several areas that could be expanded.

### Possible improvements

* Real authentication
* Personalized home feed
* Functional likes/dislikes
* Real subscriptions
* Persistent watch history
* Playlists
* Watch later
* Functional notifications
* Video recommendations
* Better API error handling
* Better caching strategy
* More reusable UI primitives
* Improved accessibility
* Tests
* Backend integration

---

# 💻 Getting Started

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Move into the project:

```bash
cd streamtube
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

Start the development server:

```bash
npm run dev
```

The application will then be available through the local Vite development server.

---

# 🔐 Environment Variables

The project expects the YouTube API key to be provided through Vite environment variables.

```env
VITE_YOUTUBE_API_KEY=your_api_key
```

API keys should never be committed directly into the repository.

---

# ❤️ Final Note

This project represents a lot more than a YouTube-style UI for me.

It represents the point where I started thinking more seriously about **how frontend applications are actually structured**.

Every API request, every hook, every Redux slice, every loading state, every responsive breakpoint and every small UI interaction forced me to think:

> **“Why should this work this way?”**

And that is probably the most valuable thing I got from building it.

---

# 🎬 StreamTube

### **Watch. Explore. Search. Learn.**

Built with **React ❤️ + Redux Toolkit + Tailwind CSS + YouTube Data API**

---

## ⭐ One Last Thing

**Please don't just star the repository.**

Open the code.

Read it.

Critique it.

Find the bad patterns.

Find the unnecessary code.

Find the architectural mistakes.

Tell me what you would change.

Because this project isn't finished just because it runs.

> **It gets better when someone smarter finds something I can improve.**
