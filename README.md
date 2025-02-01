# Remember Me AI

A modern web application for preserving and enhancing personal memories through AI-assisted storytelling.

## Project Overview

Remember Me AI helps users capture and develop their life stories with the assistance of AI technology. The application features:

- 🤖 AI-powered writing assistance
- 📝 Rich text editing capabilities
- 👥 Connection tracking for people mentioned in stories
- 📅 Timeline organization of memories
- 🎙️ Voice-to-text transcription
- 🔒 Secure authentication and data storage

## Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── auth/            # Authentication-related components
│   ├── chat/            # AI chat interface components
│   ├── common/          # Shared/reusable components
│   ├── connections/     # People/relationship management
│   ├── dashboard/       # Main user dashboard
│   ├── layout/          # Layout components and structure
│   ├── story/           # Story editing and management
│   └── timeline/        # Timeline visualization
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
│   ├── ai/             # AI-related hooks
│   └── memory/         # Memory analysis hooks
├── services/           # Core services and API integrations
│   ├── ai/             # AI service integration
│   ├── firebase/       # Firebase service integration
│   ├── langchain/      # LangChain integration
│   └── memory/         # Memory analysis services
├── store/              # Global state management (Zustand)
├── styles/             # Global styles and theme configuration
├── templates/          # Page templates and layouts
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

### Key Components

#### Authentication (`components/auth/`)
- `LoginModal.tsx`: Handles user authentication with email/password
- `AuthContext.tsx`: Manages authentication state and user sessions

#### Chat Interface (`components/chat/`)
- `ChatInterface.tsx`: Main AI chat interface
- `ChatInput.tsx`: Message input with voice recording
- `ChatMessage.tsx`: Message display component

#### Story Management (`components/story/`)
- `StoryEditor.tsx`: Main story editing interface
- `EditorContent.tsx`: Rich text editor implementation
- `AIAssistant.tsx`: AI writing assistance panel

#### Connections (`components/connections/`)
- `ConnectionsPanel.tsx`: Manages relationships and people
- `ConnectionsList.tsx`: Displays and filters connections
- `ConnectionDetail.tsx`: Shows detailed connection information

### Core Services

#### AI Service (`services/ai/`)
- Integration with OpenAI's GPT models
- Text analysis and enhancement
- Suggestion generation
- Memory context management

#### Firebase Service (`services/firebase/`)
- Authentication management
- Firestore database operations
- Real-time data synchronization

#### LangChain Integration (`services/langchain/`)
- Custom memory management
- Conversation chain handling
- Tool integration for enhanced AI capabilities

### State Management

The application uses Zustand for state management with several stores:

- `useChatStore`: Manages AI chat state and messages
- `useConnectionsStore`: Handles connection/relationship data
- `usePreferencesStore`: User preferences and settings
- `useStore`: General application state

### Styling

The project uses:
- Tailwind CSS for styling
- Custom theme configuration
- Responsive design principles
- Dark mode by default

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file with:

```
VITE_OPENAI_API_KEY=""
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
```

### Firebase Configuration

The project uses Firebase for:
- Authentication
- Firestore database
- Security rules
- Indexes for efficient queries

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### License

MIT License - see LICENSE file for details