import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import StudentHome from "./pages/StudentHome"
import OrganizerHome from "./pages/OrganizerHome"
import Contests from "./pages/Contests"
import CreateContest from "./pages/CreateContest"
import Tasks from "./pages/Tasks"
import CreateTask from "./pages/CreateTask"
import Profile from "./pages/Profile"
import Archive from "./pages/Archive"
import ContestMenu from "./pages/ContestMenu"
import TaskPage from "./pages/Task"
import MySubmissions from "./pages/MySubmissions"
import AdminPanel from "./pages/AdminPanel"
import Drafts from "./pages/Drafts"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/tasks/create" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /> </ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute><StudentHome /></ProtectedRoute>}/>
        <Route path="/organizer" element={<ProtectedRoute> <OrganizerHome /></ProtectedRoute>}/>
        <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
        <Route path="/contests/create" element={<ProtectedRoute><CreateContest /></ProtectedRoute>}/>
        <Route path="/tasks/drafts" element={<Drafts />} />
        <Route path="/contests/:contest_id" element={<ProtectedRoute><ContestMenu /> </ProtectedRoute>}/>
        <Route path="/contests/:id/edit" element={<CreateContest />} />
        <Route path="/tasks/:id" element={<TaskPage />} />
        <Route path="/my-submissions" element={<MySubmissions />} /> 
        <Route path="/admin" element={<AdminPanel />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App