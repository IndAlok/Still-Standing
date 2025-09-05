import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  Target,
  Clock,
  Zap,
  Star,
  ArrowRight,
  Play,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    setIsVisible(true);
    
    // Redirect if already logged in
    if (currentUser) {
      navigate('/dashboard');
      return;
    }
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Smart Matchmaking",
      description:
        "AI-powered matching finds teammates who complement your skills and share your goals",
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Show Your Skills",
      description:
        "Create a compelling profile that highlights your strengths and discovers others",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Match on Time",
      description:
        "Connect with people who are actually available when you need them",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Connect",
      description: "Join events, clubs, hackathons, and games with ease",
    },
  ];

  const stats = [
    { number: "10K+", label: "Teams Formed" },
    { number: "50K+", label: "Active Users" },
    { number: "95%", label: "Success Rate" },
    { number: "24h", label: "Avg Match Time" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ConnectCrew
          </span>
        </div>
        <button 
          onClick={() => navigate('/register')}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={`space-y-8 transform transition-all duration-1000 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }`}
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-full px-4 py-2 border border-cyan-500/30">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Stop Ideas From Dying
                  </span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Find Your
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block">
                    Perfect Team
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Great ideas die not from lack of passion, but lack of people.
                  Connect with the right collaborators for hackathons, study
                  groups, gaming, and more. Turn isolation into collaboration.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Start Matching Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="group px-8 py-4 border-2 border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-8 pt-8 border-t border-white/10">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Feature Showcase */}
            <div
              className={`relative transform transition-all duration-1000 delay-500 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0"
              }`}
            >
              <div className="relative">
                {/* Main feature card */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      {features[activeFeature].icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {features[activeFeature].title}
                      </h3>
                      <p className="text-gray-300">
                        {features[activeFeature].description}
                      </p>
                    </div>
                  </div>

                  {/* Mock interface */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Alex Chen</div>
                          <div className="text-sm text-gray-400">
                            React Developer
                          </div>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Sarah Kim</div>
                          <div className="text-sm text-gray-400">
                            UI/UX Designer
                          </div>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Mike Johnson</div>
                          <div className="text-sm text-gray-400">
                            Backend Engineer
                          </div>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                  <Users className="w-8 h-8" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl animate-pulse">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Teams Choose ConnectCrew
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to build amazing teams, fast
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl hover:border-cyan-500/50 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 ${
                  activeFeature === index
                    ? "border-cyan-500/50 shadow-xl shadow-cyan-500/20"
                    : ""
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Turn Your Ideas Into
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent block">
                Reality?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of creators, developers, and innovators who've
              found their perfect teammates. Your next great collaboration is
              just one click away.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="group px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 mx-auto"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
