import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import StoriesPage from './pages/StoriesPage'
import StoryDetailPage from './pages/StoryDetailPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/stories/:id" element={<StoryDetailPage />} />
      </Routes>
    </Layout>
  )
}

export default App 