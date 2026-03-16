"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Upcoming from './pages/Upcoming';
import Collection from './pages/Collection';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Compare from './pages/Compare';
import Stats from './pages/Stats';
import Auth from './pages/Auth';
import About from './pages/About';
import Contact from './pages/Contact';
import ScrollToTopOnNav from './components/layout/ScrollToTopOnNav';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <ScrollToTopOnNav />
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/upcoming" element={<Upcoming />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/compare/:friendId" element={<Compare />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;