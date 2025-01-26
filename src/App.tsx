import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppNavbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ComicCuts } from './pages/ComicCuts';
import { CutDetail } from './pages/CutDetail';
import { supabase } from './lib/supabase';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DevConsole } from './components/debug/DevConsole';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Router>
        <AppNavbar user={user} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/comics/:comicId/cuts" element={<ComicCuts />} />
          <Route path="/comics/:comicId/cuts/:cutId" element={<CutDetail />} />
        </Routes>
      </Router>
      <DevConsole />
    </>
  );
}

export default App;