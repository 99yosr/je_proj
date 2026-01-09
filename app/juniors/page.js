"use client"

import { useEffect, useState } from "react"
import { addJunior, getJuniors, updateJunior, deleteJunior } from "../../lib/juniorsCRUD"

export default function JuniorsPage() {
  const [juniors, setJuniors] = useState([])
  const [form, setForm] = useState({ name: "", role: "", city: "", contact_email: "" })
  const [editingId, setEditingId] = useState(null)

  const fetchData = async () => {
    const { data, error } = await getJuniors()
    if (error) console.log(error)
    else setJuniors(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const saveJuniorHandler = async () => {
    const { name, role, city, contact_email } = form
    if (!name || !role || !city) return alert("Nom, rôle et ville sont requis !")

    if (editingId) {
      const { data, error } = await updateJunior(editingId, form)
      if (error) return console.log(error)
      setJuniors(juniors.map(j => j.id === editingId ? data[0] : j))
      setEditingId(null)
    } else {
      const { data, error } = await addJunior(form)
      if (error) return console.log(error)
      setJuniors([...juniors, ...data])
    }

    setForm({ name: "", role: "", city: "", contact_email: "" })
  }

  const deleteHandler = async (id) => {
    const { error } = await deleteJunior(id)
    if (error) return console.log(error)
    setJuniors(juniors.filter(j => j.id !== id))
  }

  const editHandler = (junior) => {
    setForm({
      name: junior.name,
      role: junior.role,
      city: junior.city,
      contact_email: junior.contact_email || ""
    })
    setEditingId(junior.id)
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#2c3e50" }}>
        Gestion des Juniors
      </h1>

      {/* Formulaire Ajouter / Modifier */}
      <div style={{
        marginBottom: "30px",
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
        backgroundColor: "#ecf0f1",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <input placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ flex: "1", padding: "10px", borderRadius: "5px", border: "1px solid #bdc3c7" }} />
        <input placeholder="Rôle" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ flex: "1", padding: "10px", borderRadius: "5px", border: "1px solid #bdc3c7" }} />
        <input placeholder="Ville" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ flex: "1", padding: "10px", borderRadius: "5px", border: "1px solid #bdc3c7" }} />
        <input placeholder="Email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={{ flex: "1", padding: "10px", borderRadius: "5px", border: "1px solid #bdc3c7" }} />
        <button onClick={saveJuniorHandler} style={{ padding: "10px 20px", backgroundColor: "#27ae60", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          {editingId ? "Modifier" : "Ajouter"}
        </button>
        {editingId && (
          <button onClick={() => { setForm({ name: "", role: "", city: "", contact_email: "" }); setEditingId(null) }} style={{ padding: "10px 20px", backgroundColor: "#c0392b", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            Annuler
          </button>
        )}
      </div>

      {/* Tableau des juniors */}
      <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <thead style={{ backgroundColor: "#3498db", color: "#fff" }}>
          <tr>
            <th style={{ padding: "12px" }}>ID</th>
            <th style={{ padding: "12px" }}>Nom</th>
            <th style={{ padding: "12px" }}>Rôle</th>
            <th style={{ padding: "12px" }}>Ville</th>
            <th style={{ padding: "12px" }}>Email</th>
            <th style={{ padding: "12px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {juniors.map(j => (
            <tr key={j.id} style={{ textAlign: "center", backgroundColor: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px" }}>{j.id}</td>
              <td>{j.name}</td>
              <td>{j.role}</td>
              <td>{j.city}</td>
              <td>{j.contact_email}</td>
              <td>
                <button onClick={() => editHandler(j)} style={{ marginRight: "5px", padding: "5px 10px", backgroundColor: "#f39c12", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                  Modifier
                </button>
                <button onClick={() => deleteHandler(j.id)} style={{ padding: "5px 10px", backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer" }}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
