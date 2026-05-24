import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { getToken, type User } from './api';
import { Login } from './Auth';
import { Layout } from './Layout';
import { Dashboard, NewPatient, Patients, Schedule, Scores } from './pages';

function App() {
  const [user, setUser] = React.useState<User | null>(getToken() ? { id: 0, email: 'sessão ativa' } : null);
  const [page, setPage] = React.useState('dashboard');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Layout user={user} page={page} setPage={setPage} onLogout={() => setUser(null)}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'patients' && <Patients />}
      {page === 'new-patient' && <NewPatient onCreated={() => setPage('patients')} />}
      {page === 'schedule' && <Schedule />}
      {page === 'scores' && <Scores />}
    </Layout>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
