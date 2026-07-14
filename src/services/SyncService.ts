import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

interface SyncStatus {
  lastSyncTime: number;
  isSyncing: boolean;
  syncCount: number;
  lastError?: string;
}

interface StationData {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    available: boolean;
    quantity: number;
  }>;
  updatedAt: string;
}

class SyncService {
  private syncStatus: SyncStatus = {
    lastSyncTime: 0,
    isSyncing: false,
    syncCount: 0,
  };

  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds minimum

  /**
   * Initialize the sync service
   * Starts periodic syncing and listens for real-time updates
   */
  public async initialize(): Promise<void> {
    console.log('🔄 Initializing Sync Service...');

    // Perform initial sync
    await this.performSync();

    // Set up periodic sync
    this.startPeriodicSync();

    // Set up real-time listeners
    this.setupRealtimeListeners();

    console.log('✅ Sync Service initialized');
  }

  /**
   * Perform a complete data sync from Supabase
   */
  private async performSync(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      console.warn('⚠️ Sync already in progress, skipping...');
      return;
    }

    const now = Date.now();
    if (now - this.syncStatus.lastSyncTime < this.MIN_SYNC_INTERVAL_MS) {
      console.log('⏸️ Sync throttled - too soon after last sync');
      return;
    }

    this.syncStatus.isSyncing = true;
    console.log('🔄 Starting data sync...');

    try {
      // Fetch all stations with their products
      const stations = await this.fetchStations();

      // Save to local storage for offline access
      this.saveSyncData(stations);

      // Update sync status
      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.syncCount++;
      this.syncStatus.lastError = undefined;

      // Dispatch event for UI updates
      this.notifyListeners('sync-complete', { stations, timestamp: this.syncStatus.lastSyncTime });

      console.log(`✅ Sync completed successfully (${stations.length} stations)`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.syncStatus.lastError = errorMsg;
      this.notifyListeners('sync-error', { error: errorMsg });
      console.error('❌ Sync failed:', errorMsg);
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  /**
   * Fetch stations from Supabase
   */
  private async fetchStations(): Promise<StationData[]> {
    try {
      const { data: stations, error: stationsError } = await supabase
        .from('stations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (stationsError) {
        throw new Error(`Failed to fetch stations: ${stationsError.message}`);
      }

      if (!stations || stations.length === 0) {
        console.log('ℹ️ No stations found');
        return [];
      }

      // Fetch products for each station
      const stationsWithProducts = await Promise.all(
        stations.map(async (station) => {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('station_id', station.id);

          if (productsError) {
            console.error(`❌ Error fetching products for station ${station.id}:`, productsError);
            return { ...station, products: [] };
          }

          return {
            ...station,
            products: products || [],
          };
        })
      );

      return stationsWithProducts;
    } catch (error) {
      throw new Error(`Error in fetchStations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save sync data to local storage
   */
  private saveSyncData(stations: StationData[]): void {
    try {
      const syncData = {
        stations,
        timestamp: Date.now(),
        version: '1.0',
      };
      localStorage.setItem('mobile-app-sync-data', JSON.stringify(syncData));
      console.log('💾 Sync data saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save sync data:', error);
    }
  }

  /**
   * Retrieve cached sync data from local storage
   */
  public getSyncedData(): StationData[] {
    try {
      const data = localStorage.getItem('mobile-app-sync-data');
      if (!data) {
        console.log('ℹ️ No cached sync data found');
        return [];
      }

      const syncData = JSON.parse(data);
      return syncData.stations || [];
    } catch (error) {
      console.error('❌ Error retrieving sync data:', error);
      return [];
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      console.warn('⚠️ Periodic sync already running');
      return;
    }

    console.log(`⏱️ Starting periodic sync (every ${this.SYNC_INTERVAL_MS / 1000} seconds)`);

    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop periodic sync
   */
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Periodic sync stopped');
    }
  }

  /**
   * Set up real-time listeners for Supabase changes
   */
  private setupRealtimeListeners(): void {
    console.log('👂 Setting up real-time listeners...');

    // Listen for station changes
    supabase
      .channel('stations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stations',
        },
        (payload) => {
          console.log('🔔 Station change detected:', payload.eventType);
          this.notifyListeners('station-changed', payload);
          // Trigger immediate sync
          this.performSync();
        }
      )
      .subscribe();

    // Listen for product changes
    supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('🔔 Product change detected:', payload.eventType);
          this.notifyListeners('product-changed', payload);
          // Trigger immediate sync
          this.performSync();
        }
      )
      .subscribe();

    console.log('✅ Real-time listeners configured');
  }

  /**
   * Manual sync trigger
   */
  public async syncNow(): Promise<void> {
    console.log('🔄 Manual sync triggered');
    await this.performSync();
  }

  /**
   * Get current sync status
   */
  public getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Listen for sync events
   */
  private listeners: Map<string, Function[]> = new Map();

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in listener for event '${event}':`, error);
        }
      });
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopPeriodicSync();
    this.listeners.clear();
    console.log('🧹 Sync Service destroyed');
  }
}

// Create and export singleton instance
export const syncService = new SyncService();

export default SyncService;
