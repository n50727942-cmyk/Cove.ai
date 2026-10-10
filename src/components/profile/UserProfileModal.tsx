import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Shield, ShieldAlert, UserCheck, UserPlus, Globe, Heart, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { SafeUser, Post } from '../../types';

interface UserProfileModalProps {
  username: string;
  currentUserId: string;
  onClose: () => void;
  onStartChat: (username: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  username,
  currentUserId,
  onClose,
  onStartChat,
}) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);
  const [safetySuccess, setSafetySuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [username]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, feedRes] = await Promise.all([
        api.getUserProfile(username),
        api.getFeed(),
      ]);
      setUser(profileRes.user);
      setIsFollowing(profileRes.isFollowing);
      // Filter posts by this user
      setUserPosts(feedRes.posts.filter((p) => p.author.username === username));
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      const res = await api.toggleFollow(user.username);
      setIsFollowing(res.isFollowing);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSafetyAction = async (actionType: 'block' | 'mute' | 'report') => {
    if (!user) return;
    try {
      await api.recordSafety({
        targetId: user.id,
        actionType,
        reason: `User requested ${actionType} from profile modal.`,
      });
      setSafetySuccess(`Successfully recorded: ${actionType} @${user.username}`);
      setSafetyMenuOpen(false);
      setTimeout(() => setSafetySuccess(null), 3000);
    } catch (err) {
      console.error('Safety action failed:', err);
    }
  };

  const isMe = user?.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 font-display">User Profile</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <span className="w-6 h-6 border-2 border-slate-300 border-t-[#2D5AFF] rounded-full animate-spin" />
              <span className="text-xs">Loading profile...</span>
            </div>
          ) : !user ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              User not found.
            </div>
          ) : (
            <>
              {safetySuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {safetySuccess}
                </div>
              )}

              {/* Header Profile Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xl">
                        {user.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 font-display">
                      {user.displayName}
                    </h2>
                    <span className="text-xs text-slate-400 font-mono block">
                      @{user.username}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {!isMe && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isFollowLoading}
                      onClick={handleToggleFollow}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                        isFollowing
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-[#2D5AFF] text-white hover:bg-[#2448cc]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartChat(user.username);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:text-[#2D5AFF] hover:border-[#2D5AFF] transition-colors cursor-pointer"
                      title="Send Direct Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
                {user.bio || 'This member has not written a bio yet.'}
              </div>

              {/* Safety & Moderation Controls */}
              {!isMe && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Moderation:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSafetyAction('mute')}
                        className="text-[11px] text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        Mute
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => handleSafetyAction('block')}
                        className="text-[11px] text-rose-600 hover:text-rose-800 underline cursor-pointer"
                      >
                        Block
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => handleSafetyAction('report')}
                        className="text-[11px] text-amber-600 hover:text-amber-800 underline cursor-pointer"
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Posts by this user */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 font-display block">
                  Activity ({userPosts.length} posts)
                </span>

                {userPosts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No public posts from this user yet.
                  </p>
                ) : (
                  userPosts.map((post) => (
                    <div key={post.id} className="p-3 bg-white border border-slate-200/80 rounded-xl text-xs space-y-2">
                      <p className="text-slate-800 leading-relaxed">{post.content}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#FF7A5C]" />
                          <span>{post.likesCount}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
