import { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Clock,
  Star,
  Users,
  Code,
  Brain,
  Monitor,
  Server,
  Plus,
  Edit3,
  Calendar,
  TrendingUp,
  Battery,
  Zap,
  Upload,
  FileText,
  Download,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// MODAL COMPONENTS (Moved outside the main component)
// ====================================================================================

const TeamPreferencesModal = ({
  onClose,
  skillOptions,
  teamPreferences,
  toggleSkill,
}) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-cyan-400" />
            Team Preferences
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl hover:bg-slate-700/50 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {Object.entries(skillOptions).map(([domain, options]) => {
            const domainConfig = {
              frontend: { color: "blue", icon: Monitor, name: "Frontend" },
              backend: { color: "emerald", icon: Server, name: "Backend" },
              aiml: { color: "purple", icon: Brain, name: "AI/ML" },
            };
            const config = domainConfig[domain];
            const IconComponent = config.icon;
            const currentSkills = teamPreferences[domain] || [];

            return (
              <div
                key={domain}
                className={`bg-slate-700/30 border border-slate-600/50 rounded-2xl p-6 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`p-3 rounded-xl border ${
                      config.color === "blue"
                        ? "bg-blue-500/20 border-blue-500/30"
                        : config.color === "emerald"
                        ? "bg-emerald-500/20 border-emerald-500/30"
                        : "bg-purple-500/20 border-purple-500/30"
                    }`}
                  >
                    <IconComponent
                      className={
                        config.color === "blue"
                          ? "text-blue-400"
                          : config.color === "emerald"
                          ? "text-emerald-400"
                          : "text-purple-400"
                      }
                      size={28}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-xl">
                      {config.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select your preferred skills
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {options.map((skill) => {
                    const isSelected = currentSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(domain, skill)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? config.color === "blue"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : config.color === "emerald"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-slate-600/30 text-slate-300 border border-slate-500/30 hover:bg-slate-600/50"
                        }`}
                      >
                        <span className="font-medium">{skill}</span>
                        {isSelected && (
                          <Check
                            className={
                              config.color === "blue"
                                ? "text-blue-400"
                                : config.color === "emerald"
                                ? "text-emerald-400"
                                : "text-purple-400"
                            }
                            size={16}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-6 border-t border-slate-700/50 bg-slate-800/50 flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-6 py-3 text-slate-300 bg-slate-700 border border-slate-600 rounded-xl hover:bg-slate-600 transition-all duration-200 hover:scale-105"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:scale-105"
        >
          Save Preferences
        </button>
      </div>
    </div>
  </div>
);

const ResumeUploadModal = ({
  onClose,
  uploadedResume,
  fileInputRef,
  handleFileSelect,
  isUploading,
  uploadProgress,
  removeResume,
}) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="text-cyan-400" />
            Upload Resume
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl hover:bg-slate-700/50 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {!uploadedResume ? (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center hover:border-cyan-500/50 transition-all duration-300 cursor-pointer bg-slate-700/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                  <Upload className="text-cyan-400" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drop your resume here
                  </h3>
                  <p className="text-slate-400 mb-4">
                    or click to browse files
                  </p>
                  <p className="text-sm text-slate-500">
                    Supports PDF, DOC, DOCX files up to 10MB
                  </p>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <span className="text-white font-medium">Uploading...</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-400">
                  {uploadProgress}% complete
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Check className="text-emerald-400" size={20} />
                Resume Uploaded Successfully
              </h3>
              <button
                onClick={removeResume}
                className="text-slate-400 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <FileText className="text-blue-400" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{uploadedResume.name}</p>
                <p className="text-slate-400 text-sm">
                  {uploadedResume.size} • Uploaded on{" "}
                  {uploadedResume.uploadDate}
                </p>
              </div>
              <button className="text-cyan-400 hover:text-cyan-300 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
                <Download size={18} />
              </button>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-300">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  Your resume is now part of your profile and can be viewed by
                  potential teammates.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-6 border-t border-slate-700/50 bg-slate-800/50 flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-6 py-3 text-slate-300 bg-slate-700 border border-slate-600 rounded-xl hover:bg-slate-600 transition-all duration-200 hover:scale-105"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

const EditProfileModal = ({
  onClose,
  editForm,
  setEditForm,
  onSave,
  experienceLevels,
  availabilityLevels,
  getAvailabilityConfig,
}) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Edit3 className="text-cyan-400" />
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl hover:bg-slate-700/50 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={editForm.username || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={editForm.email || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={editForm.phone || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={editForm.location || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              GitHub
            </label>
            <input
              type="text"
              value={editForm.github || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, github: e.target.value }))
              }
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              LinkedIn
            </label>
            <input
              type="text"
              value={editForm.linkedin || ""}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, linkedin: e.target.value }))
              }
              className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Domain
          </label>
          <input
            type="text"
            value={editForm.domain || ""}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, domain: e.target.value }))
            }
            className="w-full p-3 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Experience Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {experienceLevels.map((level) => (
              <button
                key={level}
                onClick={() =>
                  setEditForm((prev) => ({ ...prev, experience: level }))
                }
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium hover:scale-105 ${
                  editForm.experience === level
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-400/20"
                    : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Availability Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {availabilityLevels.map((level) => {
              const config = getAvailabilityConfig(level);
              const IconComponent = config.icon;
              return (
                <button
                  key={level}
                  onClick={() =>
                    setEditForm((prev) => ({ ...prev, availability: level }))
                  }
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 hover:scale-105 ${
                    editForm.availability === level
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-400/20"
                      : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                  }`}
                >
                  <IconComponent size={16} />
                  {level}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Bio
          </label>
          <textarea
            value={editForm.bio || ""}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, bio: e.target.value }))
            }
            className="w-full p-4 border border-slate-600 rounded-xl bg-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm"
            rows="4"
            placeholder="Tell others about yourself and what you're passionate about..."
          />
        </div>
      </div>
      <div className="p-6 border-t border-slate-700/50 bg-slate-800/50 flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-6 py-3 text-slate-300 bg-slate-700 border border-slate-600 rounded-xl hover:bg-slate-600 transition-all duration-200 hover:scale-105"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:scale-105"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

// MAIN PAGE COMPONENT
// ====================================================================================

const UserProfilePage = () => {
  const { userProfile, updateUserProfile } = useAuth();

  // Local state to track the current profile data
  const [currentProfile, setCurrentProfile] = useState(userProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // State for the edit form
  const [editForm, setEditForm] = useState({});

  // Skills for team preference section
  const [teamPreferences, setTeamPreferences] = useState({
    frontend: ["React", "Vue.js", "TypeScript"],
    backend: ["Node.js", "Python", "Django"],
    aiml: ["TensorFlow", "PyTorch", "Machine Learning"],
  });

  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const availabilityLevels = ["High", "Medium", "Low"];

  const skillOptions = {
    frontend: [
      "React",
      "Vue.js",
      "Angular",
      "JavaScript",
      "TypeScript",
      "CSS",
      "HTML",
      "Tailwind",
      "Next.js",
      "Svelte",
    ],
    backend: [
      "Node.js",
      "Python",
      "Java",
      "Django",
      "Express",
      "Flask",
      "Spring Boot",
      "PostgreSQL",
      "MongoDB",
      "Redis",
    ],
    aiml: [
      "TensorFlow",
      "PyTorch",
      "Scikit-learn",
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "Pandas",
      "NumPy",
    ],
  };

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setCurrentProfile(userProfile);
    }
  }, [userProfile]);

  const getExperienceColor = (level) => {
    const colors = {
      Beginner:
        "bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-sm",
      Intermediate:
        "bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-sm",
      Advanced:
        "bg-orange-500/20 text-orange-300 border-orange-500/30 backdrop-blur-sm",
      Expert: "bg-red-500/20 text-red-300 border-red-500/30 backdrop-blur-sm",
    };
    return colors[level] || colors.Beginner;
  };

  const getAvailabilityConfig = (level) => {
    const configs = {
      High: {
        color:
          "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-sm",
        icon: Zap,
        description: "Very active and available for collaboration",
      },
      Medium: {
        color:
          "bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-sm",
        icon: Battery,
        description: "Moderately available, selective about projects",
      },
      Low: {
        color: "bg-red-500/20 text-red-300 border-red-500/30 backdrop-blur-sm",
        icon: Clock,
        description: "Limited availability, busy schedule",
      },
    };
    return configs[level] || configs.Medium;
  };

  const handleProfileUpdate = async () => {
    try {
      if (updateUserProfile && editForm) {
        // Call the update function
        const success = await updateUserProfile(editForm);

        if (success !== false) {
          // Check if update was successful
          // Update local state immediately for better UX
          setCurrentProfile((prev) => ({ ...prev, ...editForm }));
          console.log("Profile updated successfully");
        } else {
          console.error("Failed to update profile");
          // You could show an error message here
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsEditing(false);
      setEditForm({});
    }
  };

  const handleOpenEditModal = () => {
    // Initialize form state with current profile data
    setEditForm({ ...currentProfile });
    setIsEditing(true);
  };

  const handleCloseEditModal = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleTeamPreferenceUpdate = (domain, skills) => {
    setTeamPreferences((prev) => ({ ...prev, [domain]: skills }));
  };

  const toggleSkill = (domain, skill) => {
    const currentSkills = teamPreferences[domain] || [];
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    handleTeamPreferenceUpdate(domain, updatedSkills);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        simulateFileUpload(file);
      } else {
        alert("Please upload a PDF or DOC file only.");
      }
    }
  };

  const simulateFileUpload = (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadedResume({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            uploadDate: new Date().toLocaleDateString(),
            type: file.type.includes("pdf") ? "PDF" : "DOC",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const removeResume = async () => {
    setUploadedResume(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Remove resume from user profile
    try {
      if (updateUserProfile) {
        const success = await updateUserProfile({
          resume: null,
        });

        if (success !== false) {
          setCurrentProfile((prev) => ({
            ...prev,
            resume: null,
          }));
          console.log("Resume removed from profile successfully");
        }
      }
    } catch (error) {
      console.error("Error removing resume from profile:", error);
    }
  };

  const handleResumeDownload = () => {
    if (uploadedResume && uploadedResume.url) {
      const link = document.createElement("a");
      link.href = uploadedResume.url;
      link.download = uploadedResume.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Use currentProfile instead of userProfile for display
  const profileToDisplay = currentProfile || userProfile;

  if (!profileToDisplay) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading profile...
      </div>
    );
  }

  const availabilityConfig = getAvailabilityConfig(
    profileToDisplay.availability
  );
  const AvailabilityIcon = availabilityConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Modals */}
      {showResumeModal && (
        <ResumeUploadModal
          onClose={() => setShowResumeModal(false)}
          uploadedResume={uploadedResume}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          removeResume={removeResume}
        />
      )}
      {showTeamModal && (
        <TeamPreferencesModal
          onClose={() => setShowTeamModal(false)}
          skillOptions={skillOptions}
          teamPreferences={teamPreferences}
          toggleSkill={toggleSkill}
        />
      )}
      {isEditing && (
        <EditProfileModal
          onClose={handleCloseEditModal}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleProfileUpdate}
          experienceLevels={experienceLevels}
          availabilityLevels={availabilityLevels}
          getAvailabilityConfig={getAvailabilityConfig}
        />
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mb-8 border border-slate-700/50">
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-8 py-16 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-8">
                    <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border-2 border-white/20 shadow-2xl">
                      <User size={48} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                        {profileToDisplay.username ||
                          profileToDisplay.displayName ||
                          ""}
                      </h1>
                      <p className="text-cyan-100 text-xl mb-6 font-medium">
                        {profileToDisplay.domain}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span
                          className={`px-5 py-3 rounded-2xl text-sm font-medium border-2 flex items-center gap-2 ${availabilityConfig.color}`}
                        >
                          <AvailabilityIcon size={18} />
                          {profileToDisplay.availability} Availability
                        </span>
                        <span
                          className={`px-5 py-3 rounded-2xl text-sm font-medium border-2 ${getExperienceColor(
                            profileToDisplay.experience
                          )}`}
                        >
                          <TrendingUp size={18} className="inline mr-2" />
                          {profileToDisplay.experience} Level
                        </span>
                        <span className="px-5 py-3 rounded-2xl text-sm font-medium bg-white/10 text-white border-2 border-white/20 backdrop-blur-sm">
                          <Clock size={18} className="inline mr-2" />
                          Active{" "}
                          {profileToDisplay.lastSeen ||
                            profileToDisplay.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowResumeModal(true)}
                      className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20 font-medium flex items-center gap-3 hover:scale-105 transform shadow-lg hover:shadow-xl"
                    >
                      <Upload size={22} />
                      Resume
                    </button>
                    <button
                      onClick={handleOpenEditModal}
                      className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border-2 border-white/20 font-medium flex items-center gap-3 hover:scale-105 transform shadow-lg hover:shadow-xl"
                    >
                      <Edit3 size={22} />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Profile Content */}
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Contact & Basic Info */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300 group">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 group-hover:bg-cyan-500/30 transition-colors">
                        <Mail className="text-cyan-400" size={22} />
                      </div>
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-slate-300 bg-slate-600/30 p-4 rounded-xl backdrop-blur-sm border border-slate-500/30">
                        <Mail size={20} className="text-cyan-400" />
                        <span className="font-medium">
                          {profileToDisplay.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300 bg-slate-600/30 p-4 rounded-xl backdrop-blur-sm border border-slate-500/30">
                        <User size={20} className="text-emerald-400" />
                        <span className="font-medium">
                          {profileToDisplay.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300 bg-slate-600/30 p-4 rounded-xl backdrop-blur-sm border border-slate-500/30">
                        <Calendar size={20} className="text-purple-400" />
                        <span className="font-medium">
                          {profileToDisplay.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  {uploadedResume && (
                    <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 group">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                          <FileText className="text-blue-400" size={22} />
                        </div>
                        Resume
                      </h3>
                      <div className="flex items-center gap-4 text-slate-300 bg-slate-600/30 p-4 rounded-xl backdrop-blur-sm border border-slate-500/30">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                          <FileText className="text-blue-400" size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {uploadedResume.name}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {uploadedResume.size} • {uploadedResume.type}
                          </p>
                        </div>
                        <button
                          onClick={handleResumeDownload}
                          className="text-cyan-400 hover:text-cyan-300 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                        <User className="text-purple-400" size={22} />
                      </div>
                      About Me
                    </h3>
                    {profileToDisplay.bio ? (
                      <p className="text-slate-300 leading-relaxed bg-slate-600/30 p-5 rounded-xl backdrop-blur-sm border border-slate-500/30">
                        {profileToDisplay.bio}
                      </p>
                    ) : (
                      <div className="text-center py-8 bg-slate-600/20 rounded-xl border border-slate-500/20">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                          <Edit3 className="text-purple-400" size={20} />
                        </div>
                        <p className="text-slate-400 text-sm italic mb-3">
                          No bio added yet
                        </p>
                        <button
                          onClick={handleOpenEditModal}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium hover:underline px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all duration-200"
                        >
                          Add bio
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Professional Links Section */}
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 group">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                        <Code className="text-indigo-400" size={22} />
                      </div>
                      Professional Links
                    </h3>
                    <div className="space-y-4">
                      {profileToDisplay.github ? (
                        <div className="flex items-center gap-4 text-slate-300 bg-slate-600/30 p-4 rounded-xl backdrop-blur-sm border border-slate-500/30 hover:border-orange-500/30 transition-colors group/link">
                          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 group-hover/link:bg-orange-500/30 transition-colors">
                            <Code size={18} className="text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-orange-300 font-medium text-sm">
                              GitHub
                            </p>
                            <a
                              href={
                                profileToDisplay.github.startsWith("http")
                                  ? profileToDisplay.github
                                  : `https://github.com/${profileToDisplay.github}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-300 hover:text-orange-300 transition-colors text-sm"
                            >
                              {profileToDisplay.github}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-slate-400 bg-slate-600/20 p-4 rounded-xl backdrop-blur-sm border border-slate-500/20">
                          <div className="w-10 h-10 bg-slate-500/20 rounded-xl flex items-center justify-center border border-slate-500/20">
                            <Code size={18} className="text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-400 font-medium text-sm">
                              GitHub
                            </p>
                            <p className="text-slate-500 text-sm italic">
                              Not provided
                            </p>
                          </div>
                        </div>
                      )}

                      {profileToDisplay.linkedin ? (
                        <div className="flex items-center gap-4 text-slate-300 bg-slate-600/30 p-4 rounded-xl backdrop-blur-sm border border-slate-500/30 hover:border-blue-500/30 transition-colors group/link">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover/link:bg-blue-500/30 transition-colors">
                            <Users size={18} className="text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-blue-300 font-medium text-sm">
                              LinkedIn
                            </p>
                            <a
                              href={
                                profileToDisplay.linkedin.startsWith("http")
                                  ? profileToDisplay.linkedin
                                  : `https://linkedin.com/in/${profileToDisplay.linkedin}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-300 hover:text-blue-300 transition-colors text-sm"
                            >
                              {profileToDisplay.linkedin}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-slate-400 bg-slate-600/20 p-4 rounded-xl backdrop-blur-sm border border-slate-500/20">
                          <div className="w-10 h-10 bg-slate-500/20 rounded-xl flex items-center justify-center border border-slate-500/20">
                            <Users size={18} className="text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-400 font-medium text-sm">
                              LinkedIn
                            </p>
                            <p className="text-slate-500 text-sm italic">
                              Not provided
                            </p>
                          </div>
                        </div>
                      )}

                      {!profileToDisplay.github &&
                        !profileToDisplay.linkedin && (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/30">
                              <Plus className="text-indigo-400" size={20} />
                            </div>
                            <p className="text-slate-400 text-sm italic mb-3">
                              No professional links added
                            </p>
                            <button
                              onClick={handleOpenEditModal}
                              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all duration-200"
                            >
                              Add links
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                {/* Skills & Team Creation */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600/30 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 group-hover:bg-amber-500/30 transition-colors">
                        <Star className="text-amber-400" size={22} />
                      </div>
                      My TechStack
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(profileToDisplay.preferredSkills || []).map((skill) => (
                        <span
                          key={skill}
                          className="px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 rounded-xl text-sm font-medium border border-amber-500/30 shadow-lg backdrop-blur-sm hover:scale-105 transition-all duration-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-sm shadow-2xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white">
                      <div className="p-2 rounded-xl bg-cyan-500/30 border border-cyan-400/50">
                        <Users className="text-cyan-300" size={22} />
                      </div>
                      Ready to Collaborate?
                    </h3>
                    <p className="text-cyan-100 mb-8 leading-relaxed text-lg">
                      Connect with like-minded developers and build amazing
                      projects together. Set your team preferences and find the
                      perfect collaborators!
                    </p>
                    <button
                      onClick={() => setShowTeamModal(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-medium flex items-center gap-3 hover:scale-105 transform w-full justify-center shadow-lg shadow-cyan-500/25 hover:shadow-xl border border-cyan-400/30"
                    >
                      <Plus size={22} />
                      Create Dream Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Current Team Preferences Display */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-700/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <Code className="text-blue-400" size={28} />
                </div>
                My Team Preferences
              </h2>
              <button
                onClick={() => setShowTeamModal(true)}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-2 hover:underline bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/20 transition-all duration-200"
              >
                <Edit3 size={18} />
                Update Preferences
              </button>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {Object.entries(teamPreferences).map(([domain, skills]) => {
                const domainConfig = {
                  frontend: { color: "blue", icon: Monitor, name: "Frontend" },
                  backend: { color: "emerald", icon: Server, name: "Backend" },
                  aiml: { color: "purple", icon: Brain, name: "AI/ML" },
                };
                const config = domainConfig[domain];
                const IconComponent = config.icon;
                return (
                  <div
                    key={domain}
                    className={`bg-gradient-to-br ${
                      config.color === "blue"
                        ? "from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40"
                        : config.color === "emerald"
                        ? "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40"
                        : "from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40"
                    } border-2 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 group hover:scale-105`}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`p-3 rounded-xl border ${
                          config.color === "blue"
                            ? "bg-blue-500/20 border-blue-500/30 group-hover:bg-blue-500/30"
                            : config.color === "emerald"
                            ? "bg-emerald-500/20 border-emerald-500/30 group-hover:bg-emerald-500/30"
                            : "bg-purple-500/20 border-purple-500/30 group-hover:bg-purple-500/30"
                        } transition-colors`}
                      >
                        <IconComponent
                          className={
                            config.color === "blue"
                              ? "text-blue-400"
                              : config.color === "emerald"
                              ? "text-emerald-400"
                              : "text-purple-400"
                          }
                          size={28}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-xl">
                          {config.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Seeking teammates with
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <div
                            key={skill}
                            className="px-4 py-3 bg-slate-700/40 rounded-xl text-sm text-slate-200 border border-slate-600/30 flex items-center justify-between backdrop-blur-sm hover:bg-slate-700/60 transition-colors"
                          >
                            <span className="font-medium">{skill}</span>
                            <span
                              className={`w-3 h-3 rounded-full shadow-lg ${
                                config.color === "blue"
                                  ? "bg-blue-400"
                                  : config.color === "emerald"
                                  ? "bg-emerald-400"
                                  : "bg-purple-400"
                              }`}
                            ></span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div
                            className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4 ${
                              config.color === "blue"
                                ? "bg-blue-500/10 border-blue-500/30"
                                : config.color === "emerald"
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-purple-500/10 border-purple-500/30"
                            }`}
                          >
                            <Plus
                              className={
                                config.color === "blue"
                                  ? "text-blue-400"
                                  : config.color === "emerald"
                                  ? "text-emerald-400"
                                  : "text-purple-400"
                              }
                              size={24}
                            />
                          </div>
                          <p className="text-slate-400 text-sm italic mb-3">
                            No preferences set
                          </p>
                          <button
                            onClick={() => setShowTeamModal(true)}
                            className={`text-sm font-medium hover:underline px-4 py-2 rounded-xl border transition-all duration-200 ${
                              config.color === "blue"
                                ? "text-blue-400 hover:text-blue-300 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
                                : config.color === "emerald"
                                ? "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "text-purple-400 hover:text-purple-300 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
                            }`}
                          >
                            Add preferences
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
