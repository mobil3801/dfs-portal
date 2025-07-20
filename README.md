# DFS Manager Portal

🚀 **A comprehensive management system for gas stations and fuel delivery services**

Built with React 18, TypeScript, and modern web technologies, this portal provides complete management capabilities for gas station operations, including inventory tracking, sales reporting, employee management, and more.

## 🌟 Features

- **📊 Sales Management**: Daily sales reports with comprehensive tracking
- **🚛 Delivery Tracking**: Fuel delivery management and monitoring
- **👥 Employee Management**: Staff tracking and payroll management
- **📋 Inventory Control**: Real-time inventory alerts and management
- **📄 License Management**: Track and monitor business licenses
- **💰 Financial Tracking**: Detailed financial reports and analytics
- **📱 Mobile Responsive**: Full mobile device support
- **🔐 Role-Based Access**: Secure user authentication and permissions
- **📧 SMS Alerts**: Automated notifications for important events
- **📈 Analytics Dashboard**: Real-time business insights

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: Radix UI, Shadcn/ui
- **Charts**: Recharts
- **Animation**: Motion/React
- **State Management**: React Query, Context API
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dfs-manager-portal.git

# Navigate to project directory
cd dfs-manager-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 📦 Deployment Options

### 🌐 Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
npm run deploy:netlify
```

### ▲ Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
npm run deploy:vercel
```

### 🐙 GitHub Pages
Push to main branch - GitHub Actions will automatically deploy

### 🐳 Docker
```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── Layout/         # Layout components
│   ├── ErrorBoundary/  # Error handling
│   └── ...             # Feature-specific components
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── Products/
│   ├── Sales/
│   ├── Employees/
│   └── ...
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── services/           # API and external services
├── utils/              # Utility functions
└── lib/                # Configuration and setup
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` for development:
```env
VITE_API_BASE_URL=your-api-url
VITE_APP_NAME="DFS Manager Portal"
```

### Build Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build with production optimizations
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Build for production |
| `preview` | Preview production build |
| `lint` | Run ESLint |
| `deploy:netlify` | Deploy to Netlify |
| `deploy:vercel` | Deploy to Vercel |
| `docker:build` | Build Docker image |
| `docker:run` | Run Docker container |

## 🔐 Security Features

- **Authentication**: Secure user login/logout
- **Authorization**: Role-based access control
- **Input Validation**: Form validation and sanitization
- **Error Handling**: Comprehensive error boundaries
- **Security Headers**: CSP, XSS protection, etc.

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Optimized for mobile workflows
- Progressive Web App (PWA) ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For deployment issues, check the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

For other support:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🚀 Production Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Built with ❤️ for efficient gas station management**