import { Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { RequireAdmin } from "./RequireAdmin";
import { RequireAuth } from "./RequireAuth";
import AdminQueuePage from "./pages/AdminQueuePage";
import BrowsePage from "./pages/BrowsePage";
import LoginPage from "./pages/LoginPage";
import RewardsPage from "./pages/RewardsPage";
import SignupPage from "./pages/SignupPage";
import UploadReviewPage from "./pages/UploadReviewPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BrowsePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route
          path="reviews/new"
          element={
            <RequireAuth>
              <UploadReviewPage />
            </RequireAuth>
          }
        />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminQueuePage />
            </RequireAdmin>
          }
        />
        <Route path="rewards" element={<RewardsPage />} />
      </Route>
    </Routes>

  );
}
