import React, { useState } from 'react';
import { Users, Plus, Search, Settings, Crown, User, Calendar, Code, Eye, UserPlus, CheckCircle, Clock, X, Menu } from 'lucide-react';

const Teams = () => {
  const [activeTab, setActiveTab] = useState('my-teams');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  // Date simulate
  const currentUser = { id: 1, name: 'Alexandru Chiriac', email: 'chiriac@example.com' };
  
  const [myTeams, setMyTeams] = useState([
    {
      id: 1,
      name: 'Frontend Developers',
      description: 'Echipa dezvoltatorilor frontend specializați în React și Vue',
      memberCount: 8,
      projectCount: 12,
      role: 'admin',
      avatar: 'FD',
      color: 'bg-blue-500',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'UI/UX Team',
      description: 'Designeri focusați pe experiența utilizatorului',
      memberCount: 5,
      projectCount: 7,
      role: 'member',
      avatar: 'UX',
      color: 'bg-purple-500',
      createdAt: '2024-02-20'
    }
  ]);

  const [availableTeams, setAvailableTeams] = useState([
    {
      id: 3,
      name: 'Backend Masters',
      description: 'Specialiști în dezvoltarea serverelor și API-uri',
      memberCount: 15,
      projectCount: 20,
      avatar: 'BM',
      color: 'bg-green-500',
      isPublic: true,
      tags: ['Node.js', 'Python', 'Database']
    },
    {
      id: 4,
      name: 'Mobile Dev Squad',
      description: 'Dezvoltatori de aplicații mobile native și cross-platform',
      memberCount: 10,
      projectCount: 8,
      avatar: 'MD',
      color: 'bg-orange-500',
      isPublic: false,
      tags: ['React Native', 'Flutter', 'iOS']
    },
    {
      id: 5,
      name: 'DevOps Engineers',
      description: 'Automatizare, deployment și infrastructură cloud',
      memberCount: 6,
      projectCount: 15,
      avatar: 'DO',
      color: 'bg-red-500',
      isPublic: true,
      tags: ['Docker', 'AWS', 'CI/CD']
    }
  ]);

  const [pendingRequests, setPendingRequests] = useState([
    { teamId: 4, teamName: 'Mobile Dev Squad', status: 'pending', requestedAt: '2024-12-01' }
  ]);

  const teamDetails = {
    1: {
      members: [
        { id: 1, name: 'Alexandru Chiriac', role: 'admin', avatar: 'AC', joinedAt: '2024-01-15' },
        { id: 2, name: 'Maria Ionescu', role: 'member', avatar: 'MI', joinedAt: '2024-02-01' },
        { id: 3, name: 'Alex Georgescu', role: 'member', avatar: 'AG', joinedAt: '2024-02-15' },
        { id: 4, name: 'Ana Popa', role: 'member', avatar: 'AP', joinedAt: '2024-03-01' }
      ],
      projects: [
        { id: 1, name: 'E-commerce Platform', status: 'active', tech: ['React', 'Node.js'] },
        { id: 2, name: 'Dashboard Analytics', status: 'completed', tech: ['Vue.js', 'Python'] },
        { id: 3, name: 'Mobile App Redesign', status: 'in-progress', tech: ['React Native'] }
      ]
    }
  };

  const handleJoinTeam = (teamId) => {
    const team = availableTeams.find(t => t.id === teamId);
    if (team.isPublic) {
      // Adaugă direct în echipă
      setMyTeams([...myTeams, { ...team, role: 'member', createdAt: new Date().toISOString().split('T')[0] }]);
      setAvailableTeams(availableTeams.filter(t => t.id !== teamId));
    } else {
      // Adaugă cerere de acces
      setPendingRequests([...pendingRequests, {
        teamId: teamId,
        teamName: team.name,
        status: 'pending',
        requestedAt: new Date().toISOString().split('T')[0]
      }]);
    }
  };

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      const newTeam = {
        id: Date.now(),
        name: newTeamName,
        description: newTeamDescription,
        memberCount: 1,
        projectCount: 0,
        role: 'admin',
        avatar: newTeamName.substring(0, 2).toUpperCase(),
        color: 'bg-indigo-500',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setMyTeams([...myTeams, newTeam]);
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateModal(false);
    }
  };

  const handleSelectTeam = (teamId) => {
    setSelectedTeam(teamId);
    setShowSidebar(true);
  };

  const filteredAvailableTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
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
                  onClick={() => setActiveTab('my-teams')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'my-teams'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="hidden sm:inline">Echipele Mele </span>
                  <span className="sm:hidden">Mele </span>
                  ({myTeams.length})
                </button>
                <button
                  onClick={() => setActiveTab('available')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'available'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="hidden sm:inline">Echipe Disponibile </span>
                  <span className="sm:hidden">Disponibile </span>
                  ({availableTeams.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
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
              {activeTab === 'my-teams' && (
                <div className="space-y-4">
                  {myTeams.map(team => (
                    <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
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
                                team.role === 'admin' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {team.role === 'admin' ? 'Admin' : 'Membru'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          <button
                            onClick={() => handleSelectTeam(team.id)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {team.role === 'admin' && (
                            <button className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Teams Tab */}
              {activeTab === 'available' && (
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
                    {filteredAvailableTeams.map(team => (
                      <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
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
                              {team.tags && (
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
                            onClick={() => handleJoinTeam(team.id)}
                            disabled={pendingRequests.some(req => req.teamId === team.id)}
                            className={`px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm lg:text-base whitespace-nowrap ${
                              pendingRequests.some(req => req.teamId === team.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            <UserPlus className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span className="hidden sm:inline">
                              {pendingRequests.some(req => req.teamId === team.id) 
                                ? 'Cerere Trimisă' 
                                : team.isPublic ? 'Alătură-te' : 'Solicită Acces'
                              }
                            </span>
                            <span className="sm:hidden">
                              {pendingRequests.some(req => req.teamId === team.id) 
                                ? 'Trimisă' 
                                : team.isPublic ? 'Alătură' : 'Solicită'
                              }
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Requests Tab */}
              {activeTab === 'requests' && (
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
                              Cerere trimisă pe {new Date(request.requestedAt).toLocaleDateString('ro-RO')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                              În așteptare
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Desktop Sidebar - Team Details */}
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
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        FD
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Frontend Developers</h4>
                        <p className="text-sm text-gray-600">Administrator</p>
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
                                {new Date(member.joinedAt).toLocaleDateString('ro-RO')}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.role === 'admin' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {member.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Proiecte ({teamDetails[selectedTeam].projects.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {teamDetails[selectedTeam].projects.map(project => (
                        <div key={project.id} className="border border-gray-200 rounded-lg p-3">
                          <h5 className="font-medium text-gray-900 text-sm">{project.name}</h5>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-wrap gap-1">
                              {project.tech.map(tech => (
                                <span key={tech} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              project.status === 'active' ? 'bg-green-100 text-green-800' :
                              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                        </div>
                      ))}
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
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    FD
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Frontend Developers</h4>
                    <p className="text-sm text-gray-600">Administrator</p>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Membri ({teamDetails[selectedTeam].members.length})</h4>
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
                            {new Date(member.joinedAt).toLocaleDateString('ro-RO')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.role === 'admin' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {member.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Proiecte ({teamDetails[selectedTeam].projects.length})</h4>
                <div className="space-y-2">
                  {teamDetails[selectedTeam].projects.map(project => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 text-sm">{project.name}</h5>
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex flex-wrap gap-1">
                          {project.tech.map(tech => (
                            <span key={tech} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs self-start ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  Nume Echipă
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  placeholder="Ex: Frontend Masters"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
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