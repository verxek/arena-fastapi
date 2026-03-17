import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"

function Home() {

  const isAuth = localStorage.getItem("access_token")

  return (
    <div style={{padding:"40px"}}>
      <Navbar />

      <h1 style={{marginTop:"40px"}}>Добро пожаловать</h1>

      <p>Список контестов:</p>

      {/* тут потом будет список контестов */}
      <div>
        <p>Contest 1</p>
        <p>Contest 2</p>
      </div>

    </div>
  )
}

export default Home