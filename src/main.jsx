import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import VideoCardContainer from "./components/HomePage/VideoCardContainer.jsx";
import MainVideoContainer from "./components/WatchPage/MainVideoContainer";
import Body from './components/Body';
import { appStore } from './utils/appStore.js'
import { Provider } from 'react-redux'
import SearchContainer from "./components/HomePage/SearchContainer.jsx";
import VideoLibraryPage from "./components/Library/VideoLibraryPage.jsx";
import PlaylistsPage from "./components/Library/PlaylistsPage.jsx";
import SubscriptionsPage from "./components/Library/SubscriptionsPage.jsx";
import ShortsPage from "./components/HomePage/ShortsPage.jsx";
import ExplorePage from "./components/HomePage/ExplorePage.jsx";
import YourVideosPage from "./components/Library/YourVideosPage.jsx";
import AccountPage from "./components/Library/AccountPage.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import LibrarySyncBridge from "./auth/LibrarySyncBridge.jsx";
const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Body />,
        children: [
          {
            index: true,
            element: <VideoCardContainer />,
          },
          {
            path: "/watch",
            element: <MainVideoContainer />,
          },
          {
            path: "/results",
            element: <SearchContainer />,
          },
          {
            path: "/watch-later",
            element: <VideoLibraryPage type="watchLater" />,
          },
          {
            path: "/history",
            element: <VideoLibraryPage type="history" />,
          },
          {
            path: "/liked-videos",
            element: <VideoLibraryPage type="likedVideos" />,
          },
          {
            path: "/subscriptions",
            element: <SubscriptionsPage />,
          },
          {
            path: "/shorts",
            element: <ShortsPage />,
          },
          {
            path: "/explore",
            element: <ExplorePage />,
          },
          {
            path: "/your-videos",
            element: <YourVideosPage />,
          },
          {
            path: "/account",
            element: <AccountPage />,
          },
          {
            path: "/playlists",
            element: <PlaylistsPage />,
          },
          {
            path: "/playlists/:playlistId",
            element: <PlaylistsPage />,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Provider store={appStore}>
      <LibrarySyncBridge />
      <RouterProvider router={appRouter} />
    </Provider>
  </AuthProvider>
);
