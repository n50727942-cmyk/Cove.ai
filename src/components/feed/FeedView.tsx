import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Globe, Users, Send, Share2, MoreHorizontal, AlertCircle, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { SafeUser, Post, Comment } from '../../types';

interface FeedViewProps {
  currentUser: SafeUser;
  onOpenProfile: (username: string) => void;
  onOpenAi: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  onOpenProfile,
  onOpenAi,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'public' | 'followers'>('public');
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [tempMediaInput, setTempMediaInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Community highlights for the top story tray
  const communityHighlights = [
    { username: 'cove', name: 'Cove', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', isOfficial: true },
    { username: 'mayalin', name: 'Maya', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', isOfficial: false },
    { username: 'devinchen', name: 'Devin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isOfficial: false },
  ];

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFeed();
      setPosts(res.posts);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      let finalContent = content.trim();
      if (mediaUrl) {
        finalContent += `\n\n![Image](${mediaUrl})`;
      }

      const res = await api.createPost(finalContent, audience);
      setPosts([res.post, ...posts]);
      setContent('');
      setMediaUrl(null);
      setIsAddingMedia(false);
    } catch (err: any) {
      setError(err.message || 'Failed to publish post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.reactToPost(postId);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            hasLiked: res.hasLiked,
            likesCount: res.likesCount,
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const res = await api.getComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: res.comments }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const res = await api.addComment(postId, newCommentText.trim());
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));
      setPosts(posts.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsCommenting(false);
    }
  };

  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  };

  // Filtered posts based on active feed filter
  const displayedPosts = posts.filter((p) => {
    if (feedFilter === 'following') {
      return p.audience === 'followers' || p.authorId === currentUser.id;
    }
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      {/* Community Story / Highlights Tray */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Community Highlights
        </span>
        <div className="flex items-center gap-4 overflow-x-auto pb-1">
          {/* Current User Add Story Indicator */}
          <button
            type="button"
            onClick={() => onOpenProfile(currentUser.username)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className="relative w-12 h-12 rounded-full p-0.5 border-2 border-dashed border-slate-300 group-hover:border-[#2D5AFF] transition-colors">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                  {currentUser.displayName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-600 truncate max-w-[60px]">
              You
            </span>
          </button>

          {/* Members Highlights */}
          {communityHighlights.map((member) => (
            <button
              key={member.username}
              type="button"
              onClick={() => onOpenProfile(member.username)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#2D5AFF] via-[#00D1B2] to-[#FF7A5C] transition-transform group-hover:scale-105">
                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 truncate max-w-[60px]">
                {member.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Filter & AI Trigger Banner */}
      <div className="flex items-center justify-between gap-3">
        {/* Segmented Control */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setFeedFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              feedFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Updates
          </button>
          <button
            type="button"
            onClick={() => setFeedFilter('following')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              feedFilter === 'following'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Following
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAi}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:border-[#2D5AFF]/40 text-xs font-bold text-[#2D5AFF] shadow-2xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Cove AI</span>
        </button>
      </div>

      {/* Post Composer Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
        <form onSubmit={handleCreatePost}>
          <div className="flex items-start gap-3.5">
            <button
              type="button"
              onClick={() => onOpenProfile(currentUser.username)}
              className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-sm">
                  {currentUser.displayName.charAt(0)}
                </div>
              )}
            </button>

            <div className="flex-1">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                placeholder="What's happening in your corner of the world?"
                className="w-full p-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
              />

              {/* Media URL attachment preview */}
              {mediaUrl && (
                <div className="relative mb-3 rounded-xl overflow-hidden border border-slate-200 max-h-56">
                  <img src={mediaUrl} alt="Post attachment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMediaUrl(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image URL input drawer */}
              {isAddingMedia && !mediaUrl && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-3 flex items-center gap-2">
                  <input
                    type="url"
                    value={tempMediaInput}
                    onChange={(e) => setTempMediaInput(e.target.value)}
                    placeholder="Paste image URL (e.g. https://...)..."
                    className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D5AFF]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempMediaInput.trim()) {
                        setMediaUrl(tempMediaInput.trim());
                        setTempMediaInput('');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2D5AFF] text-white hover:bg-[#2448cc] cursor-pointer"
                  >
                    Attach
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingMedia(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {error && (
                <div className="text-xs text-rose-600 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {/* Audience Selector */}
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setAudience('public')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        audience === 'public'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Globe className="w-3 h-3 text-[#2D5AFF]" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudience('followers')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        audience === 'followers'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3 h-3 text-[#00D1B2]" />
                      <span>Followers</span>
                    </button>
                  </div>

                  {/* Add Media Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddingMedia(!isAddingMedia)}
                    title="Attach image"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {content.length}/2000
                  </span>
                  <button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2D5AFF] hover:bg-[#2448cc] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Feed Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200/80 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3 bg-slate-200 rounded" />
                  <div className="w-16 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-slate-100 rounded-lg mb-3" />
            </div>
          ))}
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-display">
            {feedFilter === 'following' ? 'No updates from followed accounts' : 'Your feed is currently empty'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {feedFilter === 'following'
              ? 'Follow more members from the Explore tab to see their exclusive updates here.'
              : 'Be the first to share an update with the Cove community, or use the explore directory to discover and follow members.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300/80 transition-colors"
            >
              {/* Header: Author info & clean unboxed metadata */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(post.author.username)}
                    className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer shrink-0"
                  >
                    {post.author.avatarUrl ? (
                      <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-sm">
                        {post.author.displayName.charAt(0)}
                      </div>
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(post.author.username)}
                        className="font-bold text-sm text-slate-900 hover:text-[#2D5AFF] transition-colors cursor-pointer"
                      >
                        {post.author.displayName}
                      </button>
                      {/* Zero-Pill Unboxed Metadata */}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-mono">@{post.author.username}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{formatTime(post.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      {post.audience === 'followers' ? (
                        <span className="inline-flex items-center gap-1 text-[#00D1B2]">
                          <Users className="w-3 h-3" /> Followers only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenProfile(post.author.username)}
                  aria-label="Author profile"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line mb-4">
                {post.content.split('![Image](')[0]}
                {post.content.includes('![Image](') && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-h-80">
                    <img
                      src={post.content.split('![Image](')[1].replace(/\)$/, '')}
                      alt="Post visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <button
                  type="button"
                  onClick={() => handleToggleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    post.hasLiked ? 'text-[#FF7A5C] font-semibold' : 'hover:text-[#FF7A5C]'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${post.hasLiked ? 'fill-[#FF7A5C]' : ''}`}
                  />
                  <span className="tabular-nums">{post.likesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleComments(post.id)}
                  className="inline-flex items-center gap-1.5 hover:text-[#2D5AFF] transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="tabular-nums">{post.commentsCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors ml-auto cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Threaded Comments Accordion */}
              {activeCommentsPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D5AFF]"
                    />
                    <button
                      type="button"
                      disabled={!newCommentText.trim() || isCommenting}
                      onClick={() => handleAddComment(post.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2D5AFF] hover:bg-[#2448cc] disabled:opacity-40 cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>

                  {commentsMap[post.id]?.length ? (
                    <div className="space-y-2 mt-2">
                      {commentsMap[post.id].map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => onOpenProfile(c.author.username)}
                              className="font-semibold text-slate-800 hover:text-[#2D5AFF]"
                            >
                              {c.author.displayName}
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono">@{c.author.username}</span>
                            <span className="text-[10px] text-slate-400">· {formatTime(c.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center py-2">No comments yet.</p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
