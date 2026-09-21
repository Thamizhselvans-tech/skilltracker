import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';
import { ProgressBar } from '../../components/ProgressBar';
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';
import { CLIENT_STATUSES, MEMBER_ROLES, PROJECT_STATUSES } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';

export default function StartupScreen() {
  const { theme } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'clients', 'members', 'projects', 'profile'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Search queries
  const [clientSearch, setClientSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Modals
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Forms
  const [clientForm, setClientForm] = useState({
    clientName: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    industry: '',
    requirement: '',
    projectType: 'Mobile App',
    budget: '',
    status: 'Lead',
    notes: '',
  });

  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'Full Stack Developer',
    skills: '',
    email: '',
    phone: '',
    linkedIn: '',
    gitHub: '',
    status: 'Active',
    responsibilities: '',
  });

  const [projectForm, setProjectForm] = useState({
    projectName: '',
    clientName: '',
    description: '',
    assignedMembers: '',
    technologyStack: '',
    budget: '',
    deadline: '',
    status: 'Planning',
    priority: 'Medium',
    progressPercentage: '10',
    notes: '',
  });

  const [profileForm, setProfileForm] = useState({
    startupName: '',
    tagline: '',
    description: '',
    vision: '',
    mission: '',
    website: '',
    email: '',
    phone: '',
    address: '',
  });

  // Delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '', name: '' });

  const fetchStartupAll = useCallback(async () => {
    try {
      const [dashRes, profRes, clientRes, memberRes, projRes] = await Promise.all([
        apiGet('/api/startup/dashboard'),
        apiGet('/api/startup/profile'),
        apiGet('/api/startup/clients'),
        apiGet('/api/startup/members'),
        apiGet('/api/startup/projects'),
      ]);

      if (dashRes.success) setDashboardData(dashRes.data?.data);
      if (profRes.success) {
        setProfile(profRes.data?.data);
        if (profRes.data?.data) setProfileForm(profRes.data.data);
      }
      if (clientRes.success) setClients(clientRes.data?.data || []);
      if (memberRes.success) setMembers(memberRes.data?.data || []);
      if (projRes.success) setProjects(projRes.data?.data || []);
    } catch (err) {
      console.warn('Startup fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStartupAll();
  }, [fetchStartupAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStartupAll();
  };

  // -------------------------------------------------------------
  // CLIENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddClient = () => {
    setEditItem(null);
    setClientForm({
      clientName: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      industry: '',
      requirement: '',
      projectType: 'Mobile App',
      budget: '',
      status: 'Lead',
      notes: '',
    });
    setClientModalVisible(true);
  };

  const handleOpenEditClient = (item) => {
    setEditItem(item);
    setClientForm({
      clientName: item.clientName,
      companyName: item.companyName || '',
      contactPerson: item.contactPerson || '',
      phone: item.phone || '',
      email: item.email || '',
      industry: item.industry || '',
      requirement: item.requirement || '',
      projectType: item.projectType || 'Mobile App',
      budget: String(item.budget || ''),
      status: item.status || 'Lead',
      notes: item.notes || '',
    });
    setClientModalVisible(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.clientName.trim()) {
      Alert.alert('Validation Error', 'Client name is required');
      return;
    }
    setFormLoading(true);
    const payload = {
      ...clientForm,
      budget: parseFloat(clientForm.budget) || 0,
    };
    let res;
    if (editItem) {
      res = await apiPut(`/api/startup/clients/${editItem._id}`, payload);
    } else {
      res = await apiPost('/api/startup/clients', payload);
    }
    setFormLoading(false);

    if (res.success) {
      setClientModalVisible(false);
      fetchStartupAll();
    } else {
      Alert.alert('Error', res.error || 'Failed to save client');
    }
  };

  // -------------------------------------------------------------
  // MEMBER HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddMember = () => {
    setEditItem(null);
    setMemberForm({
      name: '',
      role: 'Full Stack Developer',
      skills: '',
      email: '',
      phone: '',
      linkedIn: '',
      gitHub: '',
      status: 'Active',
      responsibilities: '',
    });
    setMemberModalVisible(true);
  };

  const handleOpenEditMember = (item) => {
    setEditItem(item);
    setMemberForm({
      name: item.name,
      role: item.role || 'Full Stack Developer',
      skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
      email: item.email || '',
      phone: item.phone || '',
      linkedIn: item.linkedIn || '',
      gitHub: item.gitHub || '',
      status: item.status || 'Active',
      responsibilities: item.responsibilities || '',
    });
    setMemberModalVisible(true);
  };

  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) {
      Alert.alert('Validation Error', 'Member name is required');
      return;
    }
    setFormLoading(true);
    let res;
    if (editItem) {
      res = await apiPut(`/api/startup/members/${editItem._id}`, memberForm);
    } else {
      res = await apiPost('/api/startup/members', memberForm);
    }
    setFormLoading(false);

    if (res.success) {
      setMemberModalVisible(false);
      fetchStartupAll();
    } else {
      Alert.alert('Error', res.error || 'Failed to save member');
    }
  };

  // -------------------------------------------------------------
  // PROJECT HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddProject = () => {
    setEditItem(null);
    setProjectForm({
      projectName: '',
      clientName: '',
      description: '',
      assignedMembers: '',
      technologyStack: '',
      budget: '',
      deadline: '',
      status: 'Planning',
      priority: 'Medium',
      progressPercentage: '10',
      notes: '',
    });
    setProjectModalVisible(true);
  };

  const handleOpenEditProject = (item) => {
    setEditItem(item);
    setProjectForm({
      projectName: item.projectName,
      clientName: item.clientName || '',
      description: item.description || '',
      assignedMembers: Array.isArray(item.assignedMembers) ? item.assignedMembers.join(', ') : '',
      technologyStack: Array.isArray(item.technologyStack) ? item.technologyStack.join(', ') : '',
      budget: String(item.budget || ''),
      deadline: item.deadline || '',
      status: item.status || 'Planning',
      priority: item.priority || 'Medium',
      progressPercentage: String(item.progressPercentage || 0),
      notes: item.notes || '',
    });
    setProjectModalVisible(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.projectName.trim()) {
      Alert.alert('Validation Error', 'Project name is required');
      return;
    }
    setFormLoading(true);
    const payload = {
      ...projectForm,
      budget: parseFloat(projectForm.budget) || 0,
      progressPercentage: Math.min(100, Math.max(0, parseInt(projectForm.progressPercentage, 10) || 0)),
    };
    let res;
    if (editItem) {
      res = await apiPut(`/api/startup/projects/${editItem._id}`, payload);
    } else {
      res = await apiPost('/api/startup/projects', payload);
    }
    setFormLoading(false);

    if (res.success) {
      setProjectModalVisible(false);
      fetchStartupAll();
    } else {
      Alert.alert('Error', res.error || 'Failed to save project');
    }
  };

  // -------------------------------------------------------------
  // PROFILE HANDLERS
  // -------------------------------------------------------------
  const handleSaveProfile = async () => {
    setFormLoading(true);
    const res = await apiPut('/api/startup/profile', profileForm);
    setFormLoading(false);
    if (res.success) {
      setProfileModalVisible(false);
      setProfile(res.data?.data);
      Alert.alert('Success', 'Startup profile updated successfully.');
    } else {
      Alert.alert('Error', res.error || 'Failed to update profile');
    }
  };

  // -------------------------------------------------------------
  // DELETE HANDLERS
  // -------------------------------------------------------------
  const triggerDelete = (type, item, name) => {
    setDeleteTarget({ type, id: item._id, name });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteTarget;
    let endpoint = '';
    if (type === 'client') endpoint = `/api/startup/clients/${id}`;
    if (type === 'member') endpoint = `/api/startup/members/${id}`;
    if (type === 'project') endpoint = `/api/startup/projects/${id}`;

    const res = await apiDelete(endpoint);
    setDeleteModalVisible(false);
    if (res.success) {
      fetchStartupAll();
    } else {
      Alert.alert('Error', res.error || 'Failed to delete item');
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title={profile?.startupName || 'Startup Management'}
        rightComponent={
          activeTab === 'clients' ? (
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={handleOpenAddClient}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Client</Text>
            </TouchableOpacity>
          ) : activeTab === 'members' ? (
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={handleOpenAddMember}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Member</Text>
            </TouchableOpacity>
          ) : activeTab === 'projects' ? (
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={handleOpenAddProject}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Project</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.profileEditBtn, { backgroundColor: theme.inputBackground }]}
              onPress={() => setProfileModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={18} color={theme.text} />
            </TouchableOpacity>
          )
        }
      />

      {/* Startup Sub-navigation Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline' },
            { id: 'clients', label: `Clients (${clients.length})`, icon: 'people-outline' },
            { id: 'members', label: `Team (${members.length})`, icon: 'person-add-outline' },
            { id: 'projects', label: `Projects (${projects.length})`, icon: 'briefcase-outline' },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isTabActive && [styles.tabItemActive, { borderBottomColor: theme.primary }]]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isTabActive ? theme.primary : theme.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isTabActive ? theme.primary : theme.textMuted, fontWeight: isTabActive ? '800' : '500' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          {/* TAB 1: STARTUP DASHBOARD */}
          {activeTab === 'dashboard' && (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
              {/* Profile Card */}
              <View style={[styles.startupProfileCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
                <View style={styles.profTop}>
                  <View style={[styles.startupLogo, { backgroundColor: `${theme.primary}20` }]}>
                    <Ionicons name="rocket" size={32} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.profName, { color: theme.text }]}>{profile?.startupName || 'NovaTech Solutions'}</Text>
                    <Text style={[styles.profTag, { color: theme.textMuted }]}>{profile?.tagline || 'Building Digital Systems'}</Text>
                    {profile?.website ? (
                      <Text style={[styles.profLink, { color: theme.primaryLight }]}>{profile.website}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.editIconBtn, { backgroundColor: theme.inputBackground }]}
                    onPress={() => setProfileModalVisible(true)}
                  >
                    <Ionicons name="create-outline" size={16} color={theme.text} />
                  </TouchableOpacity>
                </View>
                {profile?.description ? (
                  <Text style={[styles.profDesc, { color: theme.textMuted }]} numberOfLines={2}>
                    {profile.description}
                  </Text>
                ) : null}
              </View>

              {/* Real Metric Cards Grid */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Commercial Health</Text>
              <View style={styles.metricsGrid}>
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>TOTAL CLIENTS</Text>
                  <Text style={[styles.mNum, { color: theme.primary }]}>{dashboardData?.stats?.totalClients ?? 0}</Text>
                  <Text style={[styles.mSub, { color: theme.textSubtle }]}>{dashboardData?.stats?.leads ?? 0} active leads</Text>
                </View>
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>ACTIVE PROJECTS</Text>
                  <Text style={[styles.mNum, { color: '#10B981' }]}>{dashboardData?.stats?.activeProjects ?? 0}</Text>
                  <Text style={[styles.mSub, { color: theme.textSubtle }]}>
                    {dashboardData?.stats?.completedProjects ?? 0} completed
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>TEAM MEMBERS</Text>
                  <Text style={[styles.mNum, { color: '#F59E0B' }]}>{dashboardData?.stats?.teamMembers ?? 0}</Text>
                  <Text style={[styles.mSub, { color: theme.textSubtle }]}>Active roles</Text>
                </View>
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.mLabel, { color: theme.textMuted }]}>PIPELINE REVENUE</Text>
                  <Text style={[styles.mNum, { color: '#EC4899' }]}>${dashboardData?.stats?.totalBudget ?? 0}</Text>
                  <Text style={[styles.mSub, { color: theme.textSubtle }]}>Contract values</Text>
                </View>
              </View>

              {/* Upcoming Deadlines */}
              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 14 }]}>Upcoming Project Deadlines</Text>
              {dashboardData?.upcomingDeadlines?.length > 0 ? (
                dashboardData.upcomingDeadlines.map((p) => (
                  <View key={p._id} style={[styles.deadlineCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Ionicons name="time-outline" size={20} color={theme.danger} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dlTitle, { color: theme.text }]}>{p.projectName}</Text>
                      <Text style={[styles.dlClient, { color: theme.textMuted }]}>{p.clientName || 'Direct Client'}</Text>
                    </View>
                    <View style={[styles.dlDateBadge, { backgroundColor: `${theme.danger}20` }]}>
                      <Text style={[styles.dlDateText, { color: theme.danger }]}>{p.deadline}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyNote, { color: theme.textMuted }]}>No urgent project deadlines due soon.</Text>
              )}
            </ScrollView>
          )}

          {/* TAB 2: CLIENT MANAGEMENT CRUD */}
          {activeTab === 'clients' && (
            <View style={{ flex: 1 }}>
              <SearchFilterBar
                searchQuery={clientSearch}
                onSearchChange={setClientSearch}
                placeholder="Search clients by name or company..."
              />
              <FlatList
                data={filteredClients}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                  <EmptyState
                    icon="people-outline"
                    title="No clients found"
                    message="Add potential leads, shops, or businesses requesting applications."
                    buttonText="Add New Client"
                    onPress={handleOpenAddClient}
                  />
                }
                renderItem={({ item }) => (
                  <View style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.itemTop}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}18` }]}>
                            <Text style={[styles.statusBadgeText, { color: theme.primary }]}>{item.status}</Text>
                          </View>
                          <Text style={[styles.projType, { color: theme.textSubtle }]}>{item.projectType}</Text>
                        </View>
                        <Text style={[styles.clientName, { color: theme.text }]}>{item.clientName}</Text>
                        {item.companyName ? (
                          <Text style={[styles.compName, { color: theme.textMuted }]}>{item.companyName}</Text>
                        ) : null}
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]}
                          onPress={() => handleOpenEditClient(item)}
                        >
                          <Ionicons name="create-outline" size={15} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: `${theme.danger}15` }]}
                          onPress={() => triggerDelete('client', item, item.clientName)}
                        >
                          <Ionicons name="trash-outline" size={15} color={theme.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.contactRow}>
                      {item.phone ? (
                        <View style={styles.cItem}>
                          <Ionicons name="call-outline" size={12} color={theme.textSubtle} />
                          <Text style={[styles.cText, { color: theme.textMuted }]}>{item.phone}</Text>
                        </View>
                      ) : null}
                      {item.budget > 0 ? (
                        <View style={styles.cItem}>
                          <Ionicons name="cash-outline" size={12} color={theme.success} />
                          <Text style={[styles.cText, { color: theme.success, fontWeight: '700' }]}>${item.budget}</Text>
                        </View>
                      ) : null}
                    </View>

                    {item.requirement ? (
                      <Text style={[styles.reqText, { color: theme.textSubtle }]} numberOfLines={2}>
                        Req: {item.requirement}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            </View>
          )}

          {/* TAB 3: MEMBERS MANAGEMENT CRUD */}
          {activeTab === 'members' && (
            <View style={{ flex: 1 }}>
              <SearchFilterBar
                searchQuery={memberSearch}
                onSearchChange={setMemberSearch}
                placeholder="Search team members by name or role..."
              />
              <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                  <EmptyState
                    icon="person-add-outline"
                    title="No startup members added"
                    message="Add co-founders, developers, designers, and marketers in your team."
                    buttonText="Add Team Member"
                    onPress={handleOpenAddMember}
                  />
                }
                renderItem={({ item }) => (
                  <View style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.itemTop}>
                      <View style={[styles.memberAvatar, { backgroundColor: `${theme.primary}20` }]}>
                        <Text style={[styles.avatarLetter, { color: theme.primary }]}>
                          {item.name ? item.name.charAt(0).toUpperCase() : 'M'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.clientName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.memberRole, { color: theme.primaryLight }]}>{item.role}</Text>
                        {item.email ? <Text style={[styles.compName, { color: theme.textMuted }]}>{item.email}</Text> : null}
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]}
                          onPress={() => handleOpenEditMember(item)}
                        >
                          <Ionicons name="create-outline" size={15} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: `${theme.danger}15` }]}
                          onPress={() => triggerDelete('member', item, item.name)}
                        >
                          <Ionicons name="trash-outline" size={15} color={theme.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {item.skills?.length > 0 && (
                      <View style={styles.skillsChipsRow}>
                        {(Array.isArray(item.skills) ? item.skills : [item.skills]).map((s, idx) => (
                          <View key={idx} style={[styles.memberSkillChip, { backgroundColor: theme.inputBackground }]}>
                            <Text style={[styles.memberSkillText, { color: theme.textMuted }]}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          )}

          {/* TAB 4: PROJECTS MANAGEMENT CRUD */}
          {activeTab === 'projects' && (
            <View style={{ flex: 1 }}>
              <SearchFilterBar
                searchQuery={projectSearch}
                onSearchChange={setProjectSearch}
                placeholder="Search startup projects by name..."
              />
              <FlatList
                data={filteredProjects}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                  <EmptyState
                    icon="briefcase-outline"
                    title="No projects added yet"
                    message="Manage client deliverables, technology stack, deadlines, and progress."
                    buttonText="Add Project"
                    onPress={handleOpenAddProject}
                  />
                }
                renderItem={({ item }) => (
                  <View style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.itemTop}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, { backgroundColor: `${theme.accent}18` }]}>
                            <Text style={[styles.statusBadgeText, { color: theme.accent }]}>{item.status}</Text>
                          </View>
                          <Text style={[styles.projType, { color: theme.textSubtle }]}>{item.priority} Priority</Text>
                        </View>
                        <Text style={[styles.clientName, { color: theme.text }]}>{item.projectName}</Text>
                        {item.clientName ? (
                          <Text style={[styles.compName, { color: theme.textMuted }]}>Client: {item.clientName}</Text>
                        ) : null}
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]}
                          onPress={() => handleOpenEditProject(item)}
                        >
                          <Ionicons name="create-outline" size={15} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: `${theme.danger}15` }]}
                          onPress={() => triggerDelete('project', item, item.projectName)}
                        >
                          <Ionicons name="trash-outline" size={15} color={theme.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {item.description ? (
                      <Text style={[styles.reqText, { color: theme.textMuted }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    {/* Progress */}
                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>Development Progress</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                          {item.progressPercentage}%
                        </Text>
                      </View>
                      <ProgressBar progress={item.progressPercentage} color={theme.primary} height={5} />
                    </View>

                    <View style={[styles.contactRow, { marginTop: 10 }]}>
                      {item.deadline ? (
                        <View style={styles.cItem}>
                          <Ionicons name="calendar-outline" size={12} color={theme.textSubtle} />
                          <Text style={[styles.cText, { color: theme.textMuted }]}>Due: {item.deadline}</Text>
                        </View>
                      ) : null}
                      {item.budget > 0 ? (
                        <View style={styles.cItem}>
                          <Ionicons name="cash-outline" size={12} color={theme.success} />
                          <Text style={[styles.cText, { color: theme.success, fontWeight: '700' }]}>${item.budget}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            </View>
          )}
        </>
      )}

      {/* CLIENT ADD/EDIT MODAL */}
      <Modal visible={clientModalVisible} animationType="slide" transparent onRequestClose={() => setClientModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{editItem ? 'Edit Client' : 'Add New Client'}</Text>
              <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Client / Contact Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. John Doe"
                placeholderTextColor={theme.textSubtle}
                value={clientForm.clientName}
                onChangeText={(v) => setClientForm((p) => ({ ...p, clientName: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Company / Shop Name</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Apex Retail Store"
                placeholderTextColor={theme.textSubtle}
                value={clientForm.companyName}
                onChangeText={(v) => setClientForm((p) => ({ ...p, companyName: v }))}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="+1 555-0199"
                    placeholderTextColor={theme.textSubtle}
                    value={clientForm.phone}
                    onChangeText={(v) => setClientForm((p) => ({ ...p, phone: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Budget ($)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="3500"
                    placeholderTextColor={theme.textSubtle}
                    keyboardType="numeric"
                    value={clientForm.budget}
                    onChangeText={(v) => setClientForm((p) => ({ ...p, budget: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Status Pipeline</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {CLIENT_STATUSES.filter((s) => s !== 'All').map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: clientForm.status === st ? theme.primary : theme.inputBackground,
                        borderColor: clientForm.status === st ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setClientForm((p) => ({ ...p, status: st }))}
                  >
                    <Text style={{ color: clientForm.status === st ? '#FFFFFF' : theme.textMuted, fontSize: 12 }}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Requirement / App Features</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Mobile ordering app with payment gateway..."
                placeholderTextColor={theme.textSubtle}
                multiline
                numberOfLines={3}
                value={clientForm.requirement}
                onChangeText={(v) => setClientForm((p) => ({ ...p, requirement: v }))}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.inputBackground }]}
                onPress={() => setClientModalVisible(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveClient}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{editItem ? 'Update Client' : 'Add Client'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MEMBER ADD/EDIT MODAL */}
      <Modal visible={memberModalVisible} animationType="slide" transparent onRequestClose={() => setMemberModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editItem ? 'Edit Member' : 'Add Startup Member'}
              </Text>
              <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Member Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Alex Johnson"
                placeholderTextColor={theme.textSubtle}
                value={memberForm.name}
                onChangeText={(v) => setMemberForm((p) => ({ ...p, name: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {MEMBER_ROLES.filter((r) => r !== 'All').map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: memberForm.role === role ? theme.primary : theme.inputBackground,
                        borderColor: memberForm.role === role ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setMemberForm((p) => ({ ...p, role }))}
                  >
                    <Text style={{ color: memberForm.role === role ? '#FFFFFF' : theme.textMuted, fontSize: 12 }}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Skills (comma-separated)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. React Native, Node.js, UI/UX"
                placeholderTextColor={theme.textSubtle}
                value={memberForm.skills}
                onChangeText={(v) => setMemberForm((p) => ({ ...p, skills: v }))}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Email</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="member@startup.io"
                    placeholderTextColor={theme.textSubtle}
                    value={memberForm.email}
                    onChangeText={(v) => setMemberForm((p) => ({ ...p, email: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="+1 555-0199"
                    placeholderTextColor={theme.textSubtle}
                    value={memberForm.phone}
                    onChangeText={(v) => setMemberForm((p) => ({ ...p, phone: v }))}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.inputBackground }]}
                onPress={() => setMemberModalVisible(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveMember}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{editItem ? 'Update Member' : 'Add Member'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PROJECT ADD/EDIT MODAL */}
      <Modal visible={projectModalVisible} animationType="slide" transparent onRequestClose={() => setProjectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editItem ? 'Edit Project' : 'Create Startup Project'}
              </Text>
              <TouchableOpacity onPress={() => setProjectModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Project Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. EcoCart E-commerce Mobile App"
                placeholderTextColor={theme.textSubtle}
                value={projectForm.projectName}
                onChangeText={(v) => setProjectForm((p) => ({ ...p, projectName: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Client Name</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. GreenLeaf Organics"
                placeholderTextColor={theme.textSubtle}
                value={projectForm.clientName}
                onChangeText={(v) => setProjectForm((p) => ({ ...p, clientName: v }))}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Budget ($)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="4000"
                    placeholderTextColor={theme.textSubtle}
                    keyboardType="numeric"
                    value={projectForm.budget}
                    onChangeText={(v) => setProjectForm((p) => ({ ...p, budget: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Deadline (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSubtle}
                    value={projectForm.deadline}
                    onChangeText={(v) => setProjectForm((p) => ({ ...p, deadline: v }))}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {PROJECT_STATUSES.filter((s) => s !== 'All').map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: projectForm.status === st ? theme.primary : theme.inputBackground,
                        borderColor: projectForm.status === st ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setProjectForm((p) => ({ ...p, status: st }))}
                  >
                    <Text style={{ color: projectForm.status === st ? '#FFFFFF' : theme.textMuted, fontSize: 12 }}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Progress Percentage (0 - 100)%</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="40"
                placeholderTextColor={theme.textSubtle}
                keyboardType="numeric"
                value={projectForm.progressPercentage}
                onChangeText={(v) => setProjectForm((p) => ({ ...p, progressPercentage: v }))}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.inputBackground }]}
                onPress={() => setProjectModalVisible(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveProject}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{editItem ? 'Update Project' : 'Create Project'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STARTUP PROFILE MODAL */}
      <Modal visible={profileModalVisible} animationType="slide" transparent onRequestClose={() => setProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Startup Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Startup / Agency Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. NovaTech Labs"
                placeholderTextColor={theme.textSubtle}
                value={profileForm.startupName}
                onChangeText={(v) => setProfileForm((p) => ({ ...p, startupName: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Tagline</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Innovating Next-Gen Software Solutions"
                placeholderTextColor={theme.textSubtle}
                value={profileForm.tagline}
                onChangeText={(v) => setProfileForm((p) => ({ ...p, tagline: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Website</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="https://novatech.io"
                placeholderTextColor={theme.textSubtle}
                value={profileForm.website}
                onChangeText={(v) => setProfileForm((p) => ({ ...p, website: v }))}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Startup Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                placeholder="Summary of services, stack, mission..."
                placeholderTextColor={theme.textSubtle}
                multiline
                numberOfLines={3}
                value={profileForm.description}
                onChangeText={(v) => setProfileForm((p) => ({ ...p, description: v }))}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: theme.inputBackground }]}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveProfile}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title={`Delete ${deleteTarget.type}`}
        message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 12,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  startupProfileCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  profTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startupLogo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profTag: {
    fontSize: 12,
    marginTop: 2,
  },
  profLink: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profDesc: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  mLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mNum: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  mSub: {
    fontSize: 11,
    marginTop: 2,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dlTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  dlClient: {
    fontSize: 11,
    marginTop: 2,
  },
  dlDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dlDateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  projType: {
    fontSize: 11,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
  },
  compName: {
    fontSize: 12,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  cItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cText: {
    fontSize: 12,
  },
  reqText: {
    fontSize: 12,
    marginTop: 6,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  skillsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  memberSkillChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberSkillText: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalScroll: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  formRow: {
    flexDirection: 'row',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
