import { useState, useEffect } from 'react';
import { PASTE_COMMAND, createCommand, $getRoot, $getSelection, $isRangeSelection, $createParagraphNode, $createTextNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  Bold, Italic, Heading1, Highlighter, Quote, List, FileText, Eye,
  Minus, Link, Image, Strikethrough, ChevronDown, SpellCheck, X, Check,
  Loader2, Copy, Type, Moon, Sun
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const initialConfig = {
  namespace: 'markdown-editor',
  onError: (error) => console.error('Editor Error:', error),
};

const INSERT_MARKDOWN_COMMAND = createCommand();

function useDebouncedEffect(callback, delay) {
  useEffect(() => {
    const handler = setTimeout(() => callback(), delay);
    return () => clearTimeout(handler);
  }, [callback, delay]);
}

// eslint-disable-next-line react/prop-types
function Alert({ message, type }) {
  const bgColors = {
    success: 'is-success',
    danger: 'is-danger',
    warning: 'is-warning'
  };
  return <div className={`notification ${bgColors[type]} alert-fade`}>{message}</div>;
}

function Editor() {
  const [editor] = useLexicalComposerContext();
  const [markdown, setMarkdown] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    lines: 0,
    paragraphs: 0,
    readingTime: 0
  });
  const [alert, setAlert] = useState(null);
  const [grammarResults, setGrammarResults] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [showGrammarPanel, setShowGrammarPanel] = useState(false);

  // Gemini API Configuration - Replace with your actual API key
  const GEMINI_API_KEY = 'AIzaSyAeNLpS_aKeoc2uBqwfYO9q3HK9IElhs2c';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('editor-state');
      if (savedState) {
        editor.update(() => {
          const parsedState = editor.parseEditorState(savedState);
          editor.setEditorState(parsedState);
        });
      }
    } catch (error) {
      console.error('Error loading editor state:', error);
    }
  }, [editor]);

  useDebouncedEffect(() => {
    try {
      const editorState = editor.getEditorState();
      const serializedState = JSON.stringify(editorState.toJSON());
      localStorage.setItem('editor-state', serializedState);
    } catch (error) {
      console.error('Error saving editor state:', error);
    }
  }, 500, [editor]);

  const handleEditorChange = (editorState) => {
    editorState.read(() => {
      const text = $getRoot().getTextContent();
      const trimmedText = text.trim();
      setMarkdown(trimmedText);

      // Words: split by whitespace, filter empty
      const words = trimmedText ? trimmedText.split(/\s+/).filter(Boolean).length : 0;

      // Characters (with spaces)
      const chars = text.length;

      // Characters (no spaces)
      const charsNoSpaces = text.replace(/\s/g, '').length;

      // Lines
      const lines = text ? text.split('\n').length : 0;

      // Paragraphs (non-empty lines/blocks)
      const paragraphs = trimmedText ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;

      // Reading time (~200 words per minute)
      const readingTime = Math.max(1, Math.ceil(words / 200));

      setStats({ words, chars, charsNoSpaces, lines, paragraphs, readingTime });
    });
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      showAlert('Copied to clipboard', 'success');
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      showAlert('Failed to copy', 'danger');
    }
  };

  const checkGrammar = async () => {
    if (!markdown.trim()) {
      showAlert('Please enter some text first', 'warning');
      return;
    }

    setIsChecking(true);
    setShowGrammarPanel(true);
    setGrammarResults([]);

    try {
      const prompt = `Analyze the following text for grammar, spelling, and style issues. Return a JSON array of issues found. Each issue should have:
- "original": the problematic text
- "suggestion": the corrected version
- "reason": brief explanation of the issue
- "type": one of "grammar", "spelling", "style", or "punctuation"

If no issues are found, return an empty array [].

IMPORTANT: Return ONLY the JSON array, no other text or markdown formatting.

Text to analyze:
"""
${markdown}
"""`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

      // Parse JSON from response (handle potential markdown code blocks)
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const issues = JSON.parse(cleanJson);
      setGrammarResults(issues);

      if (issues.length === 0) {
        showAlert('No issues found!', 'success');
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      showAlert('Failed to check grammar', 'danger');
      setGrammarResults([]);
    } finally {
      setIsChecking(false);
    }
  };

  const applyGrammarFix = (original, suggestion) => {
    editor.update(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      const newText = text.replace(original, suggestion);

      // Clear the root and rebuild with paragraphs
      root.clear();

      // Split by newlines and create paragraphs
      const lines = newText.split('\n');
      lines.forEach((line) => {
        const paragraph = $createParagraphNode();
        if (line) {
          paragraph.append($createTextNode(line));
        }
        root.append(paragraph);
      });
    });

    // Remove the applied fix from results
    setGrammarResults(prev => prev.filter(r => r.original !== original));
    showAlert('Fix applied', 'success');
  };

  const insertMarkdown = (symbol, wrapText = false) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const text = selection.getTextContent();
      const newText = wrapText ? `${symbol}${text}${symbol}` : `${symbol}${text}`;

      // Remove selected text first, then insert the new text
      selection.removeText();
      selection.insertText(newText);
    });
  };

  useEffect(() => {
    return editor.registerCommand(
      INSERT_MARKDOWN_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = editor.getSelection();
          if (!$isRangeSelection(selection)) return;
          selection.insertText(payload);
        });
        return true;
      },
      0
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (event.clipboardData) {
          const text = event.clipboardData.getData('text/plain');
          event.preventDefault();
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            const lines = text.split('\n');
            lines.forEach((line, index) => {
              if (index > 0) selection.insertText('\n');
              selection.insertText(line);
            });
          });
          return true;
        }
        return false;
      },
      1
    );
  }, [editor]);

  // Configure marked for proper parsing
  marked.setOptions({
    breaks: true,
    gfm: true, // GitHub Flavored Markdown for strikethrough, tables, etc.
  });

  // First handle highlight syntax, then parse with marked
  const processedMarkdown = markdown.replace(/==(.*?)==/g, '<mark>$1</mark>');
  const rawHtml = marked.parse(processedMarkdown);

  // Sanitize but allow formatting tags
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'del', 's', 'mark',
      'a', 'img', 'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });

  // Toolbar button component
  const ToolbarButton = ({ icon: Icon, onClick, title }) => (
    <button className="toolbar-btn" onClick={onClick} title={title}>
      <Icon size={18} strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="container mt-5">
      {alert && <Alert message={alert.message} type={alert.type} />}

      {/* Editor Card */}
      <div className="card">
        <div className="card-content">
          <div className="section-header">
            <Type size={18} strokeWidth={1.5} />
            <h2>Editor</h2>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <ToolbarButton icon={Bold} onClick={() => insertMarkdown('**', true)} title="Bold" />
            <ToolbarButton icon={Italic} onClick={() => insertMarkdown('_', true)} title="Italic" />
            <ToolbarButton icon={Strikethrough} onClick={() => insertMarkdown('~~', true)} title="Strikethrough" />
            <ToolbarButton icon={Highlighter} onClick={() => insertMarkdown('==', true)} title="Highlight" />

            <div className="toolbar-divider" />

            <ToolbarButton icon={Heading1} onClick={() => insertMarkdown('# ', false)} title="Heading" />
            <ToolbarButton icon={Quote} onClick={() => insertMarkdown('> ', false)} title="Quote" />
            <ToolbarButton icon={List} onClick={() => insertMarkdown('- ', false)} title="List" />
            <ToolbarButton icon={Minus} onClick={() => insertMarkdown('\n---\n', false)} title="Divider" />

            <div className="toolbar-divider" />

            <ToolbarButton icon={Link} onClick={() => insertMarkdown('[Text](https://medit.pages.dev/)', false)} title="Link" />
            <ToolbarButton icon={Image} onClick={() => insertMarkdown('![Alt text](/favicon.ico)', false)} title="Image" />
            <ToolbarButton icon={ChevronDown} onClick={() => insertMarkdown('<br>', false)} title="Line Break" />

            <div className="toolbar-divider" />

            <ToolbarButton icon={Copy} onClick={copyToClipboard} title="Copy" />
            <button
              className="toolbar-btn"
              onClick={checkGrammar}
              disabled={isChecking}
              title="Check Grammar"
            >
              {isChecking ? <Loader2 size={18} className="spin" /> : <SpellCheck size={18} strokeWidth={1.5} />}
            </button>
          </div>

          {/* Editor */}
          <div className="editor-container">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<p style={{ position: 'absolute', top: '1rem', left: '1rem', color: '#999', pointerEvents: 'none' }}>Start typing...</p>}
            />
          </div>
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />

          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <span>{stats.words}</span> words
            </div>
            <div className="stat-item">
              <span>{stats.chars}</span> chars
            </div>
            <div className="stat-item">
              <span>{stats.charsNoSpaces}</span> no spaces
            </div>
            <div className="stat-item">
              <span>{stats.lines}</span> lines
            </div>
            <div className="stat-item">
              <span>{stats.paragraphs}</span> paragraphs
            </div>
            <div className="stat-item">
              ~<span>{stats.readingTime}</span> min read
            </div>
          </div>
        </div>
      </div>

      {/* Grammar Check Results Panel */}
      {showGrammarPanel && (
        <div className="card mt-4 grammar-panel">
          <div className="card-content">
            <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
              <div className="section-header" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                <SpellCheck size={18} strokeWidth={1.5} />
                <h2>Grammar Check</h2>
              </div>
              <button className="close-btn" onClick={() => setShowGrammarPanel(false)}>
                <X size={18} />
              </button>
            </div>

            {isChecking ? (
              <div className="loading-state">
                <Loader2 size={24} className="spin" />
                <p>Analyzing your text...</p>
              </div>
            ) : grammarResults.length === 0 ? (
              <div className="notification is-success">
                <Check size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                No issues found. Your text looks great!
              </div>
            ) : (
              <div className="grammar-results">
                <p style={{ marginBottom: '1rem', color: '#666' }}>
                  Found {grammarResults.length} issue{grammarResults.length > 1 ? 's' : ''}
                </p>
                {grammarResults.map((issue, index) => (
                  <div key={index} className="grammar-issue">
                    <div className="is-flex is-justify-content-space-between is-align-items-start">
                      <div className="grammar-issue-content">
                        <span className={`grammar-type-tag ${issue.type}`}>
                          {issue.type}
                        </span>
                        <p style={{ marginBottom: '8px' }}>
                          <span style={{ textDecoration: 'line-through', color: '#999' }}>{issue.original}</span>
                          <span style={{ margin: '0 8px', color: '#999' }}>→</span>
                          <strong>{issue.suggestion}</strong>
                        </p>
                        <p style={{ fontSize: '13px', color: '#666' }}>{issue.reason}</p>
                      </div>
                      <button className="apply-btn" onClick={() => applyGrammarFix(issue.original, issue.suggestion)}>
                        <Check size={14} />
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Card */}
      <div className="card mt-4">
        <div className="card-content">
          <div className="section-header">
            <Eye size={18} strokeWidth={1.5} />
            <h2>Preview</h2>
          </div>
          <div className="content" style={{ minHeight: '200px' }}>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanHtml) }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('editor-theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('editor-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="section">
      <div className="page-header">
        <FileText size={28} strokeWidth={1.5} />
        <h1>Markdown Editor</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
        </button>
      </div>
      <LexicalComposer initialConfig={initialConfig}>
        <Editor />
      </LexicalComposer>
    </div>
  );
}

export default App;
