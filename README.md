# Frontend - Material Data Management (MDM) Portal

A modern, responsive web application built with Next.js 15 and React 19 for managing material data, requests, and governance processes.

## 🚀 Features

### Core Functionalities
- **Material Search & Management**: Search materials by number or description with intelligent matching
- **Dashboard Overview**: Comprehensive dashboard with statistics and recent activity tracking
- **Request Management**: Create and manage material requests and approvals
- **Indent System**: Material indent creation and management
- **Governance**: Access control and compliance management
- **User Authentication**: Secure login/signup system with role-based access

### Key Components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Search**: Instant material search with relevance scoring
- **Interactive UI**: Modern interface with smooth animations and transitions
- **Toast Notifications**: User feedback system for actions and errors
- **Sidebar Navigation**: Intuitive navigation with active state indicators

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Frontend**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Development**: ESLint, Turbopack
- **Package Manager**: npm

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (main)/                   # Main layout group
│   │   │   ├── layout.js            # Main layout wrapper
│   │   │   ├── page.js              # Home page (539 lines)
│   │   │   ├── login/               # Authentication pages
│   │   │   ├── signup/              # User registration
│   │   │   ├── search/              # Search functionality
│   │   │   ├── requests/            # Request management
│   │   │   ├── indent/              # Material indent system
│   │   │   └── governance/          # Access control & compliance
│   │   ├── dashboard/                # Dashboard pages
│   │   │   └── page.js              # Dashboard overview (108 lines)
│   │   ├── layout.js                # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/                   # Reusable UI components
│   │   ├── Sidebar.js               # Main navigation sidebar (115 lines)
│   │   ├── DashboardSidebar.js      # Dashboard-specific sidebar (111 lines)
│   │   ├── Navbar.js                # Top navigation bar (22 lines)
│   │   ├── MaterialTable.js         # Material data table (121 lines)
│   │   ├── AttributeFilter.js       # Material attribute filtering (52 lines)
│   │   ├── SearchBox.js             # Search input component (25 lines)
│   │   ├── Toast.js                 # Notification system (51 lines)
│   │   ├── IndentSidebar.js         # Indent-specific navigation
│   │   └── RequestForm.js           # Request creation form
│   ├── public/                       # Static assets
│   │   ├── file.svg                 # File icon
│   │   ├── globe.svg                # Globe icon
│   │   ├── next.svg                 # Next.js logo
│   │   ├── vercel.svg               # Vercel logo
│   │   └── window.svg               # Window icon
│   ├── package.json                  # Dependencies and scripts
│   ├── next.config.mjs              # Next.js configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.mjs           # PostCSS configuration
│   ├── eslint.config.mjs            # ESLint configuration
│   └── jsconfig.json                # JavaScript configuration
```

## 🎯 Key Pages & Routes

### Main Application (`/`)
- **Home Page** (`src/app/(main)/page.js`): Material search interface with statistics
- **Search Functionality**: Number-based and description-based material search
- **Material Management**: Add materials to indent, create new materials/groups
- **Statistics Display**: Total materials, groups, and active users

### Dashboard (`/dashboard`)
- **Overview Dashboard** (`src/app/dashboard/page.js`): Key metrics and quick actions
- **Statistics Grid**: Requests, employees, companies, and items counts
- **Recent Activity**: Timeline of system activities
- **Quick Actions**: Shortcuts to common tasks

### Authentication
- **Login** (`/login`): User authentication
- **Signup** (`/signup`): New user registration

### Core Features
- **Requests** (`/requests`): Material request management
- **Indent** (`/indent`): Material indent creation and management
- **Governance** (`/governance`): Access control and compliance
- **Search** (`/search`): Advanced material search

## 🔧 Component Details

### Sidebar Navigation (`src/components/Sidebar.js`)
- **Dynamic Navigation**: Context-aware menu items based on authentication status
- **User Status Display**: Shows logged-in user information
- **Active State**: Visual indicators for current page
- **Responsive Design**: Mobile-friendly navigation

### Material Table (`src/components/MaterialTable.js`)
- **Data Display**: Tabular material information presentation
- **Sorting & Filtering**: Advanced data manipulation capabilities
- **Action Buttons**: Quick actions for each material entry

### Toast Notifications (`src/components/Toast.js`)
- **User Feedback**: Success, error, and information messages
- **Auto-dismiss**: Automatic notification cleanup
- **Multiple Types**: Different styles for different message types

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
```

### Development Server
The application will be available at `http://localhost:3000`

## 🎨 Styling & Design

### Tailwind CSS
- **Utility-First**: Rapid UI development with utility classes
- **Responsive**: Mobile-first responsive design approach
- **Custom Components**: Reusable component library
- **Dark Mode Ready**: Built-in dark mode support

### Design System
- **Color Palette**: Professional color scheme with brand colors
- **Typography**: Consistent font hierarchy and spacing
- **Components**: Unified design language across all UI elements
- **Animations**: Smooth transitions and micro-interactions

## 🔐 Authentication & Security

### User Management
- **Local Storage**: User session management
- **Role-Based Access**: Different permissions for different user types
- **Secure Routes**: Protected page access
- **Session Persistence**: Maintains user state across page refreshes

### Data Security
- **Input Validation**: Client-side form validation
- **XSS Protection**: Built-in Next.js security features
- **CSRF Protection**: Cross-site request forgery prevention

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Mobile Features
- **Touch-Friendly**: Optimized for touch interactions
- **Collapsible Sidebar**: Mobile-optimized navigation
- **Responsive Tables**: Scrollable data tables on small screens

## 🧪 Development Guidelines

### Code Structure
- **Component-Based**: Modular, reusable component architecture
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Organization**: Grouped imports with clear separation

### Best Practices
- **Performance**: Optimized rendering with React 19 features
- **Accessibility**: ARIA labels and semantic HTML
- **SEO**: Next.js built-in SEO optimization
- **Testing**: Component testing ready structure

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
Create `.env.local` file for environment-specific configuration:
```env
NEXT_PUBLIC_API_URL=your_api_endpoint
NEXT_PUBLIC_APP_NAME=MDM Portal
```

### Deployment Platforms
- **Vercel**: Optimized for Next.js applications
- **Netlify**: Static site generation support
- **AWS/Azure**: Container-based deployment
- **Self-hosted**: Custom server configuration

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Implement changes with proper testing
3. Submit pull request with detailed description
4. Code review and approval process
5. Merge to main branch

### Code Standards
- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Consider migrating for better type safety
- **Testing**: Add tests for new features

## 📄 License

This project is proprietary software developed for Material Data Management purposes.

## 🆘 Support

For technical support or questions about the frontend application, please contact the development team or refer to the backend API documentation.

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**
