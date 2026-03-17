import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Home from "./pages/Home"
import StudentHome from "./pages/StudentHome"
import OrganizerHome from "./pages/OrganizerHome"
import Contests from "./pages/Contests"
import CreateContest from "./pages/CreateContest"
import Drafts from "./pages/Drafts"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>

      <Routes>

        
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        

        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <ProtectedRoute>
              <OrganizerHome />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/contests" 
          element={
            <ProtectedRoute>
              <Contests />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/contests/create"
          element={
            <ProtectedRoute>
              <CreateContest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contests/drafts"
          element={
            <ProtectedRoute>
              <Drafts />
            </ProtectedRoute>
          }
        />


      </Routes>

    </BrowserRouter>
  )
}

export default App