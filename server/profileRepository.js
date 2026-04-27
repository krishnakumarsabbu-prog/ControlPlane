'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function getAllProfiles() {
  try {
    const profiles = db.prepare('SELECT * FROM profiles ORDER BY createdAt ASC').all();
    const links = db.prepare('SELECT profileId, projectId FROM profile_projects').all();
    return profiles.map(p => ({
      ...p,
      projectIds: links.filter(l => l.profileId === p.id).map(l => l.projectId),
    }));
  } catch (err) {
    throw new Error(`getAllProfiles: ${err.message}`);
  }
}

function createProfile(name, color) {
  try {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO profiles (id, name, color, createdAt) VALUES (?, ?, ?, ?)').run(id, name, color, createdAt);
    return { id, name, color, createdAt, projectIds: [] };
  } catch (err) {
    throw new Error(`createProfile: ${err.message}`);
  }
}

function deleteProfile(id) {
  try {
    db.prepare('DELETE FROM profile_projects WHERE profileId = ?').run(id);
    const info = db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
    if (info.changes === 0) throw new Error(`Profile not found: ${id}`);
  } catch (err) {
    throw new Error(`deleteProfile: ${err.message}`);
  }
}

function updateProfileProjects(profileId, projectIds) {
  try {
    const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId);
    if (!profile) throw new Error(`Profile not found: ${profileId}`);

    db.prepare('DELETE FROM profile_projects WHERE profileId = ?').run(profileId);
    const insert = db.prepare('INSERT INTO profile_projects (profileId, projectId) VALUES (?, ?)');
    for (const projectId of projectIds) {
      insert.run(profileId, projectId);
    }
  } catch (err) {
    throw new Error(`updateProfileProjects: ${err.message}`);
  }
}

module.exports = { getAllProfiles, createProfile, deleteProfile, updateProfileProjects };
