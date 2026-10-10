import React, { useState } from 'react';
import { Search, UserPlus, UserCheck, MessageSquare, Shield, Globe } from 'lucide-react';
import { api } from '../../lib/api';
import { SafeUser } from '../../types';

interface ExploreViewProps {
  currentUser: SafeUser;
  onOpenProfile: (username: string) => void;
  onStartChat: (username: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  currentUser,
  onOpenProfile,
  onStartChat,
}) => {
  const [searchHandle, setSearchHandle] = useState('');
  const [searchResult, setSearchResult] = useState<{ user: SafeUser; isFollowing: boolean } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Suggested community members to explore
  const [communityMembers, setCommunityMembers] = useState([
    {
      username: 'cove',
      displayName: 'Cove Platform',
      bio: 'Public discovery, private conversations. Welcome to Cove.',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isFollowing: true,
    },
    {
      username: 'mayalin',
      displayName: 'Maya Lin',
      bio: 'Architectural photographer & urban explorer. Documenting spaces.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
    },
    {
      username: 'devinchen',
      displayName: 'Devin Chen',
      bio: 'Distributed systems engineer. Coffee & open-source enthusiast.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
    },
  ]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchHandle.trim().replace(/^@/, '');
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await api.getUserProfile(clean);
      setSearchResult(res);
    } catch {
      setSearchError(`No member found with username @${clean}`);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleFollow = async (username: string) => {
    try {
      const res = await api.toggleFollow(username);
      setCommunityMembers((prev) =>
        prev.map((m) => (m.username === username ? { ...m, isFollowing: res.isFollowing } : m))
      );
      if (searchResult && searchResult.user.username === username) {
        setSearchResult({ ...searchResult, isFollowing: res.isFollowing });
      }
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 font-display mb-1">
          Explore & Discover
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Find people, creative thinkers, and community members across Cove.
        </p>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchHandle}
              onChange={(e) => setSearchHandle(e.target.value)}
              placeholder="Search by username handle (e.g. mayalin)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5AFF]"
            />
          </div>
          <button
            type="submit"
            disabled={!searchHandle.trim() || isSearching}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D5AFF] hover:bg-[#2448cc] disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchError && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
            {searchError}
          </div>
        )}

        {searchResult && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenProfile(searchResult.user.username)}
                className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 cursor-pointer"
              >
                {searchResult.user.avatarUrl ? (
                  <img src={searchResult.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                    {searchResult.user.displayName.charAt(0)}
                  </div>
                )}
              </button>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  {searchResult.user.displayName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  @{searchResult.user.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleFollow(searchResult.user.username)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  searchResult.isFollowing
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-[#2D5AFF] text-white hover:bg-[#2448cc]'
                }`}
              >
                {searchResult.isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                type="button"
                onClick={() => onStartChat(searchResult.user.username)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#2D5AFF] hover:border-[#2D5AFF] transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Community Members */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Featured Community Members
        </h3>

        <div className="space-y-3 divide-y divide-slate-100">
          {communityMembers
            .filter((m) => m.username !== currentUser.username)
            .map((member) => (
              <div key={member.username} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(member.username)}
                    className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shrink-0 cursor-pointer"
                  >
                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenProfile(member.username)}
                      className="text-xs font-bold text-slate-900 hover:text-[#2D5AFF] text-left block"
                    >
                      {member.displayName}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      @{member.username}
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(member.username)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      member.isFollowing
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#2D5AFF] text-white hover:bg-[#2448cc]'
                    }`}
                  >
                    {member.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartChat(member.username)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#2D5AFF] hover:border-[#2D5AFF] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
