import { useState } from 'react'
import Layout from './components/Layout'
import PostGenerator from './components/PostGenerator'
import History from './components/History'
import EditorialCalendar from './components/EditorialCalendar'

export default function App() {
  const [activeTab, setActiveTab] = useState('generate')
  const [prefilledSujet, setPrefilledSujet] = useState('')

  function handleSelectSujet(sujet) {
    setPrefilledSujet(sujet)
    setActiveTab('generate')
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'generate' && <PostGenerator initialSujet={prefilledSujet} />}
      {activeTab === 'history' && <History />}
      {activeTab === 'calendar' && <EditorialCalendar onSelectSujet={handleSelectSujet} />}
    </Layout>
  )
}
