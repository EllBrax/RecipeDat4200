import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Cookbook from './pages/Cookbook'
import TheKitchen from "./pages/TheKitchen";


export default function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/cookbook">Cookbook</Link>
        <Link to="/thekitchen">The Kitchen</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/cookbook" element={<Cookbook />}/>
        <Route path="/thekitchen" element={<TheKitchen/>}/>
      </Routes>
    </div>
  )
}