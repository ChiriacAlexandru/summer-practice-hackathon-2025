import React, { useState, useEffect } from "react";
import {
  Code, Plus, Search, Settings, Eye, Edit, Trash2, 
  Tag, Calendar, User, Users, Github, ExternalLink, X, Clock
} from "lucide-react";
import axios from "axios";
import { getCurrentUser } from "../utils/auth";

const API_URL = "http://localhost:3000/api/projects";
const TEAMS_API_URL = "http://localhost:3000/api/teams";

const Projects = () => {
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState("my-projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);

  // Project form state
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    codeUrl: "",
    teamId: "",
    tags: []
  });
  const [newTag, setNewTag] = useState("");

  // Data state
  const [myProjects, setMyProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [availableTags, setAvailableTags] = useState([]);

  // Helper pentru culori random
  const getRandomColor = () => {
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-green-500",
      "bg-orange-500", "bg-red-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Helper pentru a verifica dacă utilizatorul este membru al unei echipe
  const isUserTeamMember = (teamId) => {
    if (!teamId || !myTeams.length) return false;
    const myId = currentUser?._id || currentUser?.id || currentUser?.userId;
    
    return myTeams.some(team => {
      const teamIdToCheck = team._id || team.id;
      if (teamIdToCheck !== teamId) return false;
      
      // Verifică dacă este membru
      const isMember = team.members.some(member => {
        const memberId = member._id || member.id || member;
        return memberId === myId;
      });
      
      // Verifică dacă este creator
      const isCreator = (team.createdBy?._id || team.createdBy?.id || team.createdBy) === myId;
      
      return isMember || isCreator;
    });
  };

  // Helper pentru a verifica dacă un proiect aparține utilizatorului (direct sau prin echipă)
  const isProjectMine = (project) => {
    const myId = currentUser?._id || currentUser?.id || currentUser?.userId;
    
    // Verifică dacă este creator direct
    const isDirectOwner = (project.createdBy?._id || project.createdBy?.id || project.createdBy) === myId;
    
    // Verifică dacă aparține unei echipe din care face parte
    const isTeamProject = project.teamId && isUserTeamMember(project.teamId._id || project.teamId);
    
    return isDirectOwner || isTeamProject;
  };

  // Helper pentru a obține datele proiectului pentru afișare
  const getProjectDisplayData = (projectId) => {
    const projectFromMy = myProjects.find(p => p._id === projectId);
    const projectFromAll = allProjects.find(p => p._id === projectId);
    const project = projectFromMy || projectFromAll;
    
    if (!project) return null;
    
    return {
      title: project.title,
      description: project.description,
      codeUrl: project.codeUrl,
      tags: project.tags || [],
      createdBy: project.createdBy,
      teamId: project.teamId,
      teamName: project.teamName,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      isOwner: project.isOwner,
      isDirectOwner: project.isDirectOwner,
      isTeamProject: project.isTeamProject
    };
  };

  // Fetch echipele utilizatorului
  const fetchMyTeams = async () => {
    try {
      const response = await axios.get(TEAMS_API_URL);
      const allTeams = response.data;
      const myId = currentUser?._id || currentUser?.id || currentUser?.userId;
      
      const userTeams = allTeams.filter(team => {
        const isMember = team.members.some(member => {
          const memberId = member._id || member.id || member;
          return memberId === myId;
        });
        const isCreator = (team.createdBy?._id || team.createdBy?.id || team.createdBy) === myId;
        return isMember || isCreator;
      });
      
      setMyTeams(userTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  // Fetch toate proiectele
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      
      const response = await axios.get(API_URL, { params });
      const projects = response.data;
      const myId = currentUser?._id || currentUser?.id || currentUser?.userId;
      
      console.log("All projects:", projects);
      console.log("My ID:", myId);
      console.log("My teams:", myTeams);
      
      // Procesează proiectele pentru UI
      const processedProjects = projects.map(project => {
        const isDirectOwner = (project.createdBy?._id || project.createdBy?.id || project.createdBy) === myId;
        const isTeamProject = project.teamId && isUserTeamMember(project.teamId._id || project.teamId);
        const isMine = isDirectOwner || isTeamProject;
        
        return {
          ...project,
          isOwner: isMine,
          isDirectOwner: isDirectOwner,
          isTeamProject: isTeamProject,
          teamName: project.teamId?.name || null,
          creatorName: project.createdBy?.name || project.createdBy?.username || "Utilizator necunoscut",
          color: getRandomColor(),
          createdAt: new Date(project.createdAt).toISOString().split("T")[0],
          updatedAt: new Date(project.updatedAt).toISOString().split("T")[0]
        };
      });
      
      // Separă proiectele proprii (incluzând cele din echipe) de toate proiectele
      const userProjects = processedProjects.filter(project => project.isOwner);
      
      setMyProjects(userProjects);
      setAllProjects(processedProjects);
      
      // Extrage toate tag-urile disponibile
      const allTags = [...new Set(projects.flatMap(p => p.tags || []))];
      setAvailableTags(allTags);
      
    } catch (error) {
      console.error("Error fetching projects:", error);
      alert("Eroare la încărcarea proiectelor!");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch detalii proiect
  const fetchProjectDetails = async (projectId) => {
    setLoadingProjectDetails(true);
    try {
      console.log(`Fetching project details for ID: ${projectId}`);
      const response = await axios.get(`${API_URL}/${projectId}`);
      console.log('Project details response:', response.data);
      
      const project = response.data;
      
      if (!project) {
        console.error('No project data received');
        setProjectDetails(prev => ({
          ...prev,
          [projectId]: {
            comments: [],
            suggestions: []
          }
        }));
        return;
      }
      
      // Procesează comentariile și sugestiile (dacă există)
      const processedComments = Array.isArray(project.comments)
        ? project.comments.map((comment, index) => ({
            id: comment._id || comment.id || `comment-${index}`,
            text: comment.text || comment.content || "",
            author: comment.author?.name || comment.author?.username || "Utilizator necunoscut",
            createdAt: comment.createdAt || new Date().toISOString()
          }))
        : [];

      const processedSuggestions = Array.isArray(project.suggestions)
        ? project.suggestions.map((suggestion, index) => ({
            id: suggestion._id || suggestion.id || `suggestion-${index}`,
            text: suggestion.text || suggestion.content || "",
            author: suggestion.author?.name || suggestion.author?.username || "Utilizator necunoscut",
            createdAt: suggestion.createdAt || new Date().toISOString()
          }))
        : [];
      
      setProjectDetails(prev => ({
        ...prev,
        [projectId]: {
          comments: processedComments,
          suggestions: processedSuggestions
        }
      }));
      
    } catch (error) {
      console.error("Error fetching project details:", error);
      setProjectDetails(prev => ({
        ...prev,
        [projectId]: {
          comments: [],
          suggestions: []
        }
      }));
    } finally {
      setLoadingProjectDetails(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchMyTeams();
  }, [currentUser?._id, currentUser?.id, currentUser?.userId]);

  useEffect(() => {
    if (!currentUser || myTeams.length === 0) return;
    fetchProjects();
    // eslint-disable-next-line
  }, [currentUser?._id, currentUser?.id, currentUser?.userId, selectedTags, myTeams]);

  // Funcție pentru selectarea proiectului
  const handleSelectProject = async (projectId) => {
    console.log("Selecting project:", projectId);
    setSelectedProject(projectId);
    setShowSidebar(true);
    
    if (!projectDetails[projectId]) {
      await fetchProjectDetails(projectId);
    }
  };

  // Creează proiect nou
  const handleCreateProject = async () => {
    if (!projectForm.title.trim() || !projectForm.codeUrl.trim()) {
      alert("Titlul și URL-ul codului sunt obligatorii!");
      return;
    }
    
    if (!currentUser) {
      alert("Trebuie să fii autentificat pentru a crea un proiect!");
      return;
    }
    
    const userId = currentUser._id || currentUser.id || currentUser.userId;
    
    if (!userId) {
      alert("Nu s-a putut determina ID-ul utilizatorului!");
      return;
    }
    
    try {
      const newProjectData = {
        title: projectForm.title,
        description: projectForm.description,
        codeUrl: projectForm.codeUrl,
        createdBy: userId,
        teamId: projectForm.teamId || null,
        tags: projectForm.tags
      };
      
      console.log('Creating project with data:', newProjectData);
      
      const response = await axios.post(API_URL, newProjectData);
      const createdProject = response.data;
      
      console.log('Created project response:', createdProject);
      
      // Actualizează state-ul local
      await fetchProjects();
      
      // Reset form
      setProjectForm({
        title: "",
        description: "",
        codeUrl: "",
        teamId: "",
        tags: []
      });
      setShowCreateModal(false);
      
      alert(`Proiectul "${projectForm.title}" a fost creat cu succes!`);
      
    } catch (error) {
      console.error("Error creating project:", error);
      if (error.response) {
        alert(`Eroare backend: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else {
        alert("Eroare necunoscută la crearea proiectului!");
      }
    }
  };

  // Editează proiect
  const handleEditProject = async () => {
    if (!projectForm.title.trim() || !projectForm.codeUrl.trim()) {
      alert("Titlul și URL-ul codului sunt obligatorii!");
      return;
    }
    
    try {
      const updateData = {
        title: projectForm.title,
        description: projectForm.description,
        codeUrl: projectForm.codeUrl,
        teamId: projectForm.teamId || null,
        tags: projectForm.tags
      };
      
      const response = await axios.put(`${API_URL}/${selectedProject}`, updateData);
      console.log('Updated project response:', response.data);
      
      // Actualizează state-ul local
      await fetchProjects();
      
      setShowEditModal(false);
      setSelectedProject(null);
      setShowSidebar(false);
      
      alert(`Proiectul "${projectForm.title}" a fost actualizat cu succes!`);
      
    } catch (error) {
      console.error("Error updating project:", error);
      if (error.response) {
        alert(`Eroare backend: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else {
        alert("Eroare necunoscută la actualizarea proiectului!");
      }
    }
  };

  // Șterge proiect
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Ești sigur că vrei să ștergi acest proiect?")) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/${projectId}`);
      
      // Actualizează state-ul local
      await fetchProjects();
      
      if (selectedProject === projectId) {
        setSelectedProject(null);
        setShowSidebar(false);
      }
      
      alert("Proiectul a fost șters cu succes!");
      
    } catch (error) {
      console.error("Error deleting project:", error);
      if (error.response) {
        alert(`Eroare backend: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else {
        alert("Eroare necunoscută la ștergerea proiectului!");
      }
    }
  };

  // Funcții pentru gestionarea tag-urilor
  const addTag = () => {
    if (newTag.trim() && !projectForm.tags.includes(newTag.trim())) {
      setProjectForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setProjectForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const openEditModal = (project) => {
    setProjectForm({
      title: project.title,
      description: project.description || "",
      codeUrl: project.codeUrl,
      teamId: project.teamId?._id || project.teamId || "",
      tags: project.tags || []
    });
    setShowEditModal(true);
  };

  // Filtrare proiecte
  const filteredMyProjects = myProjects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredAllProjects = allProjects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Trebuie să fii autentificat pentru a accesa proiectele.</p>
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
          <p className="mt-4 text-gray-600">Se încarcă proiectele...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Proiecte</h1>
            <p className="text-sm text-gray-600">Gestionează proiectele tale</p>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Proiecte</h1>
                <p className="text-gray-600">Descoperă și partajează proiecte creative</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Creează Proiect
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                  <input
                    type="text"
                    placeholder="Caută proiecte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Șterge toate filtrele
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 lg:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("my-projects")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "my-projects"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="hidden sm:inline">Proiectele Mele </span>
                  <span className="sm:hidden">Mele </span>
                  ({myProjects.length})
                </button>
                <button
                  onClick={() => setActiveTab("all-projects")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "all-projects"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="hidden sm:inline">Toate Proiectele </span>
                  <span className="sm:hidden">Toate </span>
                  ({allProjects.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-2">
              {/* My Projects Tab */}
              {activeTab === "my-projects" && (
                <div className="space-y-4">
                  {filteredMyProjects.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <Code className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm lg:text-base">
                        {searchTerm || selectedTags.length > 0 
                          ? "Nu s-au găsit proiecte care să se potrivească cu criteriile"
                          : "Nu ai creat încă niciun proiect și nu faci parte din echipe cu proiecte"
                        }
                      </p>
                      {!searchTerm && selectedTags.length === 0 && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Creează primul proiect
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredMyProjects.map(project => (
                      <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
                                  {project.title}
                                </h3>
                                {/* Indicator pentru tipul de proiect */}
                                <div className="flex items-center gap-2 mt-1">
                                  {project.isDirectOwner && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Creat de mine
                                    </span>
                                  )}
                                  {project.isTeamProject && !project.isDirectOwner && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Proiect echipă
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleSelectProject(project._id)}
                                  className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {/* Doar creatorii direcți pot edita și șterge */}
                                {project.isDirectOwner && (
                                  <>
                                    <button
                                      onClick={() => openEditModal(project)}
                                      className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-50 rounded transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProject(project._id)}
                                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {project.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 lg:line-clamp-none mb-2">
                                {project.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-2">
                              <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3 lg:w-4 lg:h-4" />
                                {project.creatorName}
                              </span>
                              <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                                {project.createdAt}
                              </span>
                              {project.teamName && (
                                <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                  <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                                  {project.teamName}
                                </span>
                              )}
                              <a
                                href={project.codeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs lg:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Github className="w-3 h-3 lg:w-4 lg:h-4" />
                                Cod
                              </a>
                            </div>

                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {project.tags.map(tag => (
                                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* All Projects Tab */}
              {activeTab === "all-projects" && (
                <div className="space-y-4">
                  {filteredAllProjects.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <Code className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm lg:text-base">
                        {searchTerm || selectedTags.length > 0 
                          ? "Nu s-au găsit proiecte care să se potrivească cu criteriile"
                          : "Nu există proiecte disponibile"
                        }
                      </p>
                    </div>
                  ) : (
                    filteredAllProjects.map(project => (
                      <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-base lg:text-lg font-semibold text-gray-900 flex-1">
                                {project.title}
                              </h3>
                              <button
                                onClick={() => handleSelectProject(project._id)}
                                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors ml-4"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {project.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 lg:line-clamp-none mb-2">
                                {project.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-2">
                              <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3 lg:w-4 lg:h-4" />
                                {project.creatorName}
                              </span>
                              <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                                {project.createdAt}
                              </span>
                              {project.teamName && (
                                <span className="text-xs lg:text-sm text-gray-500 flex items-center gap-1">
                                  <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                                  {project.teamName}
                                </span>
                              )}
                              <a
                                href={project.codeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs lg:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4" />
                                Vezi Cod
                              </a>
                            </div>

                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {project.tags.map(tag => (
                                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Detalii - desktop */}
            <div className="hidden xl:block xl:col-span-1">
              {selectedProject ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Detalii Proiect</h3>
                    <button
                      onClick={() => {
                        setSelectedProject(null);
                        setShowSidebar(false);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {loadingProjectDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Se încarcă...</p>
                    </div>
                  ) : (
                    (() => {
                      const projectData = getProjectDisplayData(selectedProject);
                      const details = projectDetails[selectedProject] || { comments: [], suggestions: [] };
                      
                      if (!projectData) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-gray-500">Proiectul nu a fost găsit</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          {/* Info de bază */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{projectData.title}</h4>
                            {projectData.description && (
                              <p className="text-gray-600 text-sm mb-4">{projectData.description}</p>
                            )}
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>Creat: {projectData.createdAt}</span>
                              </div>
                              {projectData.teamName && (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Users className="w-4 h-4" />
                                  <span>Echipa: {projectData.teamName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <a
                                  href={projectData.codeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Github className="w-4 h-4" />
                                  Vezi Codul
                                </a>
                              </div>
                            </div>

                            {projectData.tags && projectData.tags.length > 0 && (
                              <div className="mt-4">
                                <div className="flex flex-wrap gap-1">
                                  {projectData.tags.map(tag => (
                                    <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Comentarii */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Comentarii ({details.comments.length})
                            </h5>
                            {details.comments.length === 0 ? (
                              <p className="text-gray-500 text-sm">Nu există comentarii încă</p>
                            ) : (
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {details.comments.map(comment => (
                                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {comment.author}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Sugestii */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Sugestii ({details.suggestions.length})
                            </h5>
                            {details.suggestions.length === 0 ? (
                              <p className="text-gray-500 text-sm">Nu există sugestii încă</p>
                            ) : (
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {details.suggestions.map(suggestion => (
                                  <div key={suggestion.id} className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {suggestion.author}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(suggestion.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{suggestion.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center sticky top-6">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selectează un proiect pentru a vedea detaliile</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Detalii */}
      {showSidebar && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detalii Proiect</h3>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setShowSidebar(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-full pb-20">
              {loadingProjectDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Se încarcă...</p>
                </div>
              ) : (
                (() => {
                  const projectData = getProjectDisplayData(selectedProject);
                  const details = projectDetails[selectedProject] || { comments: [], suggestions: [] };
                  
                  if (!projectData) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Proiectul nu a fost găsit</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Info de bază */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{projectData.title}</h4>
                        {projectData.description && (
                          <p className="text-gray-600 text-sm mb-4">{projectData.description}</p>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Creat: {projectData.createdAt}</span>
                          </div>
                          {projectData.teamName && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Users className="w-4 h-4" />
                              <span>Echipa: {projectData.teamName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <a
                              href={projectData.codeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Github className="w-4 h-4" />
                              Vezi Codul
                            </a>
                          </div>
                        </div>

                        {projectData.tags && projectData.tags.length > 0 && (
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-1">
                              {projectData.tags.map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comentarii */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Comentarii ({details.comments.length})
                        </h5>
                        {details.comments.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nu există comentarii încă</p>
                        ) : (
                          <div className="space-y-3">
                            {details.comments.map(comment => (
                              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {comment.author}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sugestii */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Sugestii ({details.suggestions.length})
                        </h5>
                        {details.suggestions.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nu există sugestii încă</p>
                        ) : (
                          <div className="space-y-3">
                            {details.suggestions.map(suggestion => (
                              <div key={suggestion.id} className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {suggestion.author}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(suggestion.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{suggestion.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Creare Proiect */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Creează Proiect Nou</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titlu *
                  </label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Numele proiectului..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descriere
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrierea proiectului..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Cod *
                  </label>
                  <input
                    type="url"
                    value={projectForm.codeUrl}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, codeUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Echipa
                  </label>
                  <select
                    value={projectForm.teamId}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, teamId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selectează o echipă (opțional)</option>
                    {myTeams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag-uri
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adaugă tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  {projectForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {projectForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Creează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editare Proiect */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Editează Proiectul</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titlu *
                  </label>
                  <input
                    type="text"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Numele proiectului..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descriere
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrierea proiectului..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Cod *
                  </label>
                  <input
                    type="url"
                    value={projectForm.codeUrl}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, codeUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Echipa
                  </label>
                  <select
                    value={projectForm.teamId}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, teamId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selectează o echipă (opțional)</option>
                    {myTeams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag-uri
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adaugă tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  {projectForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {projectForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleEditProject}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salvează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;