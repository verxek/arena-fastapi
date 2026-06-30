import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getAllUsers, createUser, changeUserRole } from "../api/admin";
import "../styles/global.css";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("participant");

  const currentRole = localStorage.getItem("role");

  if (currentRole !== "admin") {
    return <div className="page-container">Нет доступа</div>;
  }

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      await createUser({
        email,
        nickname,
        password,
        role: newRole
      });

      setEmail("");
      setNickname("");
      setPassword("");
      setNewRole("participant");
      loadUsers();

    } catch (err) {
      console.error("Create user error:", err);
      alert(err.message || "Ошибка создания пользователя");
    }
  };

  const changeRole = async (userId, role) => {
    try {
      await changeUserRole(userId, role);
      loadUsers();
    } catch (err) {
      console.error("Change role error:", err);
      alert(err.message || "Ошибка изменения роли");
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <div className="page-layout">

        <h2 className="page-title">Админ панель</h2>

        {/* Форма создания */}
        <div className="block" style={{ marginTop: "20px" }}>
          <h3>Создать пользователя</h3>

          <div className="grid-2">
            <input
              className="input-field"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input-field"
              placeholder="Никнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <input
              className="input-field"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
           
            <select
              className="input-field"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="participant">Participant</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: "16px" }}
            onClick={handleCreateUser}
          >
            Создать
          </button>
        </div>

        {/* Таблица пользователей */}
        <div className="block" style={{ marginTop: "20px" }}>
          <h3>Пользователи</h3>

          {loading ? (
            <div className="loading-text">Загрузка...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Никнейм</th>
                  <th>Роль</th>
                  <th>Действие</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.nickname}</td>
                    <td>{u.role}</td>
                    <td>
                      <select
                        className="input-field"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        <option value="participant">participant</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminPanel;