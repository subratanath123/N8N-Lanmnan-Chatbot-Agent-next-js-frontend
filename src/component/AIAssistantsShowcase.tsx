"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type Assistant = {
    id: string;
    name: string;
    title: string;
    badge?: 'Premium' | 'Pro';
    avatar: string;
    accentColor: string;
    backgroundGradient: string;
    chatbotId: string;
    description?: string;
    categories: string[];
};

export const assistants: Assistant[] = [
    {
        id: 'support-bot',
        name: 'Support Bot',
        title: 'Customer Success Specialist',
        badge: 'Premium',
        avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=320&q=80',
        accentColor: '#E4EDFF',
        backgroundGradient: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)',
        chatbotId: 'support-bot-123',
        description:
            'Friendly and reliable support companion ready to answer customer questions around the clock with precise, helpful answers.',
        categories: ['Business', 'Coach'],
    },
    {
        id: 'sales-assistant',
        name: 'Sales Assistant',
        title: 'Revenue Growth Strategist',
        badge: 'Pro',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
        accentColor: '#E7FFE6',
        backgroundGradient: 'linear-gradient(180deg, #064e3b 0%, #047857 100%)',
        chatbotId: 'sales-bot-456',
        description:
            'Guides prospects through product benefits, handles objections gracefully, and highlights the perfect plan to close the deal.',
        categories: ['Business'],
    },
    {
        id: 'hr-helper',
        name: 'HR Helper',
        title: 'People Experience Advisor',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
        accentColor: '#FFE4F0',
        backgroundGradient: 'linear-gradient(180deg, #4c1d95 0%, #7e22ce 100%)',
        chatbotId: 'hr-bot-789',
        description:
            'Keeps your team informed about policies, benefits, and onboarding steps with a personable and approachable tone.',
        categories: ['Specialist', 'Coach'],
    },
    {
        id: 'relationship-coach',
        name: 'Relationship Coach',
        title: 'Connection Mentor',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
        accentColor: '#FFF4E5',
        backgroundGradient: 'linear-gradient(180deg, #9a3412 0%, #f97316 100%)',
        chatbotId: 'relationship-bot-333',
        description:
            'Offers thoughtful relationship guidance, communication tips, and compassionate support during difficult conversations.',
        categories: ['Coach', 'Health'],
    },
    {
        id: 'personal-trainer',
        name: 'Personal Trainer',
        title: 'Performance Coach',
        avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=320&q=80',
        accentColor: '#FFF7D6',
        backgroundGradient: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        chatbotId: 'trainer-bot-404',
        description:
            'Builds personalized workout plans, keeps you accountable, and celebrates each milestone on your fitness journey.',
        categories: ['Health'],
    },
    {
        id: 'confidence-coach',
        name: 'Confidence Coach',
        title: 'Mindset Architect',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
        accentColor: '#F5E8FF',
        backgroundGradient: 'linear-gradient(180deg, #3730a3 0%, #4c1d95 100%)',
        chatbotId: 'confidence-bot-505',
        description:
            'Provides daily mindset exercises, positive affirmations, and actionable advice to grow lasting confidence.',
        categories: ['Coach'],
    },
    {
        id: 'companion-ally',
        name: 'Companion Ally',
        title: 'Friend & Companion',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
        accentColor: '#FFF4E5',
        backgroundGradient: 'linear-gradient(180deg, #0f172a 0%, #1f2937 100%)',
        chatbotId: 'companion-bot-606',
        description:
            'Keeps you company with warm conversation, book recommendations, and uplifting reflections throughout the day.',
        categories: ['Leisure'],
    },
    {
        id: 'debate-mentor',
        name: 'Debate Mentor',
        title: 'Argument Strategist',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
        accentColor: '#E4EDFF',
        backgroundGradient: 'linear-gradient(180deg, #0f172a 0%, #2563eb 100%)',
        chatbotId: 'debate-bot-707',
        description:
            'Sharpens your critical thinking with structured arguments, counterpoints, and persuasive storytelling techniques.',
        categories: ['Specialist', 'Education'],
    },
];

const categories = ['All Chats', 'Business', 'Coach', 'Education', 'Health', 'Leisure', 'Specialist', 'Other'];

const tagColors: Record<string, string> = {
    Premium: '#C084FC',
    Pro: '#3B82F6',
};

export default function AIAssistantsShowcase() {
    const [activeCategory, setActiveCategory] = useState<string>('All Chats');
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const filteredAssistants = useMemo(() => {
        return assistants.filter((assistant) => {
            const matchesCategory =
                activeCategory === 'All Chats' ||
                assistant.categories.some((category) => category.toLowerCase() === activeCategory.toLowerCase());
            const matchesSearch =
                assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assistant.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchTerm]);

    return (
        <>
            <section
                style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: '32px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
                    marginBottom: '40px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginBottom: '24px',
                    }}
                >
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                            AI Chat Assistants
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '15px', margin: 0, maxWidth: '520px' }}>
                            Find your AI assistant quickly! Select an assistant to launch a conversation instantly.
                        </p>
                    </div>
                    <div
                        style={{
                            flex: '0 0 320px',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#f8fafc',
                            borderRadius: '999px',
                            padding: '10px 16px',
                            border: '1px solid rgba(148, 163, 184, 0.35)',
                        }}
                    >
                        <span role="img" aria-label="search" style={{ marginRight: '10px', color: '#94a3b8' }}>
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Search for an AI assistant..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '14px',
                                color: '#0f172a',
                            }}
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '24px',
                    }}
                >
                    {categories.map((category) => {
                        const isActive = category === activeCategory;
                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                style={{
                                    border: 'none',
                                    padding: '10px 18px',
                                    borderRadius: '999px',
                                    background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9',
                                    color: isActive ? '#ffffff' : '#1f2937',
                                    fontSize: '14px',
                                    fontWeight: isActive ? 600 : 500,
                                    cursor: 'pointer',
                                    boxShadow: isActive ? '0 12px 24px rgba(37, 99, 235, 0.24)' : 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {filteredAssistants.map((assistant) => (
                        <button
                            key={assistant.id}
                            onClick={() => router.push(`/ai-chat/${assistant.id}`)}
                            style={{
                                border: `2px solid ${assistant.accentColor}`,
                                borderRadius: '20px',
                                padding: '24px 20px',
                                background: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.1)',
                            }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: '96px',
                                    height: '96px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    boxShadow: `0 10px 20px ${assistant.accentColor}`,
                                }}
                            >
                                <img
                                    src={assistant.avatar}
                                    alt={assistant.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: '#facc15',
                                        boxShadow: '0 0 0 4px rgba(250, 204, 21, 0.25)',
                                    }}
                                />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                                    {assistant.name}
                                </h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{assistant.title}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {assistant.badge && (
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            padding: '6px 10px',
                                            borderRadius: '999px',
                                            backgroundColor: `${tagColors[assistant.badge]}20`,
                                            color: tagColors[assistant.badge],
                                        }}
                                    >
                                        {assistant.badge}
                                    </span>
                                )}
                                {assistant.categories.map((category) => (
                                    <span
                                        key={category}
                                        style={{
                                            fontSize: '12px',
                                            padding: '6px 10px',
                                            borderRadius: '999px',
                                            backgroundColor: '#f1f5f9',
                                            color: '#475569',
                                        }}
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </section>

        </>
    );
}

