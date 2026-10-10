import React, { useState, useEffect } from 'react';
import { User, Shield, KeyRound, LogOut, Heart, Edit3, X, Check, Lock, Globe } from 'lucide-react';
import { api } from '../../lib/api';
import { SafeUser, Post } from '../../types';

interface ProfileViewProps {
  currentUser: SafeUser;
  onLogout: () => void;
  onUserUpdated?: (user: SafeUser) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onLogout,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'security'>('posts');
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatarUrl);
  const [editPrivate, setEditPrivate] = useState(currentUser.isPrivate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMyPosts();
  }, [currentUser.id]);

  const loadMyPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const res = await api.getFeed();
      setMyPosts(res.posts.filter((p) => p.authorId === currentUser.id));
    } catch (err) {
      console.error('Failed to load my posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await api.completeOnboarding({
        bio: editBio.trim(),
        avatarUrl: editAvatar.trim(),
        isPrivate: editPrivate,
      });
      if (onUserUpdated) {
        onUserUpdated(res.user);
      }
      setIsEditing(false);
      setSaveMessage('Profile successfully updated.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {saveMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xl">
                  {currentUser.displayName.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-lg font-extrabold text-slate-900 font-display">
                {currentUser.displayName}
              </h1>
              <span className="text-xs text-slate-500 font-mono block">
                @{currentUser.username}
              </span>
              <p className="text-xs text-slate-600 mt-1 max-w-md">
                {currentUser.bio || 'No bio provided yet.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Posts ({myPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Privacy & Security
          </button>
        </div>
      </div>

      {/* Tab: Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {isLoadingPosts ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading your posts...</div>
          ) : myPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">You have not published any posts yet.</p>
              <p className="text-[11px] text-slate-400">Head to the Home feed to share your first update!</p>
            </div>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-[#00D1B2]">
                    {post.audience === 'followers' ? 'Followers only' : 'Public'}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed text-sm whitespace-pre-line">{post.content}</p>
                <div className="flex items-center gap-4 pt-2 border-t border-slate-50 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#FF7A5C]" />
                    <span className="tabular-nums">{post.likesCount}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Security & Privacy */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Master Recovery Key
                </h3>
                <p className="text-[11px] text-slate-500">
                  Zero-trust account recovery with rotating 16-word mnemonic phrases
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you ever forget your password, your 16-word master key enables private recovery without reliance on third-party emails or unverified channels.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D5AFF]/10 text-[#2D5AFF] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Privacy Settings
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage audience reach and account discoverability
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <span className="font-semibold block">Follower-Approval Mode</span>
                  <span className="text-[11px] text-slate-500">Restrict private posts to approved followers only</span>
                </div>
                <span className="font-semibold text-xs text-slate-600">
                  {currentUser.isPrivate ? 'Enabled' : 'Public'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div>
                  <span className="font-semibold block">Current Session</span>
                  <span className="text-[11px] text-slate-500">Validated via server session token</span>
                </div>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-display">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={160}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs font-medium text-slate-700">Private Profile Mode</span>
                <input
                  type="checkbox"
                  checked={editPrivate}
                  onChange={(e) => setEditPrivate(e.target.checked)}
                  className="h-4 w-4 rounded text-[#2D5AFF] border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#2D5AFF] hover:bg-[#2448cc] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
