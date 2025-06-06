import axios from 'axios';

const API_URL = 'http://localhost:3000/api/teams';

export const getTeams = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const getTeamById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
};

export const createTeam = async (teamData) => {
  try {
    const response = await axios.post(API_URL, teamData);
    return response.data;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const updateTeam = async (id, teamData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, teamData);
    return response.data;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

export const deleteTeam = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const joinTeam = async (teamId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/${teamId}/join`, { userId });
    return response.data;
  } catch (error) {
    console.error('Error joining team:', error);
    throw error;
  }
};