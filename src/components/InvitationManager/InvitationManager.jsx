import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import crewConnectService from "../../services/crewConnectService";
import {
  Bell,
  Check,
  X,
  User,
  Users,
  Mail,
  Clock,
  UserPlus,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-600/90 border-green-500/50 text-white";
      case "error":
        return "bg-red-600/90 border-red-500/50 text-white";
      case "info":
        return "bg-blue-600/90 border-blue-500/50 text-white";
      default:
        return "bg-slate-600/90 border-slate-500/50 text-white";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-300" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-300" />;
      case "info":
        return <AlertCircle className="w-5 h-5 text-blue-300" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-6 py-4 rounded-xl border backdrop-blur-xl shadow-2xl transform transition-all duration-300 ease-out ${getToastStyles()}`}
      style={{
        animation: "slideInFromTop 0.3s ease-out",
      }}
    >
      {getIcon()}
      <span className="font-medium text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const InvitationManager = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("received"); // received, sent
  const [loading, setLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (currentUser) {
      fetchInvitationsAndRequests();
      fetchUserGroups();
    }
  }, [currentUser]);

  const fetchUserGroups = async () => {
    try {
      const groups = await crewConnectService.getUserCrews();
      setUserGroups(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  };

  const fetchInvitationsAndRequests = async () => {
    try {
      setLoading(true);

      // Get received invitations
      const receivedInvitations = await crewConnectService.getUserInvitations(
        "pending"
      );
      setInvitations(receivedInvitations);

      // Get join requests for owned groups
      const allRequests = [];
      const groups = await crewConnectService.getUserCrews();

      for (const group of groups) {
        // Only fetch requests for groups where user is owner/admin
        try {
          const requests = await crewConnectService.getJoinRequests(
            group.id,
            "pending"
          );
          allRequests.push(
            ...requests.map((req) => ({ ...req, groupName: group.name }))
          );
        } catch (error) {
          // User might not have permission for this group
          console.log(`No permission to view requests for ${group.name}`);
        }
      }

      setJoinRequests(allRequests);
    } catch (error) {
      console.error("Error fetching invitations and requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId, action) => {
    if (processingInvitation === invitationId) {
      console.log("Already processing invitation", invitationId);
      return; // Prevent double-clicking
    }

    try {
      setProcessingInvitation(invitationId);
      console.log("Handling invitation:", invitationId, action);

      await crewConnectService.handleInvitation(invitationId, action);

      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // Show success message
      if (action === "accepted") {
        showToast(
          "🎉 Successfully joined the group! Welcome aboard!",
          "success"
        );
        fetchUserGroups(); // Refresh groups
      } else {
        showToast("Invitation declined successfully", "info");
      }
    } catch (error) {
      console.error("Error handling invitation:", error);
      showToast(
        error.message || "Failed to process invitation. Please try again.",
        "error"
      );
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleJoinRequest = async (requestId, action) => {
    try {
      await crewConnectService.handleJoinRequest(requestId, action);

      // Remove from list
      setJoinRequests((prev) => prev.filter((req) => req.id !== requestId));

      // Show success message
      if (action === "approved") {
        showToast(
          "✅ Join request approved! New member added to the group.",
          "success"
        );
      } else {
        showToast("Join request rejected", "info");
      }
    } catch (error) {
      console.error("Error handling join request:", error);
      showToast(
        error.message || "Failed to process join request. Please try again.",
        "error"
      );
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown time";

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-blue-400" />
            Invitations & Requests
          </h2>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-slate-700/30 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "received"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-600/50"
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Received ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "sent"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-600/50"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Requests to Approve ({joinRequests.length})
            </button>
          </div>

          {/* Content */}
          {activeTab === "received" ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Group Invitations
              </h3>
              {invitations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No pending invitations</p>
                  <p className="text-sm text-slate-500">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-5 border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">
                              {invitation.crewName}
                            </h4>
                            <p className="text-slate-300 text-sm">
                              Invited by{" "}
                              <span className="text-blue-400 font-medium">
                                {invitation.inviterName}
                              </span>{" "}
                              as{" "}
                              <span className="text-purple-400 font-medium">
                                {invitation.role}
                              </span>
                            </p>
                          </div>
                        </div>

                        {invitation.message && (
                          <p className="text-slate-200 text-sm mb-3 ml-15 bg-slate-600/20 rounded-lg p-3 border-l-4 border-blue-400">
                            "{invitation.message}"
                          </p>
                        )}

                        <div className="flex items-center text-slate-400 text-xs ml-15">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(invitation.createdAt)}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() =>
                            handleInvitation(invitation.id, "accepted")
                          }
                          disabled={processingInvitation === invitation.id}
                          className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-200 ${
                            processingInvitation === invitation.id
                              ? "bg-slate-500 cursor-not-allowed opacity-50"
                              : "bg-green-600 hover:bg-green-500 shadow-lg hover:shadow-green-500/25"
                          }`}
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          {processingInvitation === invitation.id
                            ? "Processing..."
                            : "Accept"}
                        </button>
                        <button
                          onClick={() =>
                            handleInvitation(invitation.id, "declined")
                          }
                          disabled={processingInvitation === invitation.id}
                          className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-200 ${
                            processingInvitation === invitation.id
                              ? "bg-slate-500 cursor-not-allowed opacity-50"
                              : "bg-red-600 hover:bg-red-500 shadow-lg hover:shadow-red-500/25"
                          }`}
                        >
                          <X className="w-4 h-4 inline mr-1" />
                          {processingInvitation === invitation.id
                            ? "Processing..."
                            : "Decline"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Join Requests to Approve
              </h3>
              {joinRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No pending join requests</p>
                  <p className="text-sm text-slate-500">
                    No one is waiting for approval
                  </p>
                </div>
              ) : (
                joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-5 border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                            {request.userAvatar ? (
                              <img
                                src={request.userAvatar}
                                alt={request.userName}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-lg">
                              {request.userName}
                            </h4>
                            <p className="text-slate-300 text-sm">
                              <span className="text-slate-400">
                                {request.userEmail}
                              </span>{" "}
                              • wants to join{" "}
                              <span className="text-purple-400 font-medium">
                                {request.groupName}
                              </span>
                            </p>
                          </div>
                        </div>

                        {request.message && (
                          <p className="text-slate-200 text-sm mb-3 ml-15 bg-slate-600/20 rounded-lg p-3 border-l-4 border-orange-400">
                            "{request.message}"
                          </p>
                        )}

                        <div className="flex items-center text-slate-400 text-xs ml-15">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(request.createdAt)}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() =>
                            handleJoinRequest(request.id, "approved")
                          }
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleJoinRequest(request.id, "rejected")
                          }
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                        >
                          <X className="w-4 h-4 inline mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationManager;
