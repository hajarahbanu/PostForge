import { useState, useEffect } from 'react'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import './App.css'

// Icon components
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'connected':
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    case 'disconnected':
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    default:
      return null
  }
}

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.003 9.003 0 01-5.455-1.838L3 18l1.838-3.545C3.667 13.245 3 11.75 3 10c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
)

const PostTypeIcons = {
  post: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  poll: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  image: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  auto_image: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  question_image: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function App() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [tools, setTools] = useState([])
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(new Date(Date.now() + 60000)) // Default: 1 minute from now
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'scheduled'

  // Initialize connection when component mounts
  useEffect(() => {
    initializeConnection()
    loadScheduledPosts()
  }, [])

  const initializeConnection = async () => {
    try {
      // Check if backend is running by trying to connect
      const response = await fetch('http://localhost:3001/sse')
      if (response.ok) {
        setIsConnected(true)
        // In a real app, you'd establish the SSE connection here
        // For now, we'll simulate having the tools available
        setTools([
          { name: 'createPost', description: 'Create a tweet' },
          { name: 'createPoll', description: 'Create a poll' },
          { name: 'createPostWithImage', description: 'Create tweet with image URL' },
          { name: 'createPostWithAutoImage', description: 'Create tweet with auto-found image' },
          { name: 'createQuestionWithImage', description: 'Create question post with image' }
        ])
        
        // Add welcome message
        setChatHistory([{
          role: 'system',
          message: 'Connected! You can now create tweets, polls, image posts, auto-image posts, question posts, and schedule them for later!',
          timestamp: new Date().toLocaleTimeString()
        }])
      }
    } catch (error) {
      console.error('Failed to connect to backend:', error)
      setChatHistory([{
        role: 'system',
        message: 'Failed to connect to backend. Make sure your server is running on port 3001.',
        timestamp: new Date().toLocaleTimeString()
      }])
    }
  }

  const loadScheduledPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/scheduled-posts')
      if (response.data.success) {
        setScheduledPosts(response.data.posts)
      }
    } catch (error) {
      console.error('Failed to load scheduled posts:', error)
    }
  }

  const sendMessage = async (isScheduled = false) => {
    if (!message.trim() || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      message: isScheduled ? `${userMessage} (scheduled for ${scheduledTime.toLocaleString()})` : userMessage,
      timestamp: new Date().toLocaleTimeString()
    }
    setChatHistory(prev => [...prev, newUserMessage])

    try {
      // Determine post type and prepare data
      const { postType, postData } = await determinePostTypeAndData(userMessage)
      
      let response = ''
      
      if (isScheduled) {
        // Schedule the post
        response = await schedulePost(postType, userMessage, postData)
      } else {
        // Post immediately
        response = await executePost(postType, userMessage, postData)
      }

      // Add AI response to chat
      const aiResponse = {
        role: 'assistant',
        message: response,
        timestamp: new Date().toLocaleTimeString()
      }
      setChatHistory(prev => [...prev, aiResponse])

      // Reload scheduled posts if we just scheduled one
      if (isScheduled) {
        await loadScheduledPosts()
      }

    } catch (error) {
      console.error('Error processing message:', error)
      const errorResponse = {
        role: 'assistant',
        message: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }
      setChatHistory(prev => [...prev, errorResponse])
    }

    setIsLoading(false)
    setShowScheduler(false)
  }

  // Helper function to determine post type and extract data
  const determinePostTypeAndData = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('poll') || lowerMessage.includes('vote')) {
      return {
        postType: 'poll',
        postData: {
          question: userMessage,
          // Don't provide default options - let the backend extract them
          options: null,
          durationMinutes: 1440
        }
      }
    } else if ((lowerMessage.includes('http://') || lowerMessage.includes('https://')) && 
               (lowerMessage.includes('image') || lowerMessage.includes('photo') || lowerMessage.includes('this image') || lowerMessage.includes('with this'))) {
      const urlMatch = userMessage.match(/(https?:\/\/[^\s]+)/i)
      const imageUrl = urlMatch ? urlMatch[0] : ''
      const cleanStatus = userMessage.replace(/(https?:\/\/[^\s]+)/i, '').replace(/with this image|with this|using this image|and this image/gi, '').trim()
      
      return {
        postType: 'image',
        postData: {
          status: cleanStatus,
          imageUrl
        }
      }
    } else if ((lowerMessage.includes('question') || lowerMessage.includes('ask')) && 
               (lowerMessage.includes('image') || lowerMessage.includes('photo') || lowerMessage.includes('relevant image'))) {
      return {
        postType: 'question_image',
        postData: {
          question: userMessage,
          searchQuery: extractKeywordsFromMessage(userMessage)
        }
      }
    } else if (lowerMessage.includes('relevant image') || 
               lowerMessage.includes('with image') || 
               lowerMessage.includes('with a image') ||
               lowerMessage.includes('with an image') ||
               (lowerMessage.includes('about') && lowerMessage.includes('image') && !lowerMessage.includes('http'))) {
      return {
        postType: 'auto_image',
        postData: {
          status: userMessage,
          searchQuery: extractKeywordsFromMessage(userMessage)
        }
      }
    } else {
      return {
        postType: 'post',
        postData: {
          status: userMessage
        }
      }
    }
  }

  // Schedule a post
  const schedulePost = async (postType, content, postData) => {
    try {
      const response = await axios.post('http://localhost:3001/api/schedule-post', {
        content,
        postType,
        scheduledTime: scheduledTime.toISOString(),
        metadata: postData
      })
      
      return `Post scheduled successfully - scheduled for ${scheduledTime.toLocaleString()}`
    } catch (error) {
      return `Failed to schedule post: ${error.response?.data?.message || error.message}`
    }
  }

  // Execute post immediately
  const executePost = async (postType, content, postData) => {
    switch (postType) {
      case 'poll':
        return await handlePollRequest(content)
      case 'image':
        return await handleImagePostRequest(content)
      case 'question_image':
        return await handleQuestionWithImageRequest(content)
      case 'auto_image':
        return await handleAutoImagePostRequest(content)
      default:
        return await handleRegularPostRequest(content)
    }
  }

  // Cancel a scheduled post
  const cancelScheduledPost = async (postId) => {
    try {
      await axios.delete(`http://localhost:3001/api/scheduled-posts/${postId}`)
      await loadScheduledPosts()
      
      // Add system message
      setChatHistory(prev => [...prev, {
        role: 'system',
        message: `Cancelled scheduled post #${postId}`,
        timestamp: new Date().toLocaleTimeString()
      }])
    } catch (error) {
      console.error('Failed to cancel post:', error)
    }
  }

  // Helper functions to handle different types of requests
  const handleRegularPostRequest = async (message) => {
    try {
      const response = await axios.post('http://localhost:3001/api/createPost', {
        status: message
      })
      return `Tweet posted successfully!`
    } catch (error) {
      return `Failed to post tweet: ${error.response?.data?.message || error.message}`
    }
  }

  const handlePollRequest = async (message) => {
    // Don't extract options here - let the backend handle it with AI
    const question = message
    
    try {
      const response = await axios.post('http://localhost:3001/api/createPoll', {
        question,
        options: [], // Send empty array to trigger AI extraction
        durationMinutes: 1440
      })
      return `Poll created successfully!`
    } catch (error) {
      return `Failed to create poll: ${error.response?.data?.message || error.message}`
    }
  }

  const handleImagePostRequest = async (message) => {
    // Extract URL from message (look for http or https)
    const urlMatch = message.match(/(https?:\/\/[^\s]+)/i)
    const imageUrl = urlMatch ? urlMatch[0] : ''
    
    // Remove the URL from the status text to avoid duplication
    const status = message.replace(/(https?:\/\/[^\s]+)/i, '').trim()
    
    // Clean up common phrases that indicate URL usage
    const cleanStatus = status
      .replace(/with this image/gi, '')
      .replace(/with this/gi, '')
      .replace(/using this image/gi, '')
      .replace(/and this image/gi, '')
      .trim()

    if (!imageUrl) {
      return 'Please provide a valid image URL (starting with http or https)'
    }

    console.log('Extracted URL:', imageUrl)
    console.log('Clean status:', cleanStatus)

    try {
      const response = await axios.post('http://localhost:3001/api/createPostWithImage', {
        status: cleanStatus,
        imageUrl
      })
      return `Tweet with image posted successfully!`
    } catch (error) {
      return `Failed to post tweet with image: ${error.response?.data?.message || error.message}`
    }
  }

  const handleAutoImagePostRequest = async (message) => {
    // Extract search keywords from message
    const searchQuery = extractKeywordsFromMessage(message)
    
    try {
      const response = await axios.post('http://localhost:3001/api/createPostWithAutoImage', {
        status: message,
        searchQuery
      })
      return `Tweet with auto-image posted successfully!`
    } catch (error) {
      return `Failed to post tweet with auto-image: ${error.response?.data?.message || error.message}`
    }
  }

  const handleQuestionWithImageRequest = async (message) => {
    const searchQuery = extractKeywordsFromMessage(message)
    
    try {
      const response = await axios.post('http://localhost:3001/api/createQuestionWithImage', {
        question: message,
        searchQuery
      })
      return `Question post with image created successfully!`
    } catch (error) {
      return `Failed to create question post with image: ${error.response?.data?.message || error.message}`
    }
  }

  const extractKeywordsFromMessage = (message) => {
    // Remove common phrases and focus on the main topic
    let cleanMessage = message.toLowerCase()
      .replace(/post a tweet about/gi, '')
      .replace(/post about/gi, '')
      .replace(/tweet about/gi, '')
      .replace(/with relevant image/gi, '')
      .replace(/with image/gi, '')
      .replace(/with a image/gi, '')
      .replace(/with an image/gi, '')
      .replace(/and image/gi, '')
      .trim()

    // Extract meaningful keywords
    const words = cleanMessage.split(' ')
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'or', 'but', 'for', 'from', 'with', 'about', 'that', 'this', 'will', 'are', 'was', 'were'].includes(word)
    )
    
    // Return the most relevant keywords (first 2-3 words)
    const keywords = meaningfulWords.slice(0, 3).join(' ')
    
    console.log('Original message:', message)
    console.log('Extracted keywords for image search:', keywords)
    
    return keywords || 'general'
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(false)
    }
  }

  // Format post status for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-amber-700 bg-amber-100 border-amber-200'
      case 'posted': return 'text-green-700 bg-green-100 border-green-200'
      case 'failed': return 'text-red-700 bg-red-100 border-red-200'
      case 'cancelled': return 'text-gray-600 bg-gray-100 border-gray-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatPostType = (postType) => {
    const types = {
      'post': 'Tweet',
      'poll': 'Poll',
      'image': 'Image Post',
      'auto_image': 'Auto Image',
      'question_image': 'Question + Image'
    }
    return types[postType] || postType
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TwitterIcon />
            <h1 className="text-2xl font-bold text-gray-900">X/Twitter Posting Tool</h1>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <StatusIcon status={isConnected ? 'connected' : 'disconnected'} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected to server' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'chat' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChatIcon />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'scheduled' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CalendarIcon />
                Scheduled ({scheduledPosts.filter(p => p.status === 'pending').length})
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <>
            {/* Chat History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Chat History</h2>
              </div>
              <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      chat.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : chat.role === 'system'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                      <p className="text-xs mt-1 opacity-70">{chat.timestamp}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <p className="text-sm">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {showScheduler && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <ClockIcon />
                    Schedule Post
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-blue-800 font-medium">Schedule for:</label>
                    <DatePicker
                      selected={scheduledTime}
                      onChange={setScheduledTime}
                      showTimeSelect
                      dateFormat="Pp"
                      minDate={new Date()}
                      className="p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setShowScheduler(false)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <CloseIcon />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here... (e.g., 'Create a poll asking what's the best programming language' or 'Post a tweet about AI with an image')"
                  className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  disabled={isLoading || !isConnected}
                />
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => sendMessage(false)}
                    disabled={isLoading || !isConnected || !message.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <SendIcon />
                    {isLoading ? 'Sending...' : 'Post Now'}
                  </button>
                  <button
                    onClick={() => showScheduler ? sendMessage(true) : setShowScheduler(true)}
                    disabled={isLoading || !isConnected || !message.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ClockIcon />
                    {showScheduler ? 'Schedule' : 'Schedule'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <button
                  onClick={() => setMessage("Create a poll asking what's the best programming language")}
                  className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-2 font-medium text-gray-800 mb-1">
                    <PostTypeIcons.poll />
                    Create a poll about programming languages
                  </div>
                  <p className="text-gray-600 text-xs">Creates a poll with relevant options extracted automatically</p>
                </button>
                <button
                  onClick={() => setMessage("Post a tweet about AI")}
                  className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-2 font-medium text-gray-800 mb-1">
                    <PostTypeIcons.post />
                    Post a tweet about AI
                  </div>
                  <p className="text-gray-600 text-xs">Creates a simple text tweet</p>
                </button>
                <button
                  onClick={() => setMessage("Post a tweet about Japanese food with this image https://example.com/sushi.jpg")}
                  className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-2 font-medium text-gray-800 mb-1">
                    <PostTypeIcons.image />
                    Post with specific image URL
                  </div>
                  <p className="text-gray-600 text-xs">Creates a tweet with your provided image</p>
                </button>
                <button
                  onClick={() => setMessage("Post about Indian food with relevant image")}
                  className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-2 font-medium text-gray-800 mb-1">
                    <PostTypeIcons.auto_image />
                    Post with auto-found image
                  </div>
                  <p className="text-gray-600 text-xs">Automatically finds and adds a relevant image</p>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Scheduled Posts Tab */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Scheduled Posts</h2>
              <button
                onClick={loadScheduledPosts}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <RefreshIcon />
                Refresh
              </button>
            </div>
            <div className="p-6">
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon />
                  <p className="mt-2">No scheduled posts yet. Create one using the chat!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 font-medium text-gray-800">
                            {PostTypeIcons[post.post_type] && PostTypeIcons[post.post_type]()}
                            {formatPostType(post.post_type)}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                            {post.status.toUpperCase()}
                          </span>
                        </div>
                        {post.status === 'pending' && (
                          <button
                            onClick={() => cancelScheduledPost(post.id)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            <TrashIcon />
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      <p className="text-gray-800 mb-3">{post.content}</p>
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <p className="flex items-center gap-2">
                          <ClockIcon />
                          Scheduled: {new Date(post.scheduled_time).toLocaleString()}
                        </p>
                        <p>Created: {new Date(post.created_at).toLocaleString()}</p>
                        {post.posted_at && (
                          <p className="text-green-600">Posted: {new Date(post.posted_at).toLocaleString()}</p>
                        )}
                        {post.error_message && (
                          <p className="text-red-600">Error: {post.error_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App