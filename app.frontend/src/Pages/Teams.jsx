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
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);

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

  // Helper pentru a obține datele echipei pentru afișare
  const getTeamDisplayData = (teamId) => {
    const teamFromMyTeams = myTeams.find(t => t._id === teamId);
    const teamFromAvailable = availableTeams.find(t => t._id === teamId);
    const team = teamFromMyTeams || teamFromAvailable;
    
    if (!team) return null;
    
    return {
      name: team.name,
      description: team.description,
      color: team.color,
      avatar: team.avatar,
      role: team.role || "member",
      memberCount: team.memberCount,
      projectCount: team.projectCount
    };
  };

  // Debug useEffect pentru currentUser
  useEffect(() => {
    console.log("Current user in Teams component:", currentUser);
    if (currentUser) {
      console.log("User ID variants:", {
        _id: currentUser._id,
        id: currentUser.id,
        userId: currentUser.userId
      });
    }
  }, [currentUser]);

  // Fetch toate echipele
  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      const allTeams = response.data;
      const myId = currentUser?._id || currentUser?.id || currentUser?.userId;
      
      console.log("All teams:", allTeams);
      console.log("My ID:", myId);
      
      // Filtrare echipe proprii și disponibile
      const userTeams = allTeams.filter(team => {
        // Verifică dacă utilizatorul este în lista de membri
        const isMember = team.members.some(member => {
          const memberId = member._id || member.id || member;
          return memberId === myId;
        });
        
        // Sau dacă utilizatorul este creator-ul echipei
        const isCreator = (team.createdBy?._id || team.createdBy?.id || team.createdBy) === myId;
        
        return isMember || isCreator;
      });
      
      const otherTeams = allTeams.filter(team => {
        const isMember = team.members.some(member => {
          const memberId = member._id || member.id || member;
          return memberId === myId;
        });
        const isCreator = (team.createdBy?._id || team.createdBy?.id || team.createdBy) === myId;
        
        return !isMember && !isCreator;
      });
      
      console.log("User teams:", userTeams);
      console.log("Other teams:", otherTeams);
      
      setMyTeams(
        userTeams.map(team => ({
          ...team,
          memberCount: team.members.length,
          projectCount: team.projects?.length || 0,
          role:(team.createdBy?._id || team.createdBy?.id || team.createdBy) === myId ? "admin" : "member",
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
          isPublic: team.isPublic !== false, // Default la true dacă nu e specificat
          tags: team.tags || []
        }))
      );
      
      setPendingRequests([]);
    } catch (error) {
      console.error("Error fetching teams:", error);
      alert("Eroare la încărcarea echipelor!");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch detalii echipă - versiunea reparată
  const fetchTeamDetails = async (teamId) => {
    setLoadingTeamDetails(true);
    try {
      console.log(`Fetching team details for ID: ${teamId}`);
      const response = await axios.get(`${API_URL}/${teamId}`);
      console.log('Team details response:', response.data);
      
      const team = response.data;
      
      // Verifică dacă răspunsul e valid
      if (!team) {
        console.error('No team data received');
        // Setează detalii goale pentru a afișa măcar ceva
        setTeamDetails(prev => ({
          ...prev,
          [teamId]: {
            members: [],
            projects: []
          }
        }));
        return;
      }
      
      // Procesează membrii cu error handling îmbunătățit
      const processedMembers = Array.isArray(team.members)
        ? team.members.map((member, index) => {
            // Handle different member object structures
            const memberObj = typeof member === 'object' ? member : { _id: member };
            const memberId = memberObj._id || memberObj.id || member;
            const memberName = memberObj.name || memberObj.username || memberObj.email || `User ${index + 1}`;
            
            return {
              id: memberId,
              name: memberName,
              role: (team.createdBy?._id || team.createdBy?.id || team.createdBy) === memberId ? "admin" : "member",
              avatar: memberName.length >= 2 ? 
                      memberName.substring(0, 2).toUpperCase() : 
                      "U" + (index + 1),
              joinedAt: memberObj.joinedAt || team.createdAt || new Date().toISOString()
            };
          })
        : [];

      // Procesează proiectele
      const processedProjects = Array.isArray(team.projects)
        ? team.projects.map((project, index) => ({
            id: project._id || project.id || `project-${index}`,
            name: project.name || `Project ${index + 1}`,
            status: project.status || "active",
            tech: Array.isArray(project.tech) ? project.tech : [],
            description: project.description || ""
          }))
        : [];
      
      setTeamDetails(prev => ({
        ...prev,
        [teamId]: {
          members: processedMembers,
          projects: processedProjects
        }
      }));
      
      console.log('Processed team details:', {
        members: processedMembers,
        projects: processedProjects
      });
      
    } catch (error) {
      console.error("Error fetching team details:", error);
      // În caz de eroare, setează detalii goale dar cu structura corectă
      setTeamDetails(prev => ({
        ...prev,
        [teamId]: {
          members: [],
          projects: []
        }
      }));
      
      // Poți să afișezi un mesaj de eroare sau să folosești datele deja disponibile
      alert("Nu s-au putut încărca detaliile echipei. Se vor folosi informațiile de bază.");
    } finally {
      setLoadingTeamDetails(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchTeams();
    // eslint-disable-next-line
  }, [currentUser?._id, currentUser?.id, currentUser?.userId]);

  // Funcție îmbunătățită pentru selectarea echipei
  const handleSelectTeam = async (teamId) => {
    console.log("Selecting team:", teamId);
    setSelectedTeam(teamId);
    setShowSidebar(true);
    
    // Verifică dacă deja avem detaliile pentru această echipă
    if (!teamDetails[teamId]) {
      await fetchTeamDetails(teamId);
    }
  };

  // Alătură-te la echipă - versiunea îmbunătățită
  const handleJoinTeam = async (teamId) => {
    try {
      const team = availableTeams.find(t => t._id === teamId);
      if (!team) {
        alert("Echipa nu a fost găsită!");
        return;
      }
      
      const userId = currentUser?._id || currentUser?.id || currentUser?.userId;
      if (!userId) {
        alert("Nu s-a putut determina ID-ul utilizatorului!");
        return;
      }
      
      console.log("Joining team:", teamId, "with user:", userId);
      
      if (team.isPublic) {
        // Pentru echipe publice - alătură-te direct
        const response = await axios.post(`${API_URL}/${teamId}/members`, { 
          userId: userId 
        });
        
        console.log("Join response:", response.data);
        
        // Creează obiectul echipei pentru UI
        const joinedTeam = {
          ...team,
          role: "member",
          createdAt: new Date().toISOString().split("T")[0],
          memberCount: team.memberCount + 1 // Incrementează numărul de membri
        };
        
        // Adaugă echipa la "Echipele Mele"
        setMyTeams(prevTeams => [...prevTeams, joinedTeam]);
        
        // Elimină echipa din "Echipe Disponibile"
        setAvailableTeams(prevTeams => prevTeams.filter(t => t._id !== teamId));
        
        // Schimbă automat tab-ul la "Echipele Mele"
        setActiveTab("my-teams");
        
        alert(`Te-ai alăturat cu succes echipei "${team.name}"!`);
        
      } else {
        // Pentru echipe private - trimite cerere
        await axios.post(`${API_URL}/${teamId}/requests`, { 
          userId: userId 
        });
        
        // Adaugă cererea la lista de cereri pending
        const newRequest = {
          teamId,
          teamName: team.name,
          status: "pending",
          requestedAt: new Date().toISOString().split("T")[0]
        };
        
        setPendingRequests(prevRequests => [...prevRequests, newRequest]);
        
        alert(`Cererea de alăturare la echipa "${team.name}" a fost trimisă!`);
      }
      
    } catch (error) {
      console.error("Error joining team:", error);
      if (error.response) {
        console.error("Backend error:", error.response.data);
        alert(`Eroare la alăturarea în echipă: ${error.response.data.message || 'Eroare necunoscută'}`);
      } else {
        alert("Eroare de conexiune la server!");
      }
    }
  };

  // Creează echipă nouă - versiunea îmbunătățită
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Numele echipei nu poate fi gol!");
      return;
    }
    
    if (!currentUser) {
      alert("Trebuie să fii autentificat pentru a crea o echipă!");
      return;
    }
    
    const userId = currentUser._id || currentUser.id || currentUser.userId;
    
    if (!userId) {
      console.error("Current user object:", currentUser);
      alert("Nu s-a putut determina ID-ul utilizatorului!");
      return;
    }
    
    try {
      const newTeamData = {
        name: newTeamName,
        description: newTeamDescription,
        createdBy: userId,
        isPublic: true
      };
      
      console.log('Creating team with data:', newTeamData);
      
      const response = await axios.post(API_URL, newTeamData);
      const createdTeam = response.data;
      
      console.log('Created team response:', createdTeam);
      
      const uiTeam = {
        ...createdTeam,
        memberCount: 1,
        projectCount: 0,
        role: "admin",
        avatar: newTeamName.substring(0, 2).toUpperCase(),
        color: "bg-indigo-500",
        createdAt: new Date(createdTeam.createdAt).toISOString().split("T")[0]
      };
      
      setMyTeams(prevTeams => [...prevTeams, uiTeam]);
      setNewTeamName("");
      setNewTeamDescription("");
      setShowCreateModal(false);
      
      alert(`Echipa "${newTeamName}" a fost creată cu succes!`);
      
    } catch (error) {
      console.error("Error creating team:", error);
      if (error.response) {
        alert(`Eroare backend: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else {
        alert("Eroare necunoscută la creare echipă!");
      }
    }
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
                <p className="text-gray-600">Descoperă echipele disponibile și alătură-te lor</p>
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
            {/* Sidebar Detalii - desktop - versiunea reparată */}
            <div className="hidden xl:block xl:col-span-1">
              {selectedTeam ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Detalii Echipă</h3>
                    <button
                      onClick={() => {
                        setSelectedTeam(null);
                        setShowSidebar(false);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {loadingTeamDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Se încarcă detaliile...</p>
                    </div>
                  ) : (
                    <>
                      {/* Team Info */}
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          {(() => {
                            const teamDisplayData = getTeamDisplayData(selectedTeam);
                            return teamDisplayData ? (
                              <>
                                <div className={`w-10 h-10 ${teamDisplayData.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                                  {teamDisplayData.avatar}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{teamDisplayData.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {teamDisplayData.role === "admin" ? "Administrator" : "Membru"}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-white font-bold">
                                  TM
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Echipă</h4>
                                  <p className="text-sm text-gray-600">Membru</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Members */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Membri ({teamDetails[selectedTeam]?.members?.length || 0})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {teamDetails[selectedTeam]?.members?.length > 0 ? (
                            teamDetails[selectedTeam].members.map(member => (
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
                                <span className={`px-2 py-1 rounded text-xs flex items-center ${
                                  member.role === "admin"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {member.role === "admin" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">Nu s-au putut încărca membrii</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Projects */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Proiecte ({teamDetails[selectedTeam]?.projects?.length || 0})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {teamDetails[selectedTeam]?.projects?.length > 0 ? (
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
                    </>
                  )}
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
      
      {/* Mobile Sidebar Overlay - versiunea reparată */}
      {showSidebar && selectedTeam && (
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
              
              {loadingTeamDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Se încarcă detaliile...</p>
                </div>
              ) : (
                <>
                  {/* Team Info */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const teamDisplayData = getTeamDisplayData(selectedTeam);
                        return teamDisplayData ? (
                          <>
                            <div className={`w-10 h-10 ${teamDisplayData.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                              {teamDisplayData.avatar}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{teamDisplayData.name}</h4>
                              <p className="text-sm text-gray-600">
                                {teamDisplayData.role === "admin" ? "Administrator" : "Membru"}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-white font-bold">
                              TM
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Echipă</h4>
                              <p className="text-sm text-gray-600">Membru</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Members */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Membri ({teamDetails[selectedTeam]?.members?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {teamDetails[selectedTeam]?.members?.length > 0 ? (
                        teamDetails[selectedTeam].members.map(member => (
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
                            <span className={`px-2 py-1 rounded text-xs flex items-center ${
                              member.role === "admin"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}>
                              {member.role === "admin" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nu s-au putut încărca membrii</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Projects */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Proiecte ({teamDetails[selectedTeam]?.projects?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {teamDetails[selectedTeam]?.projects?.length > 0 ? (
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
                </>
              )}
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