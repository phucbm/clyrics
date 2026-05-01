import { useState } from 'react'
import { useSongStore } from './store/useSongStore'
import { TabNav } from './components/TabNav'
import { InputView } from './components/InputView'
import { LyricsView } from './components/LyricsView'
import { FullscreenView } from './components/FullscreenView'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const { activeTab } = useSongStore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      {activeTab === 'input' && <InputView onOpenSettings={() => setShowSettings(true)} />}
      {activeTab === 'lyrics' && <LyricsView />}
      {activeTab === 'fullscreen' && <FullscreenView />}

      {activeTab !== 'fullscreen' && <TabNav />}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
