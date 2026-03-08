"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { Search, UserPlus, UserMinus, Check, X, Users, Loader2, Clock } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = async (userId: string) => {
    try {
      // Fetch Friends (Accepted) - We look for people you are friends with
      const { data: friendsData } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          profiles:friend_id (id, username)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');
      
      setFriends(friendsData || []);

      // Fetch Incoming Requests - People who sent a request TO you
      const { data: incomingData } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          profiles:user_id (id, username)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');
      
      setIncomingRequests(incomingData || []);

      // Fetch Sent Requests - People YOU sent a request to
      const { data: sentData } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          profiles:friend_id (id, username)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');
      
      setSentRequests(sentData || []);
    } catch (err) {
      console.error("Error fetching social data:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        await fetchData(user.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentUser?.id)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      showError("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (friendId: string) => {
    const { error } = await supabase
      .from('friends')
      .insert({ user_id: currentUser.id, friend_id: friendId, status: 'pending' });
    
    if (error) {
      showError("Request already exists");
    } else {
      showSuccess("Friend request sent!");
      fetchData(currentUser.id);
    }
  };

  const respondRequest = async (requestId: string, accept: boolean) => {
    if (accept) {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (error) {
        showError("Failed to accept");
        return;
      }

      // Create reciprocal relationship for mutual friendship
      const request = incomingRequests.find(r => r.id === requestId);
      if (request) {
        await supabase.from('friends').insert({ 
          user_id: currentUser.id, 
          friend_id: request.user_id, 
          status: 'accepted' 
        });
      }
      showSuccess("Friend request accepted!");
    } else {
      await supabase.from('friends').delete().eq('id', requestId);
      showSuccess("Request declined");
    }
    fetchData(currentUser.id);
  };

  const removeFriend = async (friendshipId: string, friendId: string) => {
    if (!confirm("Remove this friend?")) return;
    await supabase.from('friends').delete().eq('id', friendshipId);
    await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', currentUser.id);
    showSuccess("Friend removed");
    fetchData(currentUser.id);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>;

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
          <div className="lg:col-span-2 space-y-8">
            {searchResults.length > 0 && (
              <section className="glass-card p-6 border-primary/20 cinematic-glow">
                <h2 className="text-xl font-serif font-bold mb-4">Search Results</h2>
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {user.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="font-bold">{user.username}</p>
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
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Your Friends ({friends.length})
              </h2>
              {friends.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                  <Users size={48} className="mx-auto mb-4" />
                  <p>No friends yet. Start searching to build your circle!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                          {friend.profiles?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="font-bold">{friend.profiles?.username || 'Unknown'}</p>
                      </div>
                      <button 
                        onClick={() => removeFriend(friend.id, friend.friend_id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <UserMinus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass-card p-6 border-primary/10">
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Check size={20} className="text-primary" />
                Incoming Requests
              </h2>
              {incomingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-sm font-bold mb-3">{req.profiles?.username || 'Unknown'}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => respondRequest(req.id, true)}
                          className="flex-1 py-2 bg-primary text-black text-xs font-bold rounded-lg"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => respondRequest(req.id, false)}
                          className="flex-1 py-2 bg-white/10 text-white text-xs font-bold rounded-lg"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-card p-6 border-white/5">
              <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-muted-foreground" />
                Sent Requests
              </h2>
              {sentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No sent requests</p>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((req) => (
                    <div key={req.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <p className="text-xs font-bold">{req.profiles?.username || 'Unknown'}</p>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Pending</span>
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