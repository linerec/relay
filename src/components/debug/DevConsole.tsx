import React, { useState, useEffect, useRef } from 'react';
import './DevConsole.css';

interface LogMessage {
    timestamp: string;
    message: string;
}

export const DevConsole: React.FC = () => {
    const [messages, setMessages] = useState<LogMessage[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isDev = import.meta.env.VITE_DEV_MODE === 'true';

    useEffect(() => {
        if (!isDev) return;

        const logMessage = (message: string) => {
            const timestamp = new Date().toLocaleTimeString();
            setMessages(prev => [...prev, { timestamp, message }]);
        };

        // 전역 이벤트 리스너 등록
        window.addEventListener('dev-log', ((e: CustomEvent) => {
            logMessage(e.detail);
        }) as EventListener);

        return () => {
            window.removeEventListener('dev-log', ((e: CustomEvent) => {
                logMessage(e.detail);
            }) as EventListener);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isDev) return null;

    return (
        <div className={`dev-console ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="dev-console-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                Dev Console {isCollapsed ? '▼' : '▲'}
            </div>
            {!isCollapsed && (
                <div className="dev-console-content">
                    {messages.map((msg, index) => (
                        <div key={index} className="dev-console-message">
                            <span className="timestamp">{msg.timestamp}</span>
                            <span className="message">{msg.message}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    );
}; 