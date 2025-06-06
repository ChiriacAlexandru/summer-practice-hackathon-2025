import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Github, ExternalLink, Calendar, User, Users, Tag,
  MessageCircle, Lightbulb, Send, Edit, Trash2, Settings,
  Clock, Heart, Share2, BookmarkPlus
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getCurrentUser } from "../utils/auth";

const API_URL = "http://localhost:3000/api/projects";
const COMMENTS_API_URL = "http://localhost:3000/api/comments";

const ProjectView = () => {
  const { projectId } = useParams(); // LĂSAT cum era
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newSuggestion, setNewSuggestion] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

  const canEditProject = () => {
    if (!project || !currentUser) return false;
    return project.createdBy?._id === currentUser.id || 
           project.createdBy?.id === currentUser.id;
  };

  const fetchProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const projectData = response.data;
      
      if (!projectData) {
        throw new Error("Proiectul nu a fost găsit");
      }

      // Procesare sigură a datelor
      const processedProject = {
        ...projectData,
        tags: Array.isArray(projectData.tags) ? projectData.tags : [],
        createdAt: new Date(projectData.createdAt).toLocaleDateString('ro-RO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        updatedAt: new Date(projectData.updatedAt).toLocaleDateString('ro-RO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creatorName: projectData.createdBy?.name || "Utilizator necunoscut",
        teamName: projectData.teamId?.name || null
      };

      setProject(processedProject);
      
      // Încarcă comentariile din noua rută
      await fetchComments();

    } catch (error) {
      console.error("Eroare la obținerea proiectului:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      setError(error.response?.data?.message || "Eroare la încărcarea proiectului");
    } finally {
      setIsLoading(false);
    }
  };

  // NOUĂ - Funcție separată pentru comentarii
  const fetchComments = async () => {
    try {
      console.log("📝 Încărcare comentarii pentru proiectul:", projectId);
      const response = await axios.get(`${COMMENTS_API_URL}/${projectId}`);
      setComments(response.data);
      console.log("✅ Comentarii încărcate:", response.data.length);
    } catch (error) {
      console.error("❌ Eroare la încărcarea comentariilor:", error);
      setComments([]);
    }
  };

  // ACTUALIZAT - Folosește noua rută de comentarii
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      
      console.log("📝 Trimitere comentariu:", {
        projectId,
        content: newComment.trim()
      });

      await axios.post(COMMENTS_API_URL, {
        projectId: projectId,
        content: newComment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reîncarcă comentariile
      await fetchComments();
      setNewComment("");
      console.log("✅ Comentariu adăugat cu succes");
    } catch (error) {
      console.error("❌ Eroare la adăugarea comentariului:", error);
      alert("Eroare la adăugarea comentariului: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    if (!newSuggestion.trim() || isSubmittingSuggestion) return;

    setIsSubmittingSuggestion(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/${projectId}/suggestions`, {
        text: newSuggestion.trim(),
        author: currentUser.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchProject();
      setNewSuggestion("");
    } catch (error) {
      console.error("Eroare la adăugarea sugestiei:", error);
      alert("Eroare la adăugarea sugestiei");
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Sigur doriți să ștergeți acest proiect?")) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/projects");
    } catch (error) {
      console.error("Eroare la ștergerea proiectului:", error);
      alert("Eroare la ștergerea proiectului");
    }
  };

  // NOUĂ - Ștergere comentariu
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Sigur doriți să ștergeți acest comentariu?")) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${COMMENTS_API_URL}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchComments();
      console.log("✅ Comentariu șters cu succes");
    } catch (error) {
      console.error("❌ Eroare la ștergerea comentariului:", error);
      alert("Eroare la ștergerea comentariului: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Trebuie să fii autentificat</p>
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline"
          >
            Autentifică-te
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <div className="text-red-500 mb-4">
            <ExternalLink className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Eroare</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/projects")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Înapoi la proiecte
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Proiectul nu există</p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Înapoi la proiecte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/projects")}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Înapoi
              </button>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {project.title}
                </h1>
                <p className="text-sm text-gray-500">
                  de {project.creatorName} • {project.createdAt}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canEditProject() && (
                <>
                  <button
                    onClick={() => navigate(`/projects/${projectId}/edit`)}
                    className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Editează</span>
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Șterge</span>
                  </button>
                </>
              )}
              <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Partajează</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
              {project.description && (
                <p className="text-gray-700 mb-6">{project.description}</p>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <User className="w-5 h-5 mr-2" />
                  <span>Creator: {project.creatorName}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Creat: {project.createdAt}</span>
                </div>
                {project.teamName && (
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-2" />
                    <span>Echipa: {project.teamName}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>Actualizat: {project.updatedAt}</span>
                </div>
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tag-uri:</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub Link */}
              <div className="border-t border-gray-200 pt-4">
                <a
                  href={project.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Vezi codul pe GitHub
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>

            {/* Comments/Suggestions Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "comments" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Comentarii ({comments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("suggestions")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "suggestions" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    Sugestii ({suggestions.length})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "comments" ? (
                  <div className="space-y-6">
                    <form onSubmit={handleSubmitComment}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Adaugă un comentariu..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isSubmittingComment ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Se trimite...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Trimite comentariu
                          </>
                        )}
                      </button>
                    </form>

                    {comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map(comment => (
                          <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">{comment.authorId?.name || "Anonim"}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('ro-RO')}
                                </span>
                                {currentUser.id === comment.authorId?._id && (
                                  <button
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p>{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        Nu există comentarii încă. Fii primul care adaugă un comentariu!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <form onSubmit={handleSubmitSuggestion}>
                      <textarea
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        placeholder="Adaugă o sugestie..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                      />
                      <button
                        type="submit"
                        disabled={!newSuggestion.trim() || isSubmittingSuggestion}
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
                      >
                        {isSubmittingSuggestion ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Se trimite...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Trimite sugestie
                          </>
                        )}
                      </button>
                    </form>

                    {suggestions.length > 0 ? (
                      <div className="space-y-4">
                        {suggestions.map(suggestion => (
                          <div key={suggestion._id} className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">{suggestion.author?.name || "Anonim"}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(suggestion.createdAt).toLocaleDateString('ro-RO')}
                              </span>
                            </div>
                            <p>{suggestion.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        Nu există sugestii încă. Adaugă prima sugestie!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Statistici</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Comentarii</span>
                  <span className="font-medium">{comments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sugestii</span>
                  <span className="font-medium">{suggestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tag-uri</span>
                  <span className="font-medium">{project.tags.length}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium mb-3">Acțiuni rapide</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Salvează
                  </button>
                  <button className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <Heart className="w-4 h-4 mr-2" />
                    Apreciază
                  </button>
                </div>
              </div>

              {canEditProject() && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-sm font-medium mb-3">Gestionare</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/projects/${projectId}/edit`)}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editează
                    </button>
                    <button className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <Settings className="w-4 h-4 mr-2" />
                      Setări
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;