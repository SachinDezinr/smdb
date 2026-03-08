"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { Search, UserPlus, UserMinus, Check, X, Users, Loader2, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        fetchFriends(user.id);
        fetchRequests(user.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchFriends = async (userId: string) => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        friend_id,
        profiles:friend_id (id, username)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');
    
    if (!error) setFriends(data || []);
  };

  const fetchRequests = async (userId: string) => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        profiles:user_id (id, username)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (!error) setRequests(data || []);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', currentUser?.id)
      .limit(5);
    
    if (!error) setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (friendId: string) => {
    const { error } = await supabase
      .from('friends')
      .insert({ user_id: currentUser.id, friend_id: friendId, status: 'pending' });
    
    if (error) showError("Request already sent or error occurred");
    else showSuccess("Friend request sent!");
  };

  const respondRequest = async (requestId: string, accept: boolean) => {
    if (accept) {
      await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
      // Create reciprocal friendship
      const request = requests.find(r => r.id === requestId);
      await supabase.from('friends').insert({ 
        user_id: currentUser.id, 
        friend_id: request.user_id, 
        status: 'accepted' 
      });
      showSuccess("Friend request accepted!");
    } else {
      await supabase.from('friends').delete().eq('id', requestId);
    }
    fetchRequests(currentUser.id);
    fetchFriends(currentUser.id);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 max-w-5xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-6">
            Social <span className="text-primary">Circle</span>
          </h1>
          
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search by username..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={searching}
              className="bg-primary text-black px-8 rounded-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {searching ? <Loader2 className="animate-spin" size={20} /> : "Search"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Results */}
          <div className="lg:col-span-2 space-y-6">
            {searchResults.length > 0 && (
              <section className="glass-card p-6 border-primary/20">
                <h2 className="text-xl font-serif font-bold mb-4">Search Results</h2>
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{user.username}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => sendRequest(user.id)}
                        className="p-2 bg-primary text-black rounded-lg hover:scale-110 transition-transform"
                      >
                        <UserPlus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="glass-card p-6">
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Your Friends
              </h2>
              {friends.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No friends yet. Start searching!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                          {friend.profiles.username[0].toUpperCase()}
                        </div>
                        <p className="font-bold">{friend.profiles.username}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                          <BarChart2 size={18} />
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                          <UserMinus size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Requests Sidebar */}
          <div className="space-y-6">
            <section className="glass-card p-6 border-primary/10">
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Check size={20} className="text-primary" />
                Requests
              </h2>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-sm font-bold mb-3">{req.profiles.username}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => respondRequest(req.id, true)}
                          className="flex-1 py-1.5 bg-primary text-black text-xs font-bold rounded-lg"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => respondRequest(req.id, false)}
                          className="flex-1 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Friends;