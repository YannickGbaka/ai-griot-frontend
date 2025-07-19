# Digital Griot - Frontend Application

A React-based web application for preserving and sharing oral traditions, stories, and cultural heritage from communities around the world.

## 🎯 Project Overview

The Digital Griot is a platform that allows contributors to upload audio recordings of oral stories. The frontend provides an intuitive interface for:

- **Contributors**: Upload and manage their story submissions
- **Public Users**: Browse, search, and listen to stories from around the world
- **Cultural Preservation**: Making oral traditions accessible and discoverable globally

## ✨ Features Implemented

### 🔐 Authentication System
- **Login Page**: Secure user authentication with email/password and OAuth options
- **Sign-up Page**: User registration with password validation and terms agreement
- **Form Validation**: Real-time validation with visual feedback

### 📱 Core User Interface
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Navigation**: Clean header with mobile menu support
- **Footer**: Comprehensive site links and information

### 🎵 Story Upload System
- **Multi-step Upload Process**:
  1. Audio recording (in-browser) or file upload (drag & drop)
  2. Story metadata form (title, description, language, origin, tags)
  3. Review and submission
- **Audio Recording**: Browser-based audio recording with real-time timer
- **File Upload**: Support for MP3, WAV, M4A, FLAC, OGG formats
- **Progress Tracking**: Visual progress indicator throughout upload process

### 📚 Story Discovery
- **Browse Stories**: Grid layout with story cards showing key information
- **Search & Filter**: Full-text search with language and region filters
- **Story Details**: Comprehensive story pages with audio player and metadata

### 🎧 Advanced Audio Features
- **Audio Player**: Custom player with play/pause, seek, and volume controls
- **Interactive Transcripts**: Click-to-navigate transcript segments
- **Multi-language Support**: Translation dropdown for different languages
- **Synchronized Highlighting**: Transcript highlights based on audio playback

### 👤 User Dashboard
- **Story Management**: View all submitted stories with status tracking
- **Analytics**: View counts, listen counts, and ratings for published stories
- **Status Filtering**: Filter stories by processing status (all/published/processing/rejected)
- **Action Controls**: Edit, delete, and view published stories

### 🎨 Design System
- **Custom Color Palette**: "Griot" theme with warm, cultural colors
- **Consistent Components**: Reusable UI components with Tailwind classes
- **Icons**: Lucide React icons throughout the interface
- **Typography**: Inter font for modern, readable text

## 🛠 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development and building)
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **File Upload**: React Dropzone
- **Audio Recording**: Web MediaRecorder API
- **State Management**: React useState and useRef hooks

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       └── Layout.tsx          # Main layout with header/footer
├── pages/
│   ├── HomePage.tsx            # Landing page with hero and features
│   ├── LoginPage.tsx           # Authentication login form
│   ├── SignUpPage.tsx          # User registration form
│   ├── StoriesPage.tsx         # Story browsing and search
│   ├── StoryDetailPage.tsx     # Individual story view
│   ├── UploadPage.tsx          # Multi-step story upload
│   └── DashboardPage.tsx       # User story management
├── App.tsx                     # Main app with routing
├── main.tsx                    # React entry point
└── index.css                   # Global styles and Tailwind directives
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd ai-griot-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint code analysis

## 🎨 Design Features

### Color Scheme
- **Primary**: Griot palette (warm oranges and browns)
- **Secondary**: Clean grays for text and backgrounds
- **Accent**: Green for success states, red for errors

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: sm, md, lg, xl responsive breakpoints
- **Touch-friendly**: Large tap targets and intuitive gestures

### Accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: WCAG compliant color combinations

## 📱 Key User Flows

### Story Upload Flow
1. **Authentication**: User signs up/logs in
2. **Audio Input**: Record in-browser OR upload audio file
3. **Metadata**: Add story details, tags, and cultural context
4. **Review**: Preview all information before submission
5. **Submit**: Story enters AI processing pipeline

### Story Discovery Flow
1. **Browse**: Explore featured and recent stories
2. **Search**: Find stories by title, description, or tags
3. **Filter**: Narrow results by language, region, or category
4. **Listen**: Play audio with synchronized transcript
5. **Interact**: Like, share, and provide feedback

### Dashboard Management
1. **Overview**: See statistics and story status summary
2. **Filter**: View stories by processing status
3. **Manage**: Edit metadata or delete stories
4. **Track**: Monitor views, listens, and ratings

## 🔧 Configuration

### Tailwind Configuration
Custom theme extends with:
- Griot color palette
- Custom component classes
- Typography settings

### Vite Configuration
- React plugin setup
- Path aliases (`@/` for src)
- Development server on port 3000

## 🎯 Next Steps for Integration

### Backend Integration Points
1. **Authentication API**: Replace mock auth with real JWT/OAuth
2. **Story Upload API**: Connect upload form to backend storage
3. **Search API**: Implement real search with filtering
4. **Audio Processing**: Display real transcription status
5. **User Management**: Connect dashboard to user story data

### AI/ML Integration
1. **Transcription Status**: Show real AI processing progress
2. **Translation Display**: Load actual AI-generated translations
3. **Audio Analysis**: Display sentiment and entity analysis
4. **Quality Feedback**: Show audio quality assessment results

## 🐛 Known Limitations

- **Mock Data**: Currently uses static mock data for demonstration
- **Audio Playback**: No actual audio files (mocked with URLs)
- **File Upload**: Frontend-only validation (needs backend integration)
- **Search**: Client-side filtering only (needs backend search)
- **Authentication**: UI-only (needs backend authentication service)

## 📄 License

This project is part of the Digital Griot cultural preservation platform.

---

**Digital Griot Frontend v1.0** - Preserving oral traditions through technology 🎭
