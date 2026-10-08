import { ERPDatabase, User } from '../types';
import { INITIAL_DATABASE } from './seedData';

const STORAGE_KEY = 'fabripcp_database_v1';

export const loadDatabase = (): ERPDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    const parsed = JSON.parse(raw) as ERPDatabase;
    // Validação básica dos arrays principais
    if (!parsed.products || !parsed.rawMaterials || !parsed.clients || !parsed.orders || !parsed.productionOrders) {
      saveDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    return parsed;
  } catch (err) {
    console.error('Erro ao carregar banco local, restaurando padrão:', err);
    saveDatabase(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  }
};

export const saveDatabase = (db: ERPDatabase): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
};

export const resetToSeedDatabase = (): ERPDatabase => {
  saveDatabase(INITIAL_DATABASE);
  return INITIAL_DATABASE;
};

export const exportDatabaseAsJSON = (db: ERPDatabase): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `backup_fabripcp_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importDatabaseFromJSON = async (file: File): Promise<ERPDatabase> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as ERPDatabase;
        if (!parsed.products || !parsed.rawMaterials) {
          throw new Error('Arquivo JSON inválido para FabriPCP.');
        }
        saveDatabase(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
