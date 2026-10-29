import React, { useEffect, useState } from 'react'
import { FiInbox, FiSend, FiMail } from 'react-icons/fi'
import { sendCourrier, fetchCourrierInbox, fetchCourrierSent, fetchUsers } from '../services/api'
import './Messagerie.css'

const Messagerie = () => {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })
  const [inbox, setInbox] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ receiver_id: '', objet: '', message: '' })
  const [tab, setTab] = useState('inbox')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, inboxRes, sentRes] = await Promise.all([
        fetchUsers(),
        fetchCourrierInbox(),
        fetchCourrierSent()
      ])
      const usersData = usersRes.data.data || usersRes.data || []
      const inboxData = inboxRes.data.data || inboxRes.data || []
      const sentData = sentRes.data.data || sentRes.data || []

      // Double-filtre côté client pour éviter toute fuite entre comptes
      const meId = currentUser?.id
      setUsers(usersData)
      setInbox(meId ? inboxData.filter(m => m.receiver_id === meId) : inboxData)
      setSent(meId ? sentData.filter(m => m.sender_id === meId) : sentData)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await sendCourrier(form)
      setSuccess('Courrier envoyé')
      setForm({ receiver_id: '', objet: '', message: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi')
    }
  }

  const renderList = (list, type) => (
    <div className="message-list">
      {list.length === 0 && <p className="empty">Aucun message</p>}
      {list.map(msg => (
        <div key={msg.id} className="message-card">
          <div className="message-header">
            <div className="message-meta">
              {type === 'inbox' ? <FiInbox /> : <FiSend />}
              <span className="message-from">{type === 'inbox' ? msg.sender?.name : msg.receiver?.name}</span>
            </div>
            <span className="message-date">{new Date(msg.created_at).toLocaleString('fr-FR')}</span>
          </div>
          <div className="message-subject">{msg.objet}</div>
          <div className="message-content">{msg.message}</div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="messagerie-page">
      <div className="messagerie-header">
        <div>
          <h1><FiMail /> Messagerie</h1>
          <p>Envoyez et consultez vos messages privés.</p>
        </div>
        <div className="tabs">
          <button className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>Reçus</button>
          <button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>Envoyés</button>
        </div>
      </div>

      <div className="messagerie-content">
        <div className="form-card">
          <h3>Nouveau message</h3>
          <form onSubmit={handleSubmit}>
            <label>Destinataire</label>
            <select name="receiver_id" value={form.receiver_id} onChange={handleChange} required>
              <option value="">-- Choisir un utilisateur --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>

            <label>Objet</label>
            <input name="objet" value={form.objet} onChange={handleChange} required />

            <label>Message</label>
            <textarea name="message" rows="4" value={form.message} onChange={handleChange} required />

            <button type="submit" disabled={loading}>Envoyer</button>
          </form>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </div>

        <div className="list-card">
          {tab === 'inbox' ? renderList(inbox, 'inbox') : renderList(sent, 'sent')}
        </div>
      </div>
    </div>
  )
}

export default Messagerie
