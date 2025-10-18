export enum Platform {
    Blog = 'Blog',
    Instagram = 'Instagram',
    Facebook = 'Facebook',
    X = 'X',
    TikTok = 'TikTok',
    Bluesky = 'Bluesky',
    LinkedIn = 'LinkedIn',
    PressRelease = 'Press Release',
    YouTube = 'YouTube',
    Podcast = 'Podcast'
}

export enum PostStatus {
    Draft = 'Draft',
    ForReview = 'For Review',
    Approved = 'Approved',
    Published = 'Published',
    Archived = 'Archived'
}

export interface Client {
    id: string;
    name: string;
    contactName?: string;
    contactEmail?: string;
    notes?: string;
}

export interface Post {
    id: string;
    platform: Platform;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    trendingTopics?: string[];
    groundingSources?: { title: string; uri: string }[];
    category?: string;
    status: PostStatus;
    createdAt: string; // ISO String
    generationOptions?: GenerationOptions;
    clientId: string;
    internalNotes?: string;
    clientFeedback?: string;
}

export interface ResearchReport {
    sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
    summary: string;
    keywordsToInclude: string[];
    keywordsToExclude: string[];
    negativePrompt: string;
    sfxPrompt?: string;
}

export interface GenerationOptions {
    topic: string;
    sourceUrl?: string;
    targetAudience: string;
    tone: string;
    platforms: Platform[];
    includeImage: boolean;
    includeVideo: boolean;
    useTrendingTopics: boolean;
    category: string;
    keywordsToInclude: string;
    keywordsToExclude: string;
    negativePrompt: string;
    research?: ResearchReport;
    clientId: string;
    imageModel?: string;
    videoModel?: string;
    musicPrompt?: string;
    sfxPrompt?: string;
}

export interface Project {
    id: string;
    name: string;
    clientId: string;
    topic: string;
    sourceUrl?: string;
    targetAudience: string;
    tone: string;
    category: string;
    keywordsToInclude: string;
    keywordsToExclude: string;
    negativePrompt: string;
    research?: ResearchReport;
    sfxPrompt?: string;
}


export interface GenerationState {
    status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
    message: string;
}

export interface User {
    name: string;
    email: string;
    avatarUrl: string;
    walletBalance: number;
}

export interface UserSettings {
    apiKeyOption: 'platform' | 'custom';
    customGoogleApiKey?: string;
    customElevenLabsApiKey?: string;
}

export type ApiKeys = {
    google?: string;
    elevenlabs?: string;
};