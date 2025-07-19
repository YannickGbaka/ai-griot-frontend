# AI Griot Frontend - API Integration

This document describes the implementation of backend API integration in the Digital Griot frontend application.

## 🎯 What's Been Implemented

### ✅ API Service Layer
- **Base API Client** (`src/services/api.ts`) - HTTP client with authentication, error handling, and request/response interceptors
- **Authentication Service** (`src/services/authService.ts`) - User login, registration, token management
- **Stories Service** (`src/services/storiesService.ts`) - CRUD operations for stories, search, and filtering
- **Users Service** (`src/services/usersService.ts`) - User profile management and user-specific story operations
- **Media Service** (`src/services/mediaService.ts`) - Audio file upload and validation
- **AI Service** (`src/services/aiService.ts`) - Transcription, translation, and AI processing operations

### ✅ Type System
- **Comprehensive TypeScript interfaces** (`src/types/api.ts`) - Type definitions matching backend API models
- **Type-safe API calls** - All services use proper TypeScript types for requests and responses

### ✅ Authentication Context
- **Auth Provider** (`src/contexts/AuthContext.tsx`) - Global authentication state management
- **Auth Hook** - `useAuth()` hook for accessing authentication state and methods
- **Token Management** - Automatic storage and inclusion of JWT tokens in API requests

### ✅ Updated Components
- **Login Page** - Integrated with real authentication API
- **Layout Component** - Shows different navigation based on authentication status
- **App Component** - Wrapped with AuthProvider for global auth state

## 🛠 Backend APIs Integrated

### Authentication (`/api/v1/auth/`)
- `POST /register` - User registration
- `POST /login` - User login with JWT token
- `GET /me` - Get current user info
- `POST /refresh` - Refresh access token

### Users (`/api/v1/users/`)
- `GET /me` - Get current user profile
- `PUT /me` - Update current user profile
- `GET /me/stories` - Get current user's stories
- `GET /{user_id}` - Get user profile by ID
- `GET /{user_id}/stories` - Get user's public stories

### Stories (`/api/v1/stories/`)
- `POST /` - Create new story
- `GET /` - Get stories with filtering and search
- `GET /{story_id}` - Get specific story
- `PUT /{story_id}` - Update story
- `DELETE /{story_id}` - Delete story
- `GET /tags/` - Get all tags
- `POST /tags/` - Create new tag

### Media (`/api/v1/media/`)
- `POST /upload-audio` - Upload audio file for story

### AI Processing (`/api/v1/ai/`)
- `POST /transcribe` - Transcribe audio to text
- `POST /translate` - Translate story to different language
- `POST /text-to-speech` - Generate speech from text
- Various status endpoints for tracking AI processing

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend root:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Optional: Enable development features
VITE_ENABLE_DEV_TOOLS=true
```

## 📋 Next Steps to Complete Integration

### 1. Update Remaining Pages

#### Stories Page (`src/pages/StoriesPage.tsx`)
```typescript
import { storiesService } from '../services'
// Replace mock data with real API calls
const stories = await storiesService.getStories({ limit: 20 })
```

#### Story Detail Page (`src/pages/StoryDetailPage.tsx`)
```typescript
import { storiesService } from '../services'
// Load story data from API
const story = await storiesService.getStory(storyId)
```

#### Dashboard Page (`src/pages/DashboardPage.tsx`)
```typescript
import { usersService } from '../services'
// Load user's stories from API
const userStories = await usersService.getCurrentUserStories()
```

#### Upload Page (`src/pages/UploadPage.tsx`)
```typescript
import { storiesService, mediaService } from '../services'
// Create story and upload audio
const story = await storiesService.createStory(storyData)
await mediaService.uploadAudioFile(audioFile, story.id)
```

#### Sign Up Page (`src/pages/SignUpPage.tsx`)
```typescript
import { useAuth } from '../contexts/AuthContext'
// Use auth context for registration
const { register } = useAuth()
await register(userData)
```

### 2. Add Protected Routes
Create a `ProtectedRoute` component:

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
```

Wrap protected routes in `App.tsx`:
```typescript
<Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
```

### 3. Add Error Handling
Create a global error boundary and loading states for better UX.

### 4. Add Data Fetching Hooks
Create custom hooks for common data operations:

```typescript
// src/hooks/useStories.ts
export function useStories(query?: StoriesQuery) {
  const [stories, setStories] = useState<StoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    storiesService.getStories(query).then(setStories).finally(() => setLoading(false))
  }, [query])
  
  return { stories, loading }
}
```

### 5. Backend Connection
Ensure the backend is running on `http://localhost:8000` or update the `VITE_API_BASE_URL` in your environment variables.

## 🔌 Usage Examples

### Login a User
```typescript
const { login } = useAuth()
await login({ username: 'user@example.com', password: 'password' })
```

### Fetch Stories
```typescript
const stories = await storiesService.getStories({
  limit: 10,
  language: 'en-US',
  search: 'traditional tale'
})
```

### Upload Audio
```typescript
const story = await storiesService.createStory({
  title: 'My Story',
  description: 'A great story',
  language: 'en-US',
  origin: 'Kenya'
})

await mediaService.uploadAudioFile(audioFile, story.id)
```

### Get Current User
```typescript
const { user } = useAuth()
console.log(user?.full_name) // Current user's name
```

## 🐛 Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the backend CORS configuration includes your frontend URL.

### Authentication Issues
- Check that JWT tokens are being stored in localStorage
- Verify the backend authentication endpoints are working
- Ensure token expiration is handled properly

### API Connection Issues
- Verify the `VITE_API_BASE_URL` environment variable
- Check that the backend server is running
- Test API endpoints directly with curl or Postman

## 📚 Additional Resources

- [Backend API Documentation](../ai-griot-backend/README.md)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Query](https://tanstack.com/query/latest) - Consider for advanced data fetching
- [SWR](https://swr.vercel.app/) - Alternative for data fetching with caching

---

**Status**: Core API integration complete. Individual page updates needed for full functionality. 