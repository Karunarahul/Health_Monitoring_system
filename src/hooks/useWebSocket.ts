import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('vitals_update', (data) => {
      setLastMessage(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}