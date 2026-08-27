"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/layout/Navigation';
import { supabase } from '@/lib/supabase';
import { Search, UserPlus, UserMinus, Check, Users, Loader2, Clock, RefreshCw, BarChart3, Sparkles } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchData = useCallback(async (userId: string) => {
    setRefreshing(true);
    try {
      const { data: friendsData } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          profiles!friends_friend_id_fkey (id, username)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');
      
      setFriends(friendsData || []);

      const { data: incomingData } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          profiles!friends_user_id_fkey (id, username)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');
      
      setIncomingRequests(incomingData || []);

      const { data: sentData } = await supabase
        .from('friends')
        .select(`
          id,
          friend_id,
          profiles!friends_friend_id_fkey (id, username)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');
      
      setSentRequests(sentData || []);
    } catch (err) {
      console.error("Error fetching social data:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
  }, [fetchData]);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 lg:p-12 pb-28 lg:pb-12 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                <Sparkles size={14} /> Cinephile Network
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Social <span className="text-primary">Circle</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Connect with friends and compare your collections.</p>
            </div>
            
            <button 
              onClick={() => fetchData(currentUser.id)}
              disabled={refreshing}
              className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all text-primary"
              title="Refresh lists"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
            </button>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search cinephile by username..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={searching}
              className="bg-primary text-black px-6 md:px-8 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {searching ? <Loader2 className="animate-spin" size={16} /> : "Search"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {searchResults.length > 0 && (
              <section className="glass-card p-6 border-primary/30 rounded-3xl cinematic-glow">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                  <h2 className="text-base font-bold text-white tracking-tight">Search Results</h2>
                  <button onClick={() => setSearchResults([])} className="text-xs text-muted-foreground hover:text-white">Clear</button>
                </div>
                <div className="space-y-2.5">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-primary/20 rounded-xl flex-shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                          {user.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="font-semibold text-sm text-white truncate">{user.username}</p>
                      </div>
                      <button 
                        onClick={() => sendRequest(user.id)}
                        className="p-2 bg-primary text-black rounded-xl hover:scale-105 transition-transform flex-shrink-0 shadow-sm"
                        title="Send friend request"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="glass-card p-6 rounded-3xl border-white/10">
              <h2 className="text-base font-bold text-white tracking-tight mb-5 flex items-center gap-2 pb-3 border-b border-white/5">
                <Users size={18} className="text-primary" />
                Your Friends ({friends.length})
              </h2>
              {friends.length === 0 ? (
                <div className="text-center py-16 opacity-50 space-y-2">
                  <Users size={48} className="mx-auto mb-2 text-primary/40" />
                  <p className="text-sm font-semibold text-white">No friends added yet</p>
                  <p className="text-xs text-muted-foreground">Search by username above to connect with fellow cinephiles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="p-3.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 flex items-center justify-between group transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex-shrink-0 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                          {friend.profiles?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="font-semibold text-sm text-white truncate">{friend.profiles?.username || 'Unknown'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link 
                          to={`/compare/${friend.friend_id}`}
                          className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all"
                          title="Compare Collections"
                        >
                          <BarChart3 size={16} />
                        </Link>
                        <button 
                          onClick={() => removeFriend(friend.id, friend.friend_id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Friend"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass-card p-6 rounded-3xl border-primary/20">
              <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2 pb-3 border-b border-white/5">
                <Check size={18} className="text-primary" />
                Incoming Requests
              </h2>
              {incomingRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No pending friend requests</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div key={req.id} className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/5">
                      <p className="text-xs font-bold text-white mb-2.5 truncate">{req.profiles?.username || 'Unknown'}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => respondRequest(req.id, true)}
                          className="flex-1 py-1.5 bg-primary text-black text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => respondRequest(req.id, false)}
                          className="flex-1 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-card p-6 rounded-3xl border-white/10">
              <h2 className="text-base font-bold text-white tracking-tight mb-4 flex items-center gap-2 pb-3 border-b border-white/5">
                <Clock size={18} className="text-muted-foreground" />
                Sent Requests
              </h2>
              {sentRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No outgoing pending requests</p>
              ) : (
                <div className="space-y-2.5">
                  {sentRequests.map((req) => (
                    <div key={req.id} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate mr-2">{req.profiles?.username || 'Unknown'}</p>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex-shrink-0 bg-white/5 px-2 py-0.5 rounded-md">Pending</span>
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