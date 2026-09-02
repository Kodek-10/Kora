import { useState } from 'react'
import Layout from './components/Layout'
import PostGenerator from './components/PostGenerator'
import History from './components/History'
import EditorialCalendar from './components/EditorialCalendar'
import Settings from './components/Settings'
import PostDetail from './components/PostDetail'

export default function App() {
  const [activeTab, setActiveTab] = useState('generate')
  const [prefilledSujet, setPrefilledSujet] = useState('')
  const [detailPost, setDetailPost] = useState(null)

  function handleSelectSujet(sujet) {
    setPrefilledSujet(sujet)
    setDetailPost(null)
    setActiveTab('generate')
  }

  function handleSelectPost(post) {
    setDetailPost(post)
  }

  function handleTabChange(tab) {
    setDetailPost(null)
    setActiveTab(tab)
  }

  function handleBackFromDetail() {
    setDetailPost(null)
  }

  function handleDeletedFromDetail() {
    setDetailPost(null)
  }

  // Quand on est sur le détail, on garde l'onglet Historique actif visuellement
  const layoutActiveTab = detailPost ? 'history' : activeTab

  return (
    <Layout activeTab={layoutActiveTab} onTabChange={handleTabChange}>
      {activeTab === 'generate' && <PostGenerator initialSujet={prefilledSujet} />}
      {activeTab === 'history' && detailPost && (
        <PostDetail postId={detailPost.id} initialPost={detailPost} onBack={handleBackFromDetail} onDeleted={handleDeletedFromDetail} />
      )}
      {activeTab === 'history' && !detailPost && <History onSelectPost={handleSelectPost} />}
      {activeTab === 'calendar' && <EditorialCalendar onSelectSujet={handleSelectSujet} />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  )
}
