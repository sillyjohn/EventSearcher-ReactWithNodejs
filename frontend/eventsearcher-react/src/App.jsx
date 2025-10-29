import Navbar from './component/Navbar'
import './App.css'
import Searchform from './component/Searchform'
import Eventgrid from './component/Eventgrid'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Searchform />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Your content will go here */}
        <Eventgrid />
      </main>
    </div>
  )
}

export default App
