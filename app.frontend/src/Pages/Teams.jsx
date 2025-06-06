import React, { useState, useEffect } from "react";
import {
  Users, Plus, Search, Settings, Crown, User, Code, Eye, UserPlus, Clock, X
} from "lucide-react";
import axios from "axios";
import { getCurrentUser } from "../utils/auth";

const API_URL = "http://localhost:3000/api/teams";

const Teams = () => {
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState("my-teams");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [myTeams, setMyTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [teamDetails, setTeamDetails] = useState({});

  // Helper random color
  const getRandomColor = () => {
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-green-500",
      "bg-orange-500", "bg-red-500", "bg-indigo-500"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Fetch toate echipele
  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      const allTeams = response.data;
      const myId = currentUser?._id || currentUser?.id;
      // Filtrare echipe proprii și disponibile
      const userTeams = allTeams.filter(team =>
        team.members.some(member =>
          (member._id || member.id || member) === myId
        )
      );
      const otherTeams = allTeams.filter(team =>
        !team.members.some(member =>
          (member._id || member.id || member) === myId
        )
      );
      setMyTeams(
        userTeams.map(team => ({
          ...team,
          memberCount: team.members.length,
          projectCount: team.projects?.length || 0,
          role: (team.createdBy._id || team.createdBy.id || team.createdBy) === myId ? "admin" : "member",
          avatar: team.name.substring(0, 2).toUpperCase(),
          color: getRandomColor(),
          createdAt: new Date(team.createdAt).toISOString().split("T")[0]
        }))
      );
      setAvailableTeams(
        otherTeams.map(team => ({
          ...team,
          memberCount: team.members.length,
          projectCount: team.projects?.length || 0,
          avatar: team.name.substring(0, 2).toUpperCase(),
          color: getRandomColor(),
          isPublic: team.isPublic || false,
          tags: team.tags || []
        }))
      );
      setPendingRequests([]);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch detalii echipă
  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await axios.get(`${API_URL}/${teamId}`);
      const team = response.data;
      setTeamDetails(prev => ({
        ...prev,
        [teamId]: {
          members: Array.isArray(team.members)
            ? team.members.map(member => ({
              id: member._id || member.id || member,
              name: typeof member === "object" ? member.name : "Member",
              role: (team.createdBy._id || team.createdBy.id || team.createdBy) === (member._id || member.id || member) ? "admin" : "member",
              avatar: typeof member === "object"
                ? member.name.substring(0, 2).toUpperCase()
                : "ME",
              joinedAt: new Date(team.createdAt).toISOString().split("T")[0]
            }))
            : [],
          projects: team.projects || []
        }
      }));
    } catch (error) {
      console.error("Error fetching team details:", error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchTeams();
    // eslint-disable-next-line
  }, [currentUser?._id, currentUser?.id]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamDetails(selectedTeam);
    }
    // eslint-disable-next-line
  }, [selectedTeam]);

  // Alătură-te la echipă
  const handleJoinTeam = async (teamId) => {
    try {
      const team = availableTeams.find(t => t._id === teamId);
      if (!team) return;
      const userId = currentUser?._id || currentUser?.id;
      if (team.isPublic) {
        await axios.post(`${API_URL}/${teamId}/members`, { userId });
        setMyTeams([
          ...myTeams,
          {
            ...team,
            role: "member",
            createdAt: new Date().toISOString().split("T")[0]
          }
        ]);
        setAvailableTeams(availableTeams.filter(t => t._id !== teamId));
      } else {
        setPendingRequests([...pendingRequests, {
          teamId,
          teamName: team.name,
          status: "pending",
          requestedAt: new Date().toISOString().split("T")[0]
        }]);
      }
    } catch (error) {
      console.error("Error joining team:", error);
    }
  };

  // Creează echipă nouă
 // Înlocuiește funcția handleCreateTeam cu aceasta:
const handleCreateTeam = async () => {
  if (!newTeamName.trim()) {
    alert("Numele echipei nu poate fi gol!");
    return;
  }
  
  // Verificări îmbunătățite pentru user autentificat
  if (!currentUser) {
    alert("Trebuie să fii autentificat pentru a crea o echipă!");
    return;
  }
  
  // Obține ID-ul utilizatorului cu multiple fallback-uri
  const userId = currentUser._id || currentUser.id || currentUser.userId;
  
  if (!userId) {
    console.error("Current user object:", currentUser);
    alert("Nu s-a putut determina ID-ul utilizatorului. Te rog să te autentifici din nou.");
    return;
  }
  
  try {
    const newTeamData = {
      name: newTeamName,
      description: newTeamDescription,
      createdBy: userId,
      isPublic: true
    };
    
    console.log('Current user:', currentUser);
    console.log('User ID:', userId);
    console.log('Payload trimis spre backend:', newTeamData);
    
    const response = await axios.post(API_URL, newTeamData);
    const createdTeam = response.data;
    
    const uiTeam = {
      ...createdTeam,
      memberCount: 1,
      projectCount: 0,
      role: "admin",
      avatar: newTeamName.substring(0, 2).toUpperCase(),
      color: "bg-indigo-500",
      createdAt: new Date(createdTeam.createdAt).toISOString().split("T")[0]
    };
    
    setMyTeams([...myTeams, uiTeam]);
    setNewTeamName("");
    setNewTeamDescription("");
    setShowCreateModal(false);
  } catch (error) {
    if (error.response) {
      console.error("Error creating team:", error.response.data);
      alert("Eroare backend: " + JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error creating team:", error);
      alert("Eroare necunoscută la creare echipă!");
    }
  }
};
  const handleSelectTeam = (teamId) => {
    setSelectedTeam(teamId);
    setShowSidebar(true);
  };

  const filteredAvailableTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Trebuie să fii autentificat pentru a accesa echipele.</p>
          <a href="/login" className="text-blue-600 hover:underline">Mergi la autentificare</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă echipele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Echipe</h1>
            <p className="text-sm text-gray-600">Gestionează echipele tale</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Echipe</h1>
                <p className="text-gray-600">Gestionează echipele și colaborează cu alți developeri</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Creează Echipă
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 lg:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("my-teams")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "my-teams"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="hidden sm:inline">Echipele Mele </span>
                  <span className="sm:hidden">Mele </span>
                  ({myTeams.length})
                </button>
                <button
                  onClick={() => setActiveTab("available")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "available"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="hidden sm:inline">Echipe Disponibile </span>
                  <span className="sm:hidden">Disponibile </span>
                  ({availableTeams.length})
                </button>
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "requests"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="hidden sm:inline">Cereri Pending </span>
                  <span className="sm:hidden">Cereri </span>
                  ({pendingRequests.length})
                </button>
              </nav>
            </div>
          </div>
          {/* Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-2">
              {/* My Teams Tab */}
              {activeTab === "my-teams" && (
                <div className="space-y-4">
                  {myTeams.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <Users className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm lg:text-base">Nu faci parte din nicio echipă încă</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Creează o echipă
                      </button>
                    </div>
                  ) : (
                    myTeams.map(team => (
                      <div key={team._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3 lg:gap-4 flex-1">
                            <div className={`w-10 h-10 lg:w-12 lg:h-12 ${team.color} rounded-lg flex items-center justify-center text-white font-bold text-sm lg:text-base flex-shrink-0`}>
                              {team.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{team.name}</h3>
                              <p className="text-gray-600 text-sm line-clamp-2 lg:line-clamp-none">{team.description}</p>
                              <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-2">
                                <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                  <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                                  {team.memberCount} membri
                                </span>
                                <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                  <Code className="w-3 h-3 lg:w-4 lg:h-4" />
                                  {team.projectCount} proiecte
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  team.role === "admin"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {team.role === "admin" ? "Admin" : "Membru"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start">
                            <button
                              onClick={() => handleSelectTeam(team._id)}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {team.role === "admin" && (
                              <button className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <Settings className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* Available Teams Tab */}
              {activeTab === "available" && (
                <div>
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                      <input
                        type="text"
                        placeholder="Caută echipe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredAvailableTeams.length === 0 ? (
                      <div className="text-center py-8 lg:py-12">
                        <Users className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm lg:text-base">
                          {searchTerm ? "Nu s-au găsit echipe care să se potrivească cu căutarea" : "Nu există echipe disponibile"}
                        </p>
                      </div>
                    ) : (
                      filteredAvailableTeams.map(team => (
                        <div key={team._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex items-start gap-3 lg:gap-4 flex-1">
                              <div className={`w-10 h-10 lg:w-12 lg:h-12 ${team.color} rounded-lg flex items-center justify-center text-white font-bold text-sm lg:text-base flex-shrink-0`}>
                                {team.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">{team.name}</h3>
                                  {!team.isPublic && (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                      Privată
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm line-clamp-2 lg:line-clamp-none mb-2">{team.description}</p>
                                <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-2">
                                  <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                                    {team.memberCount} membri
                                  </span>
                                  <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                    <Code className="w-3 h-3 lg:w-4 lg:h-4" />
                                    {team.projectCount} proiecte
                                  </span>
                                </div>
                                {team.tags && team.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {team.tags.map(tag => (
                                      <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleJoinTeam(team._id)}
                              disabled={pendingRequests.some(req => req.teamId === team._id)}
                              className={`px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm lg:text-base whitespace-nowrap ${
                                pendingRequests.some(req => req.teamId === team._id)
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              <UserPlus className="w-3 h-3 lg:w-4 lg:h-4" />
                              <span className="hidden sm:inline">
                                {pendingRequests.some(req => req.teamId === team._id)
                                  ? "Cerere Trimisă"
                                  : team.isPublic ? "Alătură-te" : "Solicită Acces"
                                }
                              </span>
                              <span className="sm:hidden">
                                {pendingRequests.some(req => req.teamId === team._id)
                                  ? "Trimisă"
                                  : team.isPublic ? "Alătură" : "Solicită"
                                }
                              </span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* Pending Requests Tab */}
              {activeTab === "requests" && (
                <div className="space-y-4">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <Clock className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm lg:text-base">Nu ai cereri în așteptare</p>
                    </div>
                  ) : (
                    pendingRequests.map((request, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900">{request.teamName}</h3>
                            <p className="text-sm text-gray-600">
                              Cerere trimisă pe {new Date(request.requestedAt).toLocaleDateString("ro-RO")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                              În așteptare
                            </span>
                            <button
                              onClick={() => {
                                setPendingRequests(pendingRequests.filter((_, i) => i !== index));
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Sidebar Detalii - doar desktop */}
            <div className="hidden xl:block xl:col-span-1">
              {selectedTeam && teamDetails[selectedTeam] ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Detalii Echipă</h3>
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Team Info */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 ${myTeams.find(t => t._id === selectedTeam)?.color || "bg-blue-500"} rounded-lg flex items-center justify-center text-white font-bold`}>
                        {myTeams.find(t => t._id === selectedTeam)?.avatar || "TM"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {myTeams.find(t => t._id === selectedTeam)?.name || "Team"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {myTeams.find(t => t._id === selectedTeam)?.role === "admin" ? "Administrator" : "Membru"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Members */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Membri ({teamDetails[selectedTeam].members.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {teamDetails[selectedTeam].members.map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(member.joinedAt).toLocaleDateString("ro-RO")}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.role === "admin"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {member.role === "admin" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Projects */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Proiecte ({teamDetails[selectedTeam].projects.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {teamDetails[selectedTeam].projects.length > 0 ? (
                        teamDetails[selectedTeam].projects.map(project => (
                          <div key={project.id} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 text-sm">{project.name}</h5>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-wrap gap-1">
                                {project.tech && project.tech.map(tech => (
                                  <span key={tech} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                project.status === "active" ? "bg-green-100 text-green-800" :
                                project.status === "completed" ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nu există proiecte în această echipă</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Selectează o echipă pentru a vedea detaliile</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Sidebar Overlay */}
      {showSidebar && selectedTeam && teamDetails[selectedTeam] && (
        <div className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-lg overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Detalii Echipă</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Team Info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${myTeams.find(t => t._id === selectedTeam)?.color || "bg-blue-500"} rounded-lg flex items-center justify-center text-white font-bold`}>
                    {myTeams.find(t => t._id === selectedTeam)?.avatar || "TM"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {myTeams.find(t => t._id === selectedTeam)?.name || "Team"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {myTeams.find(t => t._id === selectedTeam)?.role === "admin" ? "Administrator" : "Membru"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Members */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Membri ({teamDetails[selectedTeam].members.length})
                </h4>
                <div className="space-y-2">
                  {teamDetails[selectedTeam].members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(member.joinedAt).toLocaleDateString("ro-RO")}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.role === "admin"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {member.role === "admin" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Projects */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Proiecte ({teamDetails[selectedTeam].projects.length})</h4>
                <div className="space-y-2">
                  {teamDetails[selectedTeam].projects.length > 0 ? (
                    teamDetails[selectedTeam].projects.map(project => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 text-sm">{project.name}</h5>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex flex-wrap gap-1">
                            {project.tech && project.tech.map(tech => (
                              <span key={tech} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs self-start ${
                            project.status === "active" ? "bg-green-100 text-green-800" :
                            project.status === "completed" ? "bg-blue-100 text-blue-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nu există proiecte în această echipă</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 lg:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Creează Echipă Nouă</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Echipă <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  placeholder="Ex: Frontend Masters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descriere
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  rows="3"
                  placeholder="Descriere scurtă a echipei..."
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm lg:text-base"
                >
                  Anulează
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                    !newTeamName.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Creează Echipa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;