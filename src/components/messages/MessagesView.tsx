import React, { useState, useEffect } from 'react';
import { Send, Sparkles, ShieldAlert, AlertCircle, ArrowLeft, Languages, FileText, Check, X, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { SafeUser, Conversation, Message } from '../../types';

interface MessagesViewProps {
  currentUser: SafeUser;
  onOpenProfile: (username: string) => void;
  targetUsername?: string | null;
  onClearTargetUsername?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  currentUser,
  onOpenProfile,
  targetUsername,
  onClearTargetUsername,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // AI Assist State
  const [aiAssistOpen, setAiAssistOpen] = useState(false);
  const [aiDisclosureAccepted, setAiDisclosureAccepted] = useState(false);
  const [aiAction, setAiAction] = useState<'rewrite' | 'shorten' | 'translate' | 'draft_reply'>('rewrite');
  const [aiTone, setAiTone] = useState('polite and professional');
  const [aiTargetLang, setAiTargetLang] = useState('Spanish');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [targetUsername]);

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      if (targetUsername) {
        // Automatically start or locate conversation with targetUsername
        const convRes = await api.startConversation(targetUsername);
        const listRes = await api.getConversations();
        setConversations(listRes.conversations);

        const found = listRes.conversations.find((c) => c.id === convRes.conversation.id);
        if (found) {
          selectConversation(found);
        } else {
          const newEntry = { ...convRes.conversation, otherParticipant: convRes.targetUser };
          setConversations([newEntry, ...listRes.conversations]);
          selectConversation(newEntry);
        }
        if (onClearTargetUsername) onClearTargetUsername();
      } else {
        const res = await api.getConversations();
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !activeConv) {
          selectConversation(res.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setIsLoadingMsgs(true);
    try {
      const res = await api.getMessages(conv.id);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv || isSending) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage(activeConv.id, messageInput.trim());
      setMessages((prev) => [...prev, res.message]);
      setMessageInput('');
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleRunAiAssist = async () => {
    if (!messageInput.trim() || aiIsLoading) return;

    setAiIsLoading(true);
    setAiSuggestion(null);
    try {
      const res = await api.messageAssist({
        action: aiAction,
        text: messageInput.trim(),
        tone: aiTone,
        targetLanguage: aiTargetLang,
      });
      setAiSuggestion(res.suggestion);
    } catch (err: any) {
      console.error('AI assist failed:', err);
    } finally {
      setAiIsLoading(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (aiSuggestion) {
      setMessageInput(aiSuggestion);
      setAiSuggestion(null);
      setAiAssistOpen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 h-[calc(100vh-80px)] min-h-[550px] flex flex-col">
      {/* Prominent Security Status Header */}
      <div className="mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong className="font-semibold">Security Status:</strong> PROTOTYPE ONLY — NOT END-TO-END ENCRYPTED.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSecurityModalOpen(true)}
          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0 cursor-pointer"
        >
          Learn More
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex">
        {/* Left: Conversation List */}
        <div className="w-full sm:w-80 border-r border-slate-200/80 flex flex-col bg-slate-50/40">
          <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">Conversations</h2>
            <span className="text-[11px] text-slate-400 font-mono">
              {conversations.length} total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConvs ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading inbox...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No conversations yet. Start a chat from the Explore directory!
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    activeConv?.id === conv.id ? 'bg-[#2D5AFF]/5 border-r-2 border-[#2D5AFF]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                    {conv.otherParticipant.avatarUrl ? (
                      <img
                        src={conv.otherParticipant.avatarUrl}
                        alt={conv.otherParticipant.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                        {conv.otherParticipant.displayName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {conv.otherParticipant.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        @{conv.otherParticipant.username}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Message Thread */}
        <div className="hidden sm:flex flex-1 flex-col bg-white">
          {activeConv ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(activeConv.otherParticipant.username)}
                    className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 cursor-pointer"
                  >
                    {activeConv.otherParticipant.avatarUrl ? (
                      <img
                        src={activeConv.otherParticipant.avatarUrl}
                        alt={activeConv.otherParticipant.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                        {activeConv.otherParticipant.displayName.charAt(0)}
                      </div>
                    )}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {activeConv.otherParticipant.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      @{activeConv.otherParticipant.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3">
                {isLoadingMsgs ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400">
                    This is the start of your private conversation with @{activeConv.otherParticipant.username}.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#2D5AFF] text-white rounded-br-xs'
                              : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {m.deliveryStatus}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* AI Assist Drawer (Conditional) */}
              {aiAssistOpen && (
                <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-[#2D5AFF]" />
                      <span>Messaging AI Assistant</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiAssistOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!aiDisclosureAccepted ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Privacy Notice:</strong> The draft text you select will be sent to Google Gemini for processing. This text will leave your local device. Cove will never automatically send this message without your review.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiDisclosureAccepted(true)}
                        className="px-3 py-1.5 bg-[#2D5AFF] text-white text-xs font-semibold rounded-lg hover:bg-[#2448cc] cursor-pointer"
                      >
                        I understand, proceed
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setAiAction('rewrite')}
                          className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                            aiAction === 'rewrite' ? 'bg-[#2D5AFF] text-white' : 'bg-white border border-slate-200'
                          }`}
                        >
                          Rewrite Tone
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiAction('shorten')}
                          className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                            aiAction === 'shorten' ? 'bg-[#2D5AFF] text-white' : 'bg-white border border-slate-200'
                          }`}
                        >
                          Make Concise
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiAction('translate')}
                          className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                            aiAction === 'translate' ? 'bg-[#2D5AFF] text-white' : 'bg-white border border-slate-200'
                          }`}
                        >
                          Translate
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiAction('draft_reply')}
                          className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                            aiAction === 'draft_reply' ? 'bg-[#2D5AFF] text-white' : 'bg-white border border-slate-200'
                          }`}
                        >
                          Draft Reply
                        </button>
                      </div>

                      {aiSuggestion && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-2">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                            Suggested Revision:
                          </span>
                          <p className="leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {aiSuggestion}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleApplyAiSuggestion}
                              className="px-3 py-1 bg-[#2D5AFF] text-white font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Apply to Composer</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiSuggestion(null)}
                              className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                            >
                              Discard
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!messageInput.trim() || aiIsLoading}
                        onClick={handleRunAiAssist}
                        className="px-3.5 py-1.5 bg-[#2D5AFF] text-white text-xs font-semibold rounded-lg hover:bg-[#2448cc] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {aiIsLoading ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing draft...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            <span>Generate Assist Suggestion</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAiAssistOpen(!aiAssistOpen)}
                  title="AI Writing Assistant"
                  className="p-2 rounded-xl text-slate-500 hover:text-[#2D5AFF] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5AFF]"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-white bg-[#2D5AFF] hover:bg-[#2448cc] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-8 text-center">
              Select a conversation from the left to start messaging.
            </div>
          )}
        </div>
      </div>

      {/* Security Transparency Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display mb-2">
              Cryptographic Security Status
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Per Cove trust rules, we never claim end-to-end encryption unless audited cryptographic libraries (e.g., Signal Protocol PQXDH/Double Ratchet) are fully validated.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 mb-4">
              <span className="font-semibold block text-slate-900">Current Phase:</span>
              <p>• Transport Security: TLS/HTTPS encrypted in transit.</p>
              <p>• Cryptographic Status: Prototype only; external security review pending for audited post-quantum ratchets.</p>
            </div>
            <button
              type="button"
              onClick={() => setSecurityModalOpen(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
