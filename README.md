# Nizar's Chat

A sophisticated, full-stack AI chat application built with modern web technologies, featuring support for multiple AI providers, file attachments, conversation management, and advanced AI capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Convex](https://img.shields.io/badge/Convex-1.24.8-purple)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-teal)

## 🌟 Features

### 🤖 Multi-Provider AI Support

**Supported Models:**
- **OpenAI**: GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o, GPT-4o Mini, o4-mini (with reasoning)
- **Anthropic**: Claude 4 Sonnet (with reasoning mode)
- **Google**: Gemini 2.0 Flash, Gemini 2.5 Flash (with thinking), Gemini 2.5 Pro (with reasoning)
- **DeepSeek**: R1 (0528), R1 Llama Distilled
- **OpenRouter**: Access to all the models through OpenRouter API
- **Image Generation**: GPT ImageGen for AI image creation

### 💬 Advanced Chat Features
- **Real-time Streaming**: Live response streaming with smooth animations and resumable streams
- **Markdown Rendering**: Full markdown support with syntax highlighting
- **Thread Management**: Organize conversations with folders, tags, and pinning
- **Thread Branching**: Create conversation branches from any message
- **Conversation Sharing**: Share public links to conversations
- **Message Actions**: Edit, retry, branch, and regenerate messages
- **Model Switching**: Change AI models mid-conversation
- **Search Integration**: Web search capabilities for supported models

### 📎 Rich File Support
- **Multiple Formats**: Text files, images, PDFs, code files
- **Drag & Drop**: Intuitive file upload interface
- **Visual Previews**: In-app preview for images, PDFs, and text files
- **Smart Processing**: Context-aware file handling based on model capabilities
- **Attachment Management**: Organize and manage uploaded files

### 🎛️ Advanced Controls
- **Model Parameters**: Fine-tune temperature, top-p, max tokens, and more
- **Reasoning Effort**: Control thinking depth for reasoning models
- **Voice Input**: Speech-to-text integration
- **API Key Management**: Secure storage and management of API keys

### 📊 Analytics & Management
- **Gallery View**: Browse generated images with multiple view modes
- **Attachment Analytics**: File storage insights and management

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 15.3.3 with App Router
- **UI**: React 19.1.0 with TypeScript 5
- **Styling**: Tailwind CSS 4 with custom design system
- **Components**: shadcn/ui components with custom styling
- **State**: React Context + Convex real-time subscriptions
- **Routing**: React Router DOM
- **AI SDK**: Vercel AI SDK for streaming responses

### Backend & Database
- **BaaS**: Convex for real-time database and API functions
- **Authentication**: Better Auth with email/password
- **File Storage**: Convex file storage with signed URLs
- **Caching**: Redis for session management and caching

### AI Integration
- **Streaming**: Real-time response streaming with resumable connections
- **Multi-provider**: Unified interface for different AI providers
- **Error Handling**: Robust error recovery and retry mechanisms
- **Token Management**: Usage tracking and quota monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ (required for react-pdf)
- npm/pnpm/yarn
- Convex account
- AI provider API keys (OpenAI, Anthropic, Google, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/nizarlj/nizars-chat.git
cd nizars-chat
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up Convex**
```bash
npx convex dev
```

4. **Configure environment variables for Next.js**
Create `.env.local` and add your API keys:
```env
# Convex
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# AI Provider Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
OPENROUTER_API_KEY=your-openrouter-key

# Redis (optional)
REDIS_URL=your-redis-url
```

5. **Configure environment variables for Convex**
```env
# Auth & Security
BETTER_AUTH_SECRET=your-auth-secret
SITE_URL=http://localhost:3000
API_KEY_ENCRYPTION_KEY=your-encryption-key
```

6. **Run the development server**
```bash
pnpm run dev
```

This starts both the Next.js frontend and Convex backend concurrently.

### Available Scripts

```bash
npm run dev:frontend    # Start Next.js only
npm run dev:backend     # Start Convex only  
npm run dev             # Start both concurrently
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

## 🔧 Configuration

### AI Model Configuration
Models are configured in `src/lib/models.ts` with capabilities and parameters:

```typescript
{
  id: "gpt-4.1",
  name: "GPT-4.1", 
  provider: "openai",
  capabilities: {
    vision: true,
    reasoning: false,
    maxTokens: 32768,
    contextWindow: 1047576
  }
}
```

### Database Schema
The Convex schema defines the data structure:

- **Users**: Authentication and profile data
- **Threads**: Conversation containers with metadata
- **Messages**: Individual chat messages with AI responses
- **Attachments**: File uploads with metadata
- **API Keys**: Encrypted user API keys
- **User Preferences**: Settings and model preferences

### Authentication
Uses Better Auth for secure authentication:
- Email/password authentication
- Session management with Convex
- Protected routes and API endpoints

## 🚀 Deployment

### Vercel Deployment (Recommended)
For detailed instructions on deploying to Vercel with Convex, see the [official Convex Vercel hosting guide](https://docs.convex.dev/production/hosting/vercel).

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Self-Hosting
1. Build the application: `npm run build`
2. Set up a Node.js server with environment variables
3. Configure Convex deployment for production
4. Set up Redis for session storage

### Environment Setup
Ensure all required environment variables are configured:
- Convex deployment URL and credentials
- AI provider API keys
- Redis connection string
- Authentication secrets

## 🤝 Contributing

Feel free to:
1. Fork the repository
2. Make your changes
3. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vercel**: Next.js framework and AI SDK
- **Convex**: Real-time backend infrastructure  
- **shadcn/ui**: Beautiful component library
- **Tailwind CSS**: Utility-first CSS framework
- **AI Providers**: OpenAI, Anthropic, Google, DeepSeek, and others
- **Open Source Community**: Various libraries and tools used

---

Built by Nizar 🥸
