import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ChatLayout from './pages/Chat/ChatLayout'
import ChatMessagesSection from './pages/Chat/ChatMessagesSection'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ChatLayout_Context_Provider } from './contexts/ChatLayout-context-provider'
import ErrorFallback from './pages/ErrorFallback'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { WebSockets_ContextProvider } from './contexts/WebSockets-context-provider'
import { Global_ContextProvider } from './contexts/Global-context-provider'
import VideoCallSection from './pages/Chat/VideoCallSection'

const query_client=new QueryClient()


const router = createBrowserRouter([
  {
    path: '/',
    element: 
      <Home />
    ,
    errorElement:<ErrorFallback/>
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path:"/chats/:communityId?",
    element:
    <QueryClientProvider client={query_client}>
        <ChatLayout_Context_Provider>
          
            <WebSockets_ContextProvider>
            <ChatLayout />
          </WebSockets_ContextProvider>
         
        </ChatLayout_Context_Provider>
    </QueryClientProvider>

    ,
    errorElement:<ErrorFallback/>,
    children: [
      {
        path: ":channelId",
        element: 
        
          <ChatMessagesSection />

      },
      {
        path:":channelId/videocall",
        element: <VideoCallSection/>
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
    <Global_ContextProvider>
        <RouterProvider router={router} />
    </Global_ContextProvider>
  
)
