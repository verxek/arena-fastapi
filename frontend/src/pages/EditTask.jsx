// frontend/src/pages/EditTask.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function EditTask() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [categories, setCategories] = useState([]);
  const [difficulties, setDifficulties] = useState([]);

  const [testsFile, setTestsFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);

  const [examples, setExamples] = useState([]);

  const [formData, setFormData] = useState({
    task_name: "",
    statement: "",
    input_format: "",
    output_format: "",
    category_id: 0,
    difficulty_id: 0,
    time_limit: 1000,
    memory_limit: 256,
    is_contest_task: false,
    make_visible_after_contest: false
  });

  // =========================
  // LOAD DICTS
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    fetch("http://127.0.0.1:8000/tasks/categories", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setCategories);

    fetch("http://127.0.0.1:8000/tasks/difficulties", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setDifficulties);
  }, []);

  // =========================
  // LOAD TASK
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setFormData({
          task_name: data.task_name,
          statement: data.statement,
          input_format: data.input_format || "",
          output_format: data.output_format || "",
          category_id: data.category_id || 0,
          difficulty_id: data.difficulty_id || 0,
          time_limit: data.time_limit,
          memory_limit: data.memory_limit,
          is_contest_task: false,
          make_visible_after_contest: false
        });

        setExamples(data.examples || []);
        setLoaded(true);
      });
  }, [taskId]);

  // =========================
  // EXAMPLES
  // =========================
  const addExample = () =>
    setExamples([...examples, { input: "", output: "" }]);

  const updateExample = (i, field, value) => {
    const copy = [...examples];
    copy[i][field] = value;
    setExamples(copy);
  };

  const removeExample = (i) => {
    const copy = examples.filter((_, idx) => idx !== i);
    setExamples(copy);
  };

  // =========================
  // SAVE
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("access_token");

    const data = new FormData();

    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    data.append("examples_json", JSON.stringify(examples));

    if (testsFile) data.append("tests_file", testsFile);
    if (solutionFile) data.append("solution_file", solutionFile);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: data
        }
      );

      if (res.ok) {
        alert("Задача обновлена");
        navigate("/tasks");
      } else {
        const err = await res.json();
        alert(err.detail);
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "120px" }}>
        <h1>Редактирование задачи</h1>

        <form onSubmit={handleSubmit}>

          <input
            value={formData.task_name}
            onChange={e => setFormData({...formData, task_name: e.target.value})}
            placeholder="Название"
          />

          <textarea
            value={formData.statement}
            onChange={e => setFormData({...formData, statement: e.target.value})}
            placeholder="Условие"
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={formData.category_id}
              onChange={e => setFormData({...formData, category_id: +e.target.value})}
            >
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>

            <select
              value={formData.difficulty_id}
              onChange={e => setFormData({...formData, difficulty_id: +e.target.value})}
            >
              {difficulties.map(d => (
                <option key={d.difficulty_id} value={d.difficulty_id}>
                  {d.diff_name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            value={formData.time_limit}
            onChange={e => setFormData({...formData, time_limit: e.target.value})}
          />

          <input
            type="number"
            value={formData.memory_limit}
            onChange={e => setFormData({...formData, memory_limit: e.target.value})}
          />

          <h3>Примеры</h3>

          {examples.map((ex, i) => (
            <div key={i}>
              <textarea
                value={ex.input}
                onChange={e => updateExample(i, "input", e.target.value)}
              />
              <textarea
                value={ex.output}
                onChange={e => updateExample(i, "output", e.target.value)}
              />
              <button type="button" onClick={() => removeExample(i)}>
                удалить
              </button>
            </div>
          ))}

          <button type="button" onClick={addExample}>
            + пример
          </button>

          <h3>Файлы (необязательно)</h3>

          <input
            type="file"
            onChange={e => setTestsFile(e.target.files[0])}
          />

          <input
            type="file"
            onChange={e => setSolutionFile(e.target.files[0])}
          />

          <button type="submit" disabled={loading}>
            Сохранить
          </button>

        </form>
      </div>
    </div>
  );
}

export default EditTask;