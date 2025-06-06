import axios from 'axios';

const API_URL = 'http://localhost:3000/api/teams';

// Funcție pentru obținerea headerului de autentificare
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const getTeams = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error.response?.data?.message || error.message);
    throw error;
  }
};

const getTeamById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching team:', error.response?.data?.message || error.message);
    throw error;
  }
};

const createTeam = async (teamData) => {
  try {
    const response = await axios.post(API_URL, teamData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error.response?.data?.message || error.message);
    throw error;
  }
};

const updateTeam = async (id, teamData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, teamData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating team:', error.response?.data?.message || error.message);
    throw error;
  }
};

const deleteTeam = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error deleting team:', error.response?.data?.message || error.message);
    throw error;
  }
};

const joinTeam = async (teamId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/${teamId}/join`, { userId }, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error joining team:', error.response?.data?.message || error.message);
    throw error;
  }
};

const TeamService = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  joinTeam
};

export default TeamService;
