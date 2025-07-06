@@ .. @@
   const { currentUser } = useAuth();
   const { getTotalUnreadCount } = useChat();
   const { getUnreadCount } = useNotifications();
  
  // Force re-render when unread counts change
  const [, setForceUpdate] = useState(0);
  
  // Update component when notifications or messages change
  useEffect(() => {
    const handleCountUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('notificationReceived', handleCountUpdate);
    window.addEventListener('notificationRead', handleCountUpdate);
    window.addEventListener('messageReceived', handleCountUpdate);
    window.addEventListener('messagesRead', handleCountUpdate);
    window.addEventListener('unreadCountsUpdated', handleCountUpdate);
    
    return () => {
      window.removeEventListener('notificationReceived', handleCountUpdate);
      window.removeEventListener('notificationRead', handleCountUpdate);
      window.removeEventListener('messageReceived', handleCountUpdate);
      window.removeEventListener('messagesRead', handleCountUpdate);
      window.removeEventListener('unreadCountsUpdated', handleCountUpdate);
    };
  }, []);