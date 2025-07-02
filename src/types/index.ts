export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'technician' | 'admin';
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  phone?: string;
  department?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  isSystem?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'ticket-assigned' | 'ticket-updated' | 'new-message' | 'ticket-created';
  title: string;
  message: string;
  ticketId: string;
  userId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatRoom {
  ticketId: string;
  participants: string[];
  unreadCount: Record<string, number>;
  lastMessage?: ChatMessage;
}