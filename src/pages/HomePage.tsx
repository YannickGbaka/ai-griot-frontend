import { Link } from 'react-router-dom'
import { Play, Search, Upload, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-griot-600 to-griot-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Preserving Oral Traditions for Future Generations
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-griot-100">
              The StoryGriot AI helps communities capture, preserve, and share their stories, 
              histories, and cultural knowledge through AI-powered transcription and translation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/stories" className="bg-white text-griot-700 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors">
                Explore Stories
              </Link>
              <Link to="/upload" className="border-2 border-white text-white hover:bg-white hover:text-griot-700 font-semibold py-3 px-8 rounded-lg transition-colors">
                Share Your Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How StoryGriot AI Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From recording to global sharing, our AI-powered platform makes preserving oral traditions simple
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-griot-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="text-griot-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Record & Upload</h3>
              <p className="text-gray-600">
                Upload audio recordings of stories, songs, or cultural knowledge directly from your device or record in-browser.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-griot-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-griot-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Processing</h3>
              <p className="text-gray-600">
                Our AI automatically transcribes audio, translates to multiple languages, and analyzes cultural context.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-griot-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="text-griot-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Global Sharing</h3>
              <p className="text-gray-600">
                Stories become searchable and accessible to a global audience while preserving their cultural authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Stories
            </h2>
            <p className="text-xl text-gray-600">
              Discover cultural treasures from communities around the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Featured Story Cards - Mock Data */}
            {[
              {
                title: "The Creation of the Baobab Tree",
                storyteller: "Amara Diallo",
                origin: "Mali",
                duration: "8:45",
                language: "Bambara",
                description: "An ancient tale about how the mighty baobab tree came to be, passed down through generations in the Mandé people."
              },
              {
                title: "The Legend of Anansi",
                storyteller: "Kofi Asante",
                origin: "Ghana", 
                duration: "12:30",
                language: "Twi",
                description: "Stories of the clever spider Anansi, the trickster figure central to West African and Caribbean folklore."
              },
              {
                title: "Songs of the Ancestors",
                storyteller: "Maria Santos",
                origin: "Brazil",
                duration: "15:20",
                language: "Portuguese",
                description: "Traditional songs that connect the living with ancestral spirits, preserved in Brazilian Candomblé traditions."
              }
            ].map((story, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-griot-600 rounded-full flex items-center justify-center">
                      <Play className="text-white" size={16} />
                    </div>
                    <span className="text-sm text-gray-500">{story.duration}</span>
                  </div>
                  <span className="text-sm bg-griot-100 text-griot-700 px-2 py-1 rounded">
                    {story.language}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{story.description}</p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>by {story.storyteller}</span>
                  <span>{story.origin}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/stories" className="btn-primary">
              Browse All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-griot-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Have a Story to Share?
          </h2>
          <p className="text-xl text-griot-100 mb-8 max-w-2xl mx-auto">
            Join our global community of storytellers and help preserve cultural heritage for future generations.
          </p>
          <Link to="/upload" className="bg-white text-griot-700 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors">
            Start Sharing
          </Link>
        </div>
      </section>
    </div>
  )
} 