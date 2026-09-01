import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProjects, addProject, deleteProject } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardScreen({ navigation }) {
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Header title + settings (gear) button, kept in sync with the
  // currently selected language.
  useEffect(() => {
    navigation.setOptions({
      title: t('dashboardTitle'),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t]);

  const loadProjects = useCallback(async () => {
    const data = await getProjects();
    setProjects(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      Alert.alert(t('enterProjectName'));
      return;
    }
    await addProject(projectName.trim());
    setProjectName('');
    setModalVisible(false);
    loadProjects();
  };

  const handleDeleteProject = (project) => {
    Alert.alert(t('deleteProjectTitle'), t('deleteProjectMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteProject(project.id);
          loadProjects();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('dashboardTitle')}</Text>
      <Text style={styles.subHeader}>{t('dashboardSubtitle')}</Text>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('noProjects')}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.projectCard}
            onPress={() =>
              navigation.navigate('Project', { projectId: item.id, projectName: item.name })
            }
            onLongPress={() => handleDeleteProject(item)}
          >
            <Text style={styles.projectName}>{item.name}</Text>
            <Text style={styles.projectHint}>{t('tapHint')}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('newProject')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('projectNamePlaceholder')}
              value={projectName}
              onChangeText={setProjectName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setProjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateProject}
              >
                <Text style={styles.saveButtonText}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', paddingTop: 60, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: '700', color: '#1E2233' },
  subHeader: { fontSize: 13, color: '#8A8FA3', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  emptyText: { textAlign: 'center', color: '#8A8FA3', marginTop: 60, fontSize: 15, lineHeight: 22 },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  projectName: { fontSize: 18, fontWeight: '600', color: '#1E2233' },
  projectHint: { fontSize: 12, color: '#A0A4B8', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4C6FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C6FFF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 32, marginTop: -2 },
  headerButton: { paddingHorizontal: 8, paddingVertical: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1E2233' },
  input: {
    borderWidth: 1,
    borderColor: '#E1E3EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginLeft: 10 },
  cancelButton: { backgroundColor: '#F0F1F5' },
  cancelButtonText: { color: '#5A5F73', fontWeight: '600' },
  saveButton: { backgroundColor: '#4C6FFF' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});