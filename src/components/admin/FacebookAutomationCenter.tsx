import React, { useState, useEffect } from 'react';
import {
  Facebook,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  RefreshCw,
  Send,
  Sliders,
  FileText,
  Clock,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Eye,
  Key,
  Calendar,
  Trophy,
  Award,
  Sparkles,
  Users,
  Coins,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  X,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  FacebookConnectionInfo,
  FacebookAutomationConfig,
  FacebookQueueRecord,
  FacebookQueueResponse
} from '../../types.ts';
import {
  fetchFacebookConnection,
  connectFacebookPage,
  disconnectFacebookPage,
  testFacebookConnection,
  fetchFacebookSettings,
  saveFacebookSettings,
  fetchFacebookQueue,
  retryFacebookPost,
  cancelFacebookPost,
  deleteFacebookPost,
  processFacebookQueueNow,
  triggerDailyDigestNow,
  triggerWeeklyShowcaseNow,
  triggerLeaderboardPostNow,
  triggerTestPostNow
} from '../../utils/api.ts';

interface FacebookAutomationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  adminUserId?: string;
}

export const FacebookAutomationCenter: React.FC<FacebookAutomationCenterProps> = ({
  isOpen,
  onClose,
  adminUserId
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'coins' | 'leaderboards' | 'milestones' | 'templates' | 'preview' | 'queue'>('connection');
  
  // Connection State
  const [connection, setConnection] = useState<FacebookConnectionInfo | null>(null);
  const [isLoadingConn, setIsLoadingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{ connected: boolean; message: string } | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  
  // Instant Test Post State
  const [isSendingTestPost, setIsSendingTestPost] = useState(false);
  const [testPostFeedback, setTestPostFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Custom Live Facebook Credentials Form State
  const [customPageId, setCustomPageId] = useState('');
  const [customPageName, setCustomPageName] = useState('');
  const [customAccessToken, setCustomAccessToken] = useState('');
  const [isConnectingCustom, setIsConnectingCustom] = useState(false);
  const [customConnectFeedback, setCustomConnectFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showMetaGuide, setShowMetaGuide] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<FacebookAutomationConfig | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Queue State
  const [queueData, setQueueData] = useState<FacebookQueueResponse | null>(null);
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('');
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueActionMsg, setQueueActionMsg] = useState<string | null>(null);

  // Trigger Action States
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // Preview State
  const [previewType, setPreviewType] = useState<string>('coin_add');

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setIsLoadingConn(true);
    try {
      const [conn, sett, q] = await Promise.all([
        fetchFacebookConnection().catch(() => null),
        fetchFacebookSettings().catch(() => null),
        fetchFacebookQueue({ limit: 50 }).catch(() => null)
      ]);
      if (conn) setConnection(conn);
      if (sett) setSettings(sett);
      if (q) setQueueData(q);
    } catch (err) {
      console.error('Error loading Facebook Automation data:', err);
    } finally {
      setIsLoadingConn(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const res = await testFacebookConnection();
      setConnTestResult(res);
      // Reload connection info
      const updated = await fetchFacebookConnection();
      setConnection(updated);
    } catch (err: any) {
      setConnTestResult({ connected: false, message: err.message });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSendInstantTestPost = async () => {
    setIsSendingTestPost(true);
    setTestPostFeedback(null);
    try {
      const res = await triggerTestPostNow();
      setTestPostFeedback({
        success: res.success,
        message: res.message || 'Instant test post published successfully to Facebook!'
      });
      // Refresh connection and queue
      const [updatedConn, updatedQueue] = await Promise.all([
        fetchFacebookConnection().catch(() => null),
        fetchFacebookQueue({ limit: 50 }).catch(() => null)
      ]);
      if (updatedConn) setConnection(updatedConn);
      if (updatedQueue) setQueueData(updatedQueue);
    } catch (err: any) {
      setTestPostFeedback({
        success: false,
        message: err.message || 'Error publishing test post'
      });
    } finally {
      setIsSendingTestPost(false);
    }
  };

  const handleReconnectDefaults = async () => {
    try {
      await connectFacebookPage({});
      const updated = await fetchFacebookConnection();
      setConnection(updated);
      setConnTestResult({
        connected: true,
        message: 'Facebook Official Community Page connected and publishing automatically.'
      });
    } catch (err: any) {
      alert('Error reconnecting: ' + err.message);
    }
  };

  const handleConnectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPageId.trim() || !customAccessToken.trim()) {
      setCustomConnectFeedback({
        success: false,
        message: 'Please provide both Facebook Page ID and Page Access Token.'
      });
      return;
    }

    setIsConnectingCustom(true);
    setCustomConnectFeedback(null);
    try {
      const res = await connectFacebookPage({
        page_id: customPageId.trim(),
        page_name: customPageName.trim() || undefined,
        access_token: customAccessToken.trim()
      });
      setCustomConnectFeedback({
        success: true,
        message: res.message || 'Successfully connected live Facebook Page!'
      });
      const updated = await fetchFacebookConnection();
      setConnection(updated);
      setCustomAccessToken('');
      setConnTestResult({
        connected: true,
        message: res.message || 'Meta Graph API connection verified successfully!'
      });
    } catch (err: any) {
      setCustomConnectFeedback({
        success: false,
        message: err.message || 'Failed to connect via Meta Graph API. Please verify token permissions.'
      });
    } finally {
      setIsConnectingCustom(false);
    }
  };

  const handleResetToSandbox = async () => {
    setIsConnectingCustom(true);
    setCustomConnectFeedback(null);
    try {
      await connectFacebookPage({
        page_id: 'pocketalbum_community_page',
        page_name: 'PocketAlbum Official Community Page',
        access_token: 'preconfigured_system_token'
      });
      const updated = await fetchFacebookConnection();
      setConnection(updated);
      setCustomConnectFeedback({
        success: true,
        message: 'Reverted to PocketAlbum Instant Simulation / Sandbox Mode.'
      });
      setConnTestResult({
        connected: true,
        message: 'PocketAlbum Community Integration is active in simulated development mode.'
      });
    } catch (err: any) {
      setCustomConnectFeedback({
        success: false,
        message: err.message || 'Failed to reset connection.'
      });
    } finally {
      setIsConnectingCustom(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect the Facebook Page? Active post events will be paused.')) {
      return;
    }
    try {
      await disconnectFacebookPage();
      const updated = await fetchFacebookConnection();
      setConnection(updated);
      setConnTestResult(null);
    } catch (err: any) {
      alert('Error disconnecting: ' + err.message);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);
    try {
      const saved = await saveFacebookSettings(settings);
      setSettings(saved);
      setSettingsSuccess('Automation settings and templates saved successfully!');
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleFilterQueue = async (status: string) => {
    setQueueStatusFilter(status);
    setIsLoadingQueue(true);
    try {
      const res = await fetchFacebookQueue({ status: status || undefined, limit: 50 });
      setQueueData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const handleProcessQueueNow = async () => {
    setIsProcessingQueue(true);
    setQueueActionMsg(null);
    try {
      const res = await processFacebookQueueNow();
      setQueueActionMsg(`Queue processed: ${res.published} published, ${res.failed} failed out of ${res.processed} pending.`);
      const q = await fetchFacebookQueue({ status: queueStatusFilter || undefined, limit: 50 });
      setQueueData(q);
      const conn = await fetchFacebookConnection();
      setConnection(conn);
    } catch (err: any) {
      setQueueActionMsg(`Error processing queue: ${err.message}`);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryFacebookPost(id);
      const q = await fetchFacebookQueue({ status: queueStatusFilter || undefined, limit: 50 });
      setQueueData(q);
    } catch (err: any) {
      alert('Retry error: ' + err.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelFacebookPost(id);
      const q = await fetchFacebookQueue({ status: queueStatusFilter || undefined, limit: 50 });
      setQueueData(q);
    } catch (err: any) {
      alert('Cancel error: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item from history?')) return;
    try {
      await deleteFacebookPost(id);
      const q = await fetchFacebookQueue({ status: queueStatusFilter || undefined, limit: 50 });
      setQueueData(q);
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleTriggerDailyDigest = async () => {
    setIsTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await triggerDailyDigestNow();
      setTriggerMsg(res.message);
      const q = await fetchFacebookQueue({ limit: 50 });
      setQueueData(q);
    } catch (err: any) {
      setTriggerMsg(`Error: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleTriggerWeeklyShowcase = async () => {
    setIsTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await triggerWeeklyShowcaseNow();
      setTriggerMsg(res.message);
      const q = await fetchFacebookQueue({ limit: 50 });
      setQueueData(q);
    } catch (err: any) {
      setTriggerMsg(`Error: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleTriggerLeaderboard = async (type: 'weekly' | 'monthly' | 'overall') => {
    setIsTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await triggerLeaderboardPostNow(type);
      setTriggerMsg(res.message);
      const q = await fetchFacebookQueue({ limit: 50 });
      setQueueData(q);
    } catch (err: any) {
      setTriggerMsg(`Error: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  if (!isOpen) return null;

  // Format sample for Preview
  const getRenderedPreview = () => {
    if (!settings) return '';
    const t = settings.templates;
    switch (previewType) {
      case 'coin_add':
        return (t.coin_add || '')
          .replace('{username}', 'CollectorDan')
          .replace('{coin}', '1909-S VDB Lincoln Cent')
          .replace('{grade}', 'PCGS MS65 Red')
          .replace('{variety}', 'V.D.B. Key Date')
          .replace('{album}', 'Lincoln Cents')
          .replace('{link}', 'https://pocketalbum.com/user/user_dan');
      case 'daily_digest':
        return (t.daily_digest || '')
          .replace('{coin_list}', '• 1909-S VDB Lincoln Cent — MS65 (@CollectorDan)\n• 1943-D Steel Cent — MS64 (@GoldRush)\n• 1889-CC Morgan Dollar — MS63 (@DevinJenkins)\n• 1916-D Buffalo Nickel — MS65 (@SilverStacker)')
          .replace('{link}', 'https://pocketalbum.com');
      case 'weekly_showcase':
        return (t.weekly_showcase || '')
          .replace('{coin_list}', '• 1921 Peace Dollar High Relief (PCGS MS64) • Added by @DevinJenkins\n• 1794 Flowing Hair Half Dime (NGC VF35) • Added by @ColonialDan\n• 1937-D 3-Legged Buffalo Nickel (PCGS AU58) • Added by @CoinMaster')
          .replace('{link}', 'https://pocketalbum.com');
      case 'leaderboard_weekly':
        return (t.leaderboard_weekly || '')
          .replace('{top3}', '🥇 1st — @DevinJenkins (142 votes, 88 coins)\n🥈 2nd — @ColonialDan (98 votes, 64 coins)\n🥉 3rd — @GoldRush (76 votes, 52 coins)')
          .replace('{link}', 'https://pocketalbum.com/leaderboards');
      case 'leaderboard_monthly':
        return (t.leaderboard_monthly || '')
          .replace('{top3}', '🥇 1st — @DevinJenkins (520 votes, 110 coins)\n🥈 2nd — @GoldRush (340 votes, 85 coins)\n🥉 3rd — @ColonialDan (290 votes, 72 coins)')
          .replace('{link}', 'https://pocketalbum.com/leaderboards');
      case 'leaderboard_overall':
        return (t.leaderboard_overall || '')
          .replace('{top3}', '🥇 1st — @DevinJenkins (1,240 votes, 140 coins)\n🥈 2nd — @ColonialDan (980 votes, 115 coins)\n🥉 3rd — @GoldRush (890 votes, 95 coins)')
          .replace('{link}', 'https://pocketalbum.com/leaderboards');
      case 'new_collector':
        return (t.new_collector || '')
          .replace('{username}', 'NumismaticNovice')
          .replace('{link}', 'https://pocketalbum.com/user/user_new');
      case 'milestone':
        return (t.milestone || '')
          .replace('{username}', 'DevinJenkins')
          .replace('{album}', 'Morgan Silver Dollars')
          .replace('{milestone}', '75')
          .replace('{link}', 'https://pocketalbum.com/user/user_devin');
      case 'album_100':
        return (t.album_100 || '')
          .replace('{username}', 'DevinJenkins')
          .replace('{album}', 'Peace Dollars Complete')
          .replace('{link}', 'https://pocketalbum.com/user/user_devin');
      case 'achievement':
        return (t.achievement || '')
          .replace('{username}', 'ColonialDan')
          .replace('{achievement_name}', 'Reached 100 Collector Endorsement Votes')
          .replace('{link}', 'https://pocketalbum.com/user/user_dan');
      default:
        return '';
    }
  };

  return (
    <div
      id="facebook-automation-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="facebook-automation-modal"
        className="bg-[#1a130e] border border-[#7a5c28] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 bg-[#231a14] border-b border-[#5a4420]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/50 text-[#1877F2]">
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfb86c] px-2 py-0.5 rounded-md bg-[#2d1f12] border border-[#5a4420]">
                  Admin Console
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  connection?.status === 'connected'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-600'
                }`}>
                  {connection?.status === 'connected' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {connection?.status === 'connected' ? 'Page Connected' : 'Not Connected'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#f7eedd]">
                PocketAlbum Facebook Automation System
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#2e2119] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 pb-2 bg-[#1e1610] border-b border-[#5a4420]/50 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'connection'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <Facebook className="w-3.5 h-3.5" />
            Page Connection
          </button>
          <button
            onClick={() => setActiveTab('coins')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'coins'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Coin Posts
          </button>
          <button
            onClick={() => setActiveTab('leaderboards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'leaderboards'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboards
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'milestones'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Welcomes & Milestones
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Post Templates
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] shadow'
                : 'text-[#a89c8d] hover:text-[#f7eedd] hover:bg-[#281c14]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Publishing Queue ({queueData?.counts.total || 0})
          </button>
        </div>

        {/* Action feedback banners */}
        {triggerMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-[#241a13] border border-[#dfb86c]/60 rounded-xl text-xs text-[#dfb86c] flex items-center justify-between">
            <span>{triggerMsg}</span>
            <button onClick={() => setTriggerMsg(null)} className="text-xs text-[#a89c8d] hover:text-white">✕</button>
          </div>
        )}

        {/* Scrollable Main Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: FACEBOOK CONNECTION */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              {/* Status Overview Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#241a13] to-[#17100b] border border-[#7a5c28]/60 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                      Official Facebook Page Connection
                    </h3>
                    <p className="text-xs text-[#a89c8d]">
                      Posts generated by PocketAlbum are submitted directly to this Facebook Page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTestingConn}
                      className="px-3 py-1.5 text-xs font-bold bg-[#1e1510] hover:bg-[#2e2017] border border-[#7a5c28] text-[#dfd4bf] rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-[#dfb86c]' : ''}`} />
                      {isTestingConn ? 'Testing...' : 'Test Connection'}
                    </button>
                    {connection?.status === 'connected' ? (
                      <button
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 text-xs font-bold bg-red-950/40 hover:bg-red-900/60 border border-red-700/60 text-red-300 rounded-xl transition-colors cursor-pointer"
                      >
                        Pause Automation
                      </button>
                    ) : (
                      <button
                        onClick={handleReconnectDefaults}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700 text-emerald-300 rounded-xl transition-colors cursor-pointer"
                      >
                        Enable Automation
                      </button>
                    )}
                  </div>
                </div>

                {/* Connection details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl">
                    <span className="text-[10px] text-[#a89c8d] uppercase tracking-wider block">Status</span>
                    <span className={`text-xs font-bold flex items-center gap-1.5 mt-1 ${
                      connection?.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {connection?.status === 'connected' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {connection?.status === 'connected' ? 'AUTOMATED & ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl">
                    <span className="text-[10px] text-[#a89c8d] uppercase tracking-wider block">Connected Page</span>
                    <span className="text-xs font-bold text-[#f7eedd] truncate block mt-1">
                      {connection?.page_name || 'PocketAlbum Official Community Page'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl">
                    <span className="text-[10px] text-[#a89c8d] uppercase tracking-wider block">Publishing Mode</span>
                    <span className="text-xs font-bold text-[#dfb86c] truncate block mt-1">
                      Instant Real-Time
                    </span>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl">
                    <span className="text-[10px] text-[#a89c8d] uppercase tracking-wider block">Queue Status</span>
                    <span className="text-xs font-mono text-emerald-400 truncate block mt-1">
                      {queueData?.counts.published || 0} Published / Ready
                    </span>
                  </div>
                </div>

                {/* Last successful / failed post notes */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#a89c8d] pt-1 border-t border-[#5a4420]/30">
                  <div>
                    <span className="text-[#dfd4bf] font-semibold">Last Successful Post: </span>
                    {connection?.last_successful_post ? new Date(connection.last_successful_post).toLocaleString() : 'Ready to post'}
                  </div>
                  <div>
                    <span className="text-[#dfd4bf] font-semibold">Last Failed Post: </span>
                    {connection?.last_failed_post ? new Date(connection.last_failed_post).toLocaleString() : 'None recorded'}
                  </div>
                </div>

                {/* Connection test result notice */}
                {connTestResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    connTestResult.connected
                      ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                      : 'bg-red-950/60 border border-red-800 text-red-200'
                  }`}>
                    {connTestResult.connected ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    <div>
                      <strong className="block">{connTestResult.connected ? 'Connection Healthy' : 'Connection Notice'}</strong>
                      <span>{connTestResult.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Zero-Setup Automated Publishing Station */}
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#dfb86c]" /> Automated Publishing Hub
                    </h3>
                    <p className="text-xs text-[#a89c8d]">
                      PocketAlbum is pre-configured to automatically publish new coins, collection milestones, and leaderboards to Facebook in real time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendInstantTestPost}
                      disabled={isSendingTestPost}
                      className="px-3.5 py-2 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] rounded-xl flex items-center gap-1.5 shadow transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSendingTestPost ? 'animate-spin' : ''}`} />
                      {isSendingTestPost ? 'Publishing Test...' : 'Send Test Post to Facebook'}
                    </button>
                  </div>
                </div>

                {testPostFeedback && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testPostFeedback.success
                      ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                      : 'bg-red-950/60 border border-red-800 text-red-200'
                  }`}>
                    {testPostFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    <span>{testPostFeedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#f7eedd]">
                      <Zap className="w-3.5 h-3.5 text-[#dfb86c]" /> Instant Publishing
                    </div>
                    <p className="text-[11px] text-[#a89c8d]">
                      Posts publish immediately upon coin addition with no access time schedule or delays.
                    </p>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#f7eedd]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> User Privacy Protected
                    </div>
                    <p className="text-[11px] text-[#a89c8d]">
                      Member preferences (Auto, Ask, Never) and private coin settings are strictly honored.
                    </p>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/40 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#f7eedd]">
                      <Check className="w-3.5 h-3.5 text-blue-400" /> Non-blocking Queue
                    </div>
                    <p className="text-[11px] text-[#a89c8d]">
                      Saving albums or adding coins is never slowed down or blocked by external network status.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Meta Graph API Credentials Configuration */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#1d1610] to-[#140e0a] border border-[#7a5c28]/70 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#dfb86c]" /> Connect Your Live Facebook Page
                    </h3>
                    <p className="text-xs text-[#a89c8d]">
                      Connect PocketAlbum to an active Facebook Page using Meta's Graph API credentials.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMetaGuide(!showMetaGuide)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#261b13] hover:bg-[#342419] border border-[#5a4420] text-[#dfb86c] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {showMetaGuide ? 'Hide Setup Guide' : 'Meta Setup Guide'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(!showCustomForm)}
                      className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer font-black"
                    >
                      {showCustomForm ? 'Close Form' : 'Configure Credentials'}
                    </button>
                  </div>
                </div>

                {/* Custom Connection Feedback */}
                {customConnectFeedback && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    customConnectFeedback.success
                      ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                      : 'bg-red-950/60 border border-red-800 text-red-200'
                  }`}>
                    {customConnectFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    <span>{customConnectFeedback.message}</span>
                  </div>
                )}

                {/* Step-by-Step Meta Developer Guide */}
                {showMetaGuide && (
                  <div className="p-4 bg-[#18110b] border border-[#dfb86c]/40 rounded-xl space-y-3 text-xs text-[#dfd4bf]">
                    <div className="flex items-center gap-2 font-serif font-bold text-[#f7eedd] text-sm border-b border-[#5a4420]/50 pb-2">
                      <Facebook className="w-4 h-4 text-[#1877F2]" />
                      How to Integrate a Live Facebook Page with PocketAlbum
                    </div>
                    <ol className="list-decimal pl-5 space-y-2.5 text-[#a89c8d]">
                      <li>
                        <strong className="text-[#f7eedd]">Create a Meta Developer Account & App:</strong>
                        <p className="mt-0.5">Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#dfb86c] underline hover:text-[#fae19c]">developers.facebook.com</a>, log in, click <span className="text-[#f7eedd] font-semibold">My Apps &gt; Create App</span>, and choose <span className="text-[#f7eedd] font-semibold">Business</span>.</p>
                      </li>
                      <li>
                        <strong className="text-[#f7eedd]">Add Facebook Login for Business &amp; Pages API:</strong>
                        <p className="mt-0.5">In the App Dashboard, add <span className="text-[#f7eedd] font-semibold">Facebook Login for Business</span> or the <span className="text-[#f7eedd] font-semibold">Pages</span> product.</p>
                      </li>
                      <li>
                        <strong className="text-[#f7eedd]">Obtain Required Graph API Permissions:</strong>
                        <p className="mt-0.5">Your Meta access token requires three permissions:</p>
                        <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-[#2a1d13] border border-[#5a4420] text-[#dfb86c]">pages_show_list</span>
                          <span className="px-2 py-0.5 rounded bg-[#2a1d13] border border-[#5a4420] text-[#dfb86c]">pages_read_engagement</span>
                          <span className="px-2 py-0.5 rounded bg-[#2a1d13] border border-[#5a4420] text-[#dfb86c]">pages_manage_posts</span>
                        </div>
                      </li>
                      <li>
                        <strong className="text-[#f7eedd]">Generate a Long-Lived Page Access Token:</strong>
                        <p className="mt-0.5">Open the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-[#dfb86c] underline hover:text-[#fae19c]">Meta Graph API Explorer</a>. Select your App and Page, generate a Page Token, and exchange it via the Access Token Tool for a permanent (never-expiring) Page Access Token.</p>
                      </li>
                      <li>
                        <strong className="text-[#f7eedd]">Locate your Facebook Page ID:</strong>
                        <p className="mt-0.5">On Facebook, visit your Page &gt; Settings &gt; Page Info/Transparency to copy the numerical Page ID (or get it from Graph API <code className="text-[#dfb86c]">GET /me/accounts</code>).</p>
                      </li>
                      <li>
                        <strong className="text-[#f7eedd]">Enter Credentials or set Environment Variables:</strong>
                        <p className="mt-0.5">Paste the credentials into the form below, or set <code className="text-[#dfb86c]">FACEBOOK_PAGE_ID</code> and <code className="text-[#dfb86c]">FACEBOOK_PAGE_ACCESS_TOKEN</code> in your deployment environment variables.</p>
                      </li>
                    </ol>
                  </div>
                )}

                {/* Custom Credentials Input Form */}
                {showCustomForm && (
                  <form onSubmit={handleConnectCustom} className="p-4 bg-[#17100b] border border-[#5a4420] rounded-xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#dfd4bf] mb-1">
                          Facebook Page ID <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={customPageId}
                          onChange={e => setCustomPageId(e.target.value)}
                          placeholder="e.g. 102938475619283"
                          className="w-full px-3 py-2 bg-[#0e0906] border border-[#5a4420] rounded-xl text-xs text-[#f7eedd] placeholder-[#6e5844] focus:outline-none focus:border-[#dfb86c]"
                          required
                        />
                        <span className="text-[10px] text-[#a89c8d] mt-1 block">
                          The numeric Page ID of your official Facebook Page
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#dfd4bf] mb-1">
                          Page Display Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={customPageName}
                          onChange={e => setCustomPageName(e.target.value)}
                          placeholder="e.g. PocketAlbum Official Community"
                          className="w-full px-3 py-2 bg-[#0e0906] border border-[#5a4420] rounded-xl text-xs text-[#f7eedd] placeholder-[#6e5844] focus:outline-none focus:border-[#dfb86c]"
                        />
                        <span className="text-[10px] text-[#a89c8d] mt-1 block">
                          Friendly name to display in the PocketAlbum admin console
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#dfd4bf] mb-1">
                        Meta Page Access Token <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="password"
                        value={customAccessToken}
                        onChange={e => setCustomAccessToken(e.target.value)}
                        placeholder="EAAB... (Long-lived Page Access Token with pages_manage_posts)"
                        className="w-full px-3 py-2 bg-[#0e0906] border border-[#5a4420] rounded-xl text-xs text-[#f7eedd] placeholder-[#6e5844] font-mono focus:outline-none focus:border-[#dfb86c]"
                        required
                      />
                      <span className="text-[10px] text-[#a89c8d] mt-1 block">
                        Requires <code className="text-[#dfb86c]">pages_manage_posts</code> and <code className="text-[#dfb86c]">pages_read_engagement</code> permissions
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#5a4420]/40">
                      <button
                        type="button"
                        onClick={handleResetToSandbox}
                        disabled={isConnectingCustom}
                        className="px-3 py-1.5 text-xs text-[#a89c8d] hover:text-[#dfb86c] hover:bg-[#20150e] rounded-xl border border-[#5a4420]/50 transition-colors cursor-pointer"
                      >
                        Reset to Simulated Sandbox Mode
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomForm(false)}
                          className="px-3 py-1.5 text-xs font-bold text-[#a89c8d] hover:text-[#f7eedd] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isConnectingCustom}
                          className="px-4 py-2 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] hover:from-[#fae19c] hover:to-[#dfb86c] text-[#140e08] rounded-xl flex items-center gap-1.5 shadow transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isConnectingCustom ? 'animate-spin' : ''}`} />
                          {isConnectingCustom ? 'Verifying with Meta...' : 'Verify & Connect Facebook Page'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COIN POSTS & FREQUENCY */}
          {activeTab === 'coins' && settings && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                      Coin Addition Facebook Automation
                    </h3>
                    <p className="text-xs text-[#a89c8d]">
                      Control how new coins added by collectors are shared on the Facebook Page.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.coin_posts_enabled)}
                      onChange={e => setSettings({ ...settings, coin_posts_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#dfd4bf]">
                      {settings.coin_posts_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Publishing Frequency Options */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-serif font-bold text-[#dfd4bf]">
                    Publishing Frequency:
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Immediate */}
                    <div
                      onClick={() => setSettings({ ...settings, coin_post_frequency: 'immediate' })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        settings.coin_post_frequency === 'immediate'
                          ? 'bg-[#291d14] border-[#dfb86c] shadow'
                          : 'bg-[#140e0a] border-[#5a4420]/50 hover:border-[#7a5c28]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="coin_frequency"
                          checked={settings.coin_post_frequency === 'immediate'}
                          onChange={() => setSettings({ ...settings, coin_post_frequency: 'immediate' })}
                          className="accent-[#dfb86c]"
                        />
                        <span className="text-xs font-bold text-[#f7eedd]">IMMEDIATE</span>
                      </div>
                      <p className="text-[11px] text-[#a89c8d] mt-1.5">
                        Publish eligible coins as they are added to PocketAlbum.
                      </p>
                    </div>

                    {/* Daily Digest */}
                    <div
                      onClick={() => setSettings({ ...settings, coin_post_frequency: 'daily_digest' })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        settings.coin_post_frequency === 'daily_digest'
                          ? 'bg-[#291d14] border-[#dfb86c] shadow'
                          : 'bg-[#140e0a] border-[#5a4420]/50 hover:border-[#7a5c28]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="coin_frequency"
                          checked={settings.coin_post_frequency === 'daily_digest'}
                          onChange={() => setSettings({ ...settings, coin_post_frequency: 'daily_digest' })}
                          className="accent-[#dfb86c]"
                        />
                        <span className="text-xs font-bold text-[#f7eedd]">DAILY DIGEST</span>
                      </div>
                      <p className="text-[11px] text-[#a89c8d] mt-1.5">
                        Collect eligible coins during the day and publish one summary post.
                      </p>
                    </div>

                    {/* Weekly Showcase */}
                    <div
                      onClick={() => setSettings({ ...settings, coin_post_frequency: 'weekly_showcase' })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        settings.coin_post_frequency === 'weekly_showcase'
                          ? 'bg-[#291d14] border-[#dfb86c] shadow'
                          : 'bg-[#140e0a] border-[#5a4420]/50 hover:border-[#7a5c28]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="coin_frequency"
                          checked={settings.coin_post_frequency === 'weekly_showcase'}
                          onChange={() => setSettings({ ...settings, coin_post_frequency: 'weekly_showcase' })}
                          className="accent-[#dfb86c]"
                        />
                        <span className="text-xs font-bold text-[#f7eedd]">WEEKLY SHOWCASE</span>
                      </div>
                      <p className="text-[11px] text-[#a89c8d] mt-1.5">
                        Collect weekly additions into a premier weekend numismatic showcase post.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual On-Demand Generation Buttons */}
                <div className="pt-3 border-t border-[#5a4420]/40 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTriggerDailyDigest}
                    disabled={isTriggering}
                    className="px-3.5 py-2 text-xs font-bold bg-[#140e0a] hover:bg-[#251b14] border border-[#7a5c28] text-[#dfd4bf] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#dfb86c]" />
                    Run Daily Digest Post Now
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerWeeklyShowcase}
                    disabled={isTriggering}
                    className="px-3.5 py-2 text-xs font-bold bg-[#140e0a] hover:bg-[#251b14] border border-[#7a5c28] text-[#dfd4bf] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#dfb86c]" />
                    Run Weekly Showcase Post Now
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] rounded-xl shadow transition-all cursor-pointer"
                >
                  {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARDS */}
          {activeTab === 'leaderboards' && settings && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                    Leaderboard Facebook Automation
                  </h3>
                  <p className="text-xs text-[#a89c8d]">
                    Automatically recognize top collectors with official rankings and medal ceremonies.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#f7eedd]">Weekly Leaderboard</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.leaderboard_weekly_enabled)}
                        onChange={e => setSettings({ ...settings, leaderboard_weekly_enabled: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 accent-[#dfb86c]"
                      />
                    </div>
                    <p className="text-[11px] text-[#a89c8d]">
                      Celebrates top 3 weekly collector vote leaders.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTriggerLeaderboard('weekly')}
                      disabled={isTriggering}
                      className="w-full mt-2 px-2 py-1.5 text-[11px] font-bold bg-[#1e1510] hover:bg-[#2e2017] border border-[#7a5c28]/60 text-[#dfb86c] rounded-lg cursor-pointer"
                    >
                      Post Weekly Now
                    </button>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#f7eedd]">Monthly Leaderboard</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.leaderboard_monthly_enabled)}
                        onChange={e => setSettings({ ...settings, leaderboard_monthly_enabled: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 accent-[#dfb86c]"
                      />
                    </div>
                    <p className="text-[11px] text-[#a89c8d]">
                      Monthly numismatic salute to premier collectors.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTriggerLeaderboard('monthly')}
                      disabled={isTriggering}
                      className="w-full mt-2 px-2 py-1.5 text-[11px] font-bold bg-[#1e1510] hover:bg-[#2e2017] border border-[#7a5c28]/60 text-[#dfb86c] rounded-lg cursor-pointer"
                    >
                      Post Monthly Now
                    </button>
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#f7eedd]">Overall All-Time</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.leaderboard_overall_enabled)}
                        onChange={e => setSettings({ ...settings, leaderboard_overall_enabled: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 accent-[#dfb86c]"
                      />
                    </div>
                    <p className="text-[11px] text-[#a89c8d]">
                      Showcases all-time highest ranking collectors.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTriggerLeaderboard('overall')}
                      disabled={isTriggering}
                      className="w-full mt-2 px-2 py-1.5 text-[11px] font-bold bg-[#1e1510] hover:bg-[#2e2017] border border-[#7a5c28]/60 text-[#dfb86c] rounded-lg cursor-pointer"
                    >
                      Post All-Time Now
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] rounded-xl shadow transition-all cursor-pointer"
                >
                  {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: WELCOMES & MILESTONES */}
          {activeTab === 'milestones' && settings && (
            <div className="space-y-6">
              {/* New Collectors */}
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#dfb86c]" />
                    <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                      New Collector Welcome Posts
                    </h3>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.new_collectors_welcome_enabled)}
                      onChange={e => setSettings({ ...settings, new_collectors_welcome_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#dfd4bf]">
                      {settings.new_collectors_welcome_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-[#a89c8d]">
                  Welcomes new collectors joining PocketAlbum to the community on Facebook.
                </p>
              </div>

              {/* Album Completion Milestones */}
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#dfb86c]" /> Collection Completion Milestones
                  </h3>
                  <p className="text-xs text-[#a89c8d]">
                    Trigger milestone celebration posts when a collector reaches set thresholds in any coin album.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#f7eedd] block">25% Complete</span>
                      <span className="text-[10px] text-[#a89c8d]">Quarter Mark</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.milestone_25_enabled)}
                      onChange={e => setSettings({ ...settings, milestone_25_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#f7eedd] block">50% Complete</span>
                      <span className="text-[10px] text-[#a89c8d]">Halfway Mark</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.milestone_50_enabled)}
                      onChange={e => setSettings({ ...settings, milestone_50_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#f7eedd] block">75% Complete</span>
                      <span className="text-[10px] text-[#a89c8d]">Three Quarters</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.milestone_75_enabled)}
                      onChange={e => setSettings({ ...settings, milestone_75_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </div>

                  <div className="p-3 bg-[#140e0a] border border-[#dfb86c]/60 rounded-xl flex items-center justify-between shadow-sm shadow-[#dfb86c]/10">
                    <div>
                      <span className="text-xs font-black text-[#dfb86c] block">100% Complete</span>
                      <span className="text-[10px] text-[#a89c8d]">Gold Mastered</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.milestone_100_enabled)}
                      onChange={e => setSettings({ ...settings, milestone_100_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </div>
                </div>
              </div>

              {/* Collector Achievements */}
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                    Collector Achievements & Rankings
                  </h3>
                  <p className="text-xs text-[#a89c8d]">
                    Post special accolades when collectors achieve notable ranking shifts or vote totals.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-[#dfd4bf]">Rank Changes</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.achievement_rank_enabled)}
                      onChange={e => setSettings({ ...settings, achievement_rank_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </label>

                  <label className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-[#dfd4bf]">Vote Milestones</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.achievement_vote_enabled)}
                      onChange={e => setSettings({ ...settings, achievement_vote_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </label>

                  <label className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-[#dfd4bf]">Top 10 Reach</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.achievement_top10_enabled)}
                      onChange={e => setSettings({ ...settings, achievement_top10_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </label>

                  <label className="p-3 bg-[#140e0a] border border-[#5a4420]/50 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-[#dfd4bf]">#1 Spot Takeover</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.achievement_num1_enabled)}
                      onChange={e => setSettings({ ...settings, achievement_num1_enabled: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 accent-[#dfb86c]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] rounded-xl shadow transition-all cursor-pointer"
                >
                  {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: TEMPLATES */}
          {activeTab === 'templates' && settings && (
            <div className="space-y-6">
              <div className="p-4 sm:p-5 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#dfb86c]" /> Customizable Post Templates
                  </h3>
                  <p className="text-xs text-[#a89c8d]">
                    Customize the wording and emojis for each post type. Supported placeholders: <code>{'{username}'}</code>, <code>{'{coin}'}</code>, <code>{'{grade}'}</code>, <code>{'{variety}'}</code>, <code>{'{album}'}</code>, <code>{'{link}'}</code>, <code>{'{coin_list}'}</code>, <code>{'{top3}'}</code>, <code>{'{milestone}'}</code>.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Coin Add Template */}
                  <div>
                    <label className="block text-xs font-serif font-bold text-[#dfb86c] mb-1">
                      Individual Coin Addition Post Template
                    </label>
                    <textarea
                      value={settings.templates.coin_add || ''}
                      onChange={e => setSettings({
                        ...settings,
                        templates: { ...settings.templates, coin_add: e.target.value }
                      })}
                      rows={5}
                      className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/60 rounded-xl text-xs text-[#f7eedd] font-mono focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>

                  {/* Daily Digest Template */}
                  <div>
                    <label className="block text-xs font-serif font-bold text-[#dfb86c] mb-1">
                      Daily Digest Post Template
                    </label>
                    <textarea
                      value={settings.templates.daily_digest || ''}
                      onChange={e => setSettings({
                        ...settings,
                        templates: { ...settings.templates, daily_digest: e.target.value }
                      })}
                      rows={5}
                      className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/60 rounded-xl text-xs text-[#f7eedd] font-mono focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>

                  {/* Weekly Showcase Template */}
                  <div>
                    <label className="block text-xs font-serif font-bold text-[#dfb86c] mb-1">
                      Weekly Showcase Post Template
                    </label>
                    <textarea
                      value={settings.templates.weekly_showcase || ''}
                      onChange={e => setSettings({
                        ...settings,
                        templates: { ...settings.templates, weekly_showcase: e.target.value }
                      })}
                      rows={5}
                      className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/60 rounded-xl text-xs text-[#f7eedd] font-mono focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>

                  {/* Weekly Leaderboard Template */}
                  <div>
                    <label className="block text-xs font-serif font-bold text-[#dfb86c] mb-1">
                      Weekly Leaderboard Post Template
                    </label>
                    <textarea
                      value={settings.templates.leaderboard_weekly || ''}
                      onChange={e => setSettings({
                        ...settings,
                        templates: { ...settings.templates, leaderboard_weekly: e.target.value }
                      })}
                      rows={5}
                      className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/60 rounded-xl text-xs text-[#f7eedd] font-mono focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>

                  {/* 100% Album Completed Template */}
                  <div>
                    <label className="block text-xs font-serif font-bold text-[#dfb86c] mb-1">
                      100% Completed Album Mastered Template
                    </label>
                    <textarea
                      value={settings.templates.album_100 || ''}
                      onChange={e => setSettings({
                        ...settings,
                        templates: { ...settings.templates, album_100: e.target.value }
                      })}
                      rows={5}
                      className="w-full px-3 py-2 bg-[#140e0a] border border-[#7a5c28]/60 rounded-xl text-xs text-[#f7eedd] font-mono focus:outline-none focus:border-[#dfb86c]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] rounded-xl shadow transition-all cursor-pointer"
                >
                  {isSavingSettings ? 'Saving Settings...' : 'Save Templates'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#f7eedd]">
                      Interactive Facebook Post Preview Simulator
                    </h3>
                    <p className="text-xs text-[#a89c8d]">
                      Select an event type to inspect the exact post formatting before it goes live to Facebook.
                    </p>
                  </div>
                  <select
                    value={previewType}
                    onChange={e => setPreviewType(e.target.value)}
                    className="px-3 py-2 bg-[#140e0a] border border-[#7a5c28] text-xs font-bold text-[#f7eedd] rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="coin_add">New Coin Addition</option>
                    <option value="daily_digest">Daily Collection Digest</option>
                    <option value="weekly_showcase">Weekly Coin Showcase</option>
                    <option value="leaderboard_weekly">Weekly Leaderboard</option>
                    <option value="leaderboard_monthly">Monthly Leaderboard</option>
                    <option value="leaderboard_overall">All-Time Leaderboard</option>
                    <option value="new_collector">New Collector Welcome</option>
                    <option value="milestone">Collection Milestone (75%)</option>
                    <option value="album_100">Album Complete (100%)</option>
                    <option value="achievement">Collector Achievement</option>
                  </select>
                </div>

                {/* Simulated Facebook Post UI Card */}
                <div className="max-w-xl mx-auto bg-[#242526] text-[#e4e6eb] rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden">
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#dfb86c] to-[#b88c3a] flex items-center justify-center text-zinc-950 font-black text-sm shadow">
                        🪙
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          {connection?.page_name || 'PocketAlbum Official'}
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]">✓</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <span>Just now</span> &bull; <span>🌐</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-line text-zinc-200">
                    {getRenderedPreview()}
                  </div>

                  {/* Optional Sample Image for Coin Posts */}
                  {previewType === 'coin_add' && (
                    <div className="bg-black flex items-center justify-center border-t border-b border-zinc-800">
                      <img
                        src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
                        alt="Preview Coin"
                        className="max-h-72 object-contain"
                      />
                    </div>
                  )}

                  {/* Facebook Likes & Engagement Bar */}
                  <div className="px-4 py-2 border-t border-zinc-700/80 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <span>👍❤️🔥</span> <span>PocketAlbum Community & 24 others</span>
                    </div>
                    <div>12 Comments &bull; 4 Shares</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PUBLISHING QUEUE & HISTORY */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* Queue Header & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#1e1510] border border-[#5a4420]/70 rounded-2xl">
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#f7eedd] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#dfb86c]" /> Publishing Queue & Post History
                  </h3>
                  <p className="text-xs text-[#a89c8d]">
                    Monitor pending, published, and retrying posts. Background runner executes every 30 seconds.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleProcessQueueNow}
                    disabled={isProcessingQueue}
                    className="px-3.5 py-1.5 text-xs font-black bg-gradient-to-r from-[#dfb86c] to-[#b88c3a] text-[#140e08] rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
                    {isProcessingQueue ? 'Processing...' : 'Process Queue Now'}
                  </button>
                </div>
              </div>

              {queueActionMsg && (
                <div className="p-3 bg-[#241a13] border border-[#dfb86c]/60 rounded-xl text-xs text-[#dfb86c]">
                  {queueActionMsg}
                </div>
              )}

              {/* Status filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => handleFilterQueue('')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    queueStatusFilter === '' ? 'bg-[#dfb86c] text-[#140e08]' : 'bg-[#1e1510] text-[#a89c8d] hover:text-[#f7eedd]'
                  }`}
                >
                  All ({queueData?.counts.total || 0})
                </button>
                <button
                  onClick={() => handleFilterQueue('PUBLISHED')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    queueStatusFilter === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'bg-[#1e1510] text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  Published ({queueData?.counts.published || 0})
                </button>
                <button
                  onClick={() => handleFilterQueue('PENDING')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    queueStatusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-[#1e1510] text-amber-400 hover:text-amber-300'
                  }`}
                >
                  Pending ({queueData?.counts.pending || 0})
                </button>
                <button
                  onClick={() => handleFilterQueue('RETRYING')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    queueStatusFilter === 'RETRYING' ? 'bg-blue-600 text-white' : 'bg-[#1e1510] text-blue-400 hover:text-blue-300'
                  }`}
                >
                  Retrying ({queueData?.counts.retrying || 0})
                </button>
                <button
                  onClick={() => handleFilterQueue('FAILED')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    queueStatusFilter === 'FAILED' ? 'bg-red-600 text-white' : 'bg-[#1e1510] text-red-400 hover:text-red-300'
                  }`}
                >
                  Failed ({queueData?.counts.failed || 0})
                </button>
                <button
                  onClick={() => handleFilterQueue('CANCELLED')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    queueStatusFilter === 'CANCELLED' ? 'bg-zinc-600 text-white' : 'bg-[#1e1510] text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  Cancelled ({queueData?.counts.cancelled || 0})
                </button>
              </div>

              {/* Queue Items Table */}
              <div className="bg-[#140e0a] border border-[#5a4420]/50 rounded-2xl overflow-hidden">
                {isLoadingQueue ? (
                  <div className="p-8 text-center text-xs text-[#a89c8d]">Loading queue items...</div>
                ) : !queueData || queueData.items.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs text-[#a89c8d]">No posts found in the publishing queue for this filter.</p>
                    <p className="text-[11px] text-[#7a5c28]">Add coins or trigger digests to see items appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#5a4420]/30">
                    {queueData.items.map((item: FacebookQueueRecord) => (
                      <div key={item.id} className="p-4 hover:bg-[#1a120c] transition-colors space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Status badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.status === 'PUBLISHED'
                                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300'
                                : item.status === 'PENDING'
                                ? 'bg-amber-950/80 border border-amber-600 text-amber-300 animate-pulse'
                                : item.status === 'PROCESSING'
                                ? 'bg-blue-950/80 border border-blue-600 text-blue-300'
                                : item.status === 'RETRYING'
                                ? 'bg-blue-950/80 border border-blue-600 text-blue-300'
                                : item.status === 'CANCELLED'
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-red-950/80 border border-red-600 text-red-300'
                            }`}>
                              {item.status}
                            </span>

                            <span className="text-xs font-bold text-[#dfd4bf]">
                              Type: <code className="text-[#dfb86c]">{item.post_type}</code>
                            </span>

                            {item.username && (
                              <span className="text-xs text-[#a89c8d]">
                                Collector: @{item.username}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {['FAILED', 'CANCELLED'].includes(item.status) && (
                              <button
                                onClick={() => handleRetry(item.id)}
                                className="px-2 py-1 text-[11px] font-bold bg-[#1e1510] hover:bg-[#2e2017] border border-[#7a5c28] text-[#dfb86c] rounded-lg transition-colors cursor-pointer"
                              >
                                Retry
                              </button>
                            )}

                            {['PENDING', 'RETRYING'].includes(item.status) && (
                              <button
                                onClick={() => handleCancel(item.id)}
                                className="px-2 py-1 text-[11px] font-bold bg-[#1e1510] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-[#a89c8d] hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete from History"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Post snippet */}
                        <div className="text-xs text-[#f7eedd]/90 font-mono bg-[#0e0a07] p-2.5 rounded-xl line-clamp-3 whitespace-pre-wrap border border-[#5a4420]/30">
                          {item.content}
                        </div>

                        {/* Error info if any */}
                        {item.error_message && (
                          <div className="text-[11px] text-red-400 bg-red-950/30 p-2 rounded-lg border border-red-900/40">
                            Error: {item.error_message} (Retries: {item.retry_count}/{item.max_retries})
                          </div>
                        )}

                        {/* Footer metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#a89c8d] pt-1">
                          <span>Created: {new Date(item.created_at).toLocaleString()}</span>
                          {item.published_at && (
                            <span className="text-emerald-400 font-semibold">Published: {new Date(item.published_at).toLocaleString()}</span>
                          )}
                          {item.facebook_post_id && (
                            <span className="font-mono text-[#dfb86c]">Post ID: {item.facebook_post_id}</span>
                          )}
                          <span>Event ID: {item.event_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#1e1610] border-t border-[#5a4420]/60 flex items-center justify-between text-xs text-[#a89c8d]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#dfb86c]" />
            <span>Authorized Administrator Access &bull; Privacy-Safe Numismatic Gateway</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-xs bg-[#140e0a] hover:bg-[#251b14] border border-[#5a4420] text-[#dfd4bf] rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
