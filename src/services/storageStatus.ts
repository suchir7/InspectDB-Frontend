import { useEffect, useState } from 'react';
import { api } from './api';
import { HealthStatus } from '../types';

export interface DocumentStoreInfo {
  mode: string;
  isDocumentDb: boolean;
  connected: boolean;
  label: string;
  databaseName: string;
  collection: string;
  clusterCostActive: boolean;
}

const FALLBACK: DocumentStoreInfo = {
  mode: 'memory',
  isDocumentDb: false,
  connected: false,
  label: 'Local In-Memory Repository',
  databaseName: 'inspectdb',
  collection: 'inspection_reports',
  clusterCostActive: false
};

export const toDocumentStoreInfo = (health: HealthStatus | null): DocumentStoreInfo => {
  const db = health?.database;
  if (!db) return FALLBACK;
  const mode = db.mode || 'memory';
  return {
    mode,
    isDocumentDb: mode === 'documentdb',
    connected: Boolean(db.connected),
    label: mode === 'documentdb' ? 'Amazon DocumentDB' : mode === 'mongodb' ? 'Local MongoDB' : FALLBACK.label,
    databaseName: db.database_name || FALLBACK.databaseName,
    collection: db.collection || FALLBACK.collection,
    clusterCostActive: Boolean(db.cluster_cost_active)
  };
};

// One shared request per page load; storage mode only changes on redeploy.
let healthRequest: Promise<HealthStatus | null> | null = null;

export const useDocumentStore = (): DocumentStoreInfo => {
  const [info, setInfo] = useState<DocumentStoreInfo>(FALLBACK);

  useEffect(() => {
    let active = true;
    if (!healthRequest) {
      healthRequest = api.getHealth().catch(() => {
        healthRequest = null;
        return null;
      });
    }
    healthRequest.then((health) => {
      if (active) setInfo(toDocumentStoreInfo(health));
    });
    return () => {
      active = false;
    };
  }, []);

  return info;
};
