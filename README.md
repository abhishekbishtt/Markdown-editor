# React Markdown Editor

A modern, feature-rich Markdown editor built with React and Lexical. Write in Markdown and see your formatted content in real-time with a beautiful live preview.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![Lexical](https://img.shields.io/badge/Lexical-0.39-000000?logo=meta&logoColor=white)

## ✨ Features

### 📝 Rich Text Editing
- **Lexical Editor** - High-performance, extensible text editor framework by Meta
- **Markdown Syntax Support** - Full support for standard Markdown syntax
- **Formatting Toolbar** - Quick access buttons for common formatting options:
  - Bold, Italic, Strikethrough
  - Headings, Quotes, Lists
  - Links, Images, Dividers
  - Custom Highlight syntax (`==text==`)

### 👀 Live Preview
- **Real-time Rendering** - See your formatted Markdown instantly as you type
- **GitHub Flavored Markdown** - Support for tables, strikethrough, and more
- **XSS Protection** - Sanitized HTML output using DOMPurify

### 📊 Document Statistics
- Word count
- Character count (with and without spaces)
- Line count
- Paragraph count
- Estimated reading time

### 🔍 AI-Powered Grammar Check
- **Gemini AI Integration** - Intelligent grammar, spelling, and style analysis
- **One-Click Fixes** - Apply suggested corrections instantly
- **Categorized Issues** - Grammar, spelling, style, and punctuation feedback

### 💾 Auto-Save
- **LocalStorage Persistence** - Your work is automatically saved to browser storage
- **Debounced Saving** - Efficient save mechanism that doesn't impact performance

### 🌓 Theme Support
- **Light & Dark Mode** - Toggle between themes with a single click
- **System Preference Detection** - Automatically matches your OS theme preference
- **Persistent Theme Selection** - Your preference is saved across sessions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abhishekbishtt/Markdown-editor.git
cd Markdown-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **Vite** | Build Tool & Dev Server |
| **Lexical** | Rich Text Editor Framework |
| **Marked.js** | Markdown Parser |
| **DOMPurify** | HTML Sanitization |
| **Bulma CSS** | Styling Framework |
| **Lucide React** | Icon Library |
| **Gemini AI API** | Grammar Checking |

## 📁 Project Structure

```
react-markdown-editor/
├── public/
│   └── favicon.ico
├── src/
│   ├── App.jsx          # Main application component
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Markdown Syntax Reference

| Element | Syntax |
|---------|--------|
| Bold | `**text**` |
| Italic | `_text_` |
| Strikethrough | `~~text~~` |
| Highlight | `==text==` |
| Heading | `# Heading` |
| Blockquote | `> quote` |
| Unordered List | `- item` |
| Link | `[text](url)` |
| Image | `![alt](url)` |
| Horizontal Rule | `---` |

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
