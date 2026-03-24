import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Home from "./pages/Home"
import StudentHome from "./pages/StudentHome"
import OrganizerHome from "./pages/OrganizerHome"
import Contests from "./pages/Contests"
import CreateContest from "./pages/CreateContest"
import Drafts from "./pages/Drafts"
import Tasks from "./pages/Tasks";
import CreateTask from "./pages/CreateTask";
import Profile from "./pages/Profile"
import Archive from "./pages/Archive"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/tasks/create" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="contest/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /> </ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute><StudentHome /></ProtectedRoute>}/>
        <Route path="/organizer" element={<ProtectedRoute> <OrganizerHome /></ProtectedRoute>}/>
        <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
        <Route path="/contests/create" element={<ProtectedRoute><CreateContest /></ProtectedRoute>}/>
        <Route path="/contests/drafts" element={<ProtectedRoute><Drafts /> </ProtectedRoute>}/>

      </Routes>

    </BrowserRouter>
  )
}

export default App