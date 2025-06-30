import type { SimulationResult } from './simulator'

export interface Database {
  init(): Promise<void>
  saveSimulation(result: SimulationResult): Promise<void>
  saveSimulations(results: SimulationResult[]): Promise<void>
  getSimulations(limit?: number, offset?: number): Promise<SimulationResult[]>
  getSimulationsByStrategy(strategy: string): Promise<SimulationResult[]>
  getSimulationsByCharacter(character: string): Promise<SimulationResult[]>
  clearAll(): Promise<void>
}

// In-memory database implementation
export class InMemoryDatabase implements Database {
  private simulations: SimulationResult[] = []

  async init(): Promise<void> {
    this.simulations = []
  }

  async saveSimulation(result: SimulationResult): Promise<void> {
    this.simulations.push(result)
  }

  async saveSimulations(results: SimulationResult[]): Promise<void> {
    this.simulations.push(...results)
  }

  async getSimulations(
    limit?: number,
    offset: number = 0
  ): Promise<SimulationResult[]> {
    if (limit) {
      return this.simulations.slice(offset, offset + limit)
    }
    return this.simulations.slice(offset)
  }

  async getSimulationsByStrategy(
    strategy: string
  ): Promise<SimulationResult[]> {
    return this.simulations.filter((sim) => sim.aiStrategies.includes(strategy))
  }

  async getSimulationsByCharacter(
    character: string
  ): Promise<SimulationResult[]> {
    return this.simulations.filter((sim) =>
      sim.finalScores.some((score) => score.character === character)
    )
  }

  async clearAll(): Promise<void> {
    this.simulations = []
  }

  // Additional utility methods
  getTotalGames(): number {
    return this.simulations.length
  }

  exportToJSON(): string {
    return JSON.stringify(this.simulations, null, 2)
  }

  importFromJSON(json: string): void {
    try {
      const data = JSON.parse(json)
      if (Array.isArray(data)) {
        this.simulations = data
      }
    } catch (error) {
      console.error('Failed to import JSON:', error)
    }
  }
}

// IndexedDB implementation for browser persistence
export class IndexedDBDatabase implements Database {
  private dbName = 'DeadwoodSimulator'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('simulations')) {
          const store = db.createObjectStore('simulations', {
            keyPath: 'gameId',
            autoIncrement: false,
          })

          // Create indexes
          store.createIndex('winner', 'winner', { unique: false })
          store.createIndex('winnerCharacter', 'winnerCharacter', {
            unique: false,
          })
          store.createIndex('rounds', 'rounds', { unique: false })
          store.createIndex('startTime', 'startTime', { unique: false })
        }
      }
    })
  }

  async saveSimulation(result: SimulationResult): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['simulations'], 'readwrite')
      const store = transaction.objectStore('simulations')
      const request = store.add(result)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async saveSimulations(results: SimulationResult[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['simulations'], 'readwrite')
      const store = transaction.objectStore('simulations')

      let completed = 0
      const total = results.length

      results.forEach((result) => {
        const request = store.add(result)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          completed++
          if (completed === total) resolve()
        }
      })
    })
  }

  async getSimulations(
    limit?: number,
    offset: number = 0
  ): Promise<SimulationResult[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['simulations'], 'readonly')
      const store = transaction.objectStore('simulations')
      const results: SimulationResult[] = []

      let count = 0
      let skipped = 0

      const request = store.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (cursor && (!limit || count < limit)) {
          if (skipped < offset) {
            skipped++
          } else {
            results.push(cursor.value)
            count++
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  async getSimulationsByStrategy(
    strategy: string
  ): Promise<SimulationResult[]> {
    const allSims = await this.getSimulations()
    return allSims.filter((sim) => sim.aiStrategies.includes(strategy))
  }

  async getSimulationsByCharacter(
    character: string
  ): Promise<SimulationResult[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['simulations'], 'readonly')
      const store = transaction.objectStore('simulations')
      const index = store.index('winnerCharacter')
      const results: SimulationResult[] = []

      const request = index.openCursor(IDBKeyRange.only(character))

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['simulations'], 'readwrite')
      const store = transaction.objectStore('simulations')
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}
