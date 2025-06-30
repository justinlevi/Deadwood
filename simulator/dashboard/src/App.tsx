import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Play, 
  Settings, 
  TrendingUp, 
  Users, 
  Target,
  Map,
  GitBranch,
  Activity
} from 'lucide-react'
import SimulatorControl from './components/SimulatorControl'
import WinRateChart from './components/WinRateChart'
import ActionUsageChart from './components/ActionUsageChart'
import GameLengthChart from './components/GameLengthChart'
import LocationHeatmap from './components/LocationHeatmap'
import CharacterBalance from './components/CharacterBalance'
import FirstPlayerAdvantage from './components/FirstPlayerAdvantage'
import StrategyPerformance from './components/StrategyPerformance'
import NashEquilibrium from './components/NashEquilibrium'
import './App.css'

type TabType = 'simulator' | 'winrates' | 'actions' | 'locations' | 'balance' | 'analysis'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('simulator')
  const [simulations, setSimulations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Load saved simulations on mount
  useEffect(() => {
    const savedData = localStorage.getItem('deadwood-simulations')
    if (savedData) {
      try {
        setSimulations(JSON.parse(savedData))
      } catch (error) {
        console.error('Failed to load saved simulations:', error)
      }
    }
  }, [])
  
  const handleSimulationsComplete = (newSimulations: any[]) => {
    const allSimulations = [...simulations, ...newSimulations]
    setSimulations(allSimulations)
    localStorage.setItem('deadwood-simulations', JSON.stringify(allSimulations))
  }
  
  const clearSimulations = () => {
    if (confirm('Are you sure you want to clear all simulation data?')) {
      setSimulations([])
      localStorage.removeItem('deadwood-simulations')
    }
  }
  
  const tabs = [
    { id: 'simulator', label: 'Simulator', icon: Play },
    { id: 'winrates', label: 'Win Rates', icon: TrendingUp },
    { id: 'actions', label: 'Action Usage', icon: Target },
    { id: 'locations', label: 'Locations', icon: Map },
    { id: 'balance', label: 'Balance', icon: Users },
    { id: 'analysis', label: 'Analysis', icon: GitBranch }
  ]
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <Activity className="logo-icon" />
          Deadwood Simulator Dashboard
        </h1>
        <div className="header-stats">
          <span>Total Games: {simulations.length}</span>
          {simulations.length > 0 && (
            <button onClick={clearSimulations} className="clear-button">
              Clear Data
            </button>
          )}
        </div>
      </header>
      
      <nav className="tab-nav">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </nav>
      
      <main className="app-content">
        {activeTab === 'simulator' && (
          <SimulatorControl 
            onSimulationsComplete={handleSimulationsComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        
        {activeTab === 'winrates' && (
          <div className="dashboard-grid">
            <WinRateChart simulations={simulations} />
            <GameLengthChart simulations={simulations} />
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div className="dashboard-grid">
            <ActionUsageChart simulations={simulations} />
            <StrategyPerformance simulations={simulations} />
          </div>
        )}
        
        {activeTab === 'locations' && (
          <LocationHeatmap simulations={simulations} />
        )}
        
        {activeTab === 'balance' && (
          <div className="dashboard-grid">
            <CharacterBalance simulations={simulations} />
            <FirstPlayerAdvantage simulations={simulations} />
          </div>
        )}
        
        {activeTab === 'analysis' && (
          <div className="dashboard-grid">
            <NashEquilibrium simulations={simulations} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App