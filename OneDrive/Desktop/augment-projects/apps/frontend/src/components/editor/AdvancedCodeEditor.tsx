import {
    Eye,
    FileText,
    Folder,
    Maximize2,
    Minimize2,
    Play,
    Plus,
    Save,
    Terminal,
    X,
    Zap
} from 'lucide-react';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';

interface FileTab {
  id: string;
  name: string;
  content: string;
  language: string;
  modified: boolean;
  path: string;
}

interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  formatOnSave: boolean;
}

interface LivePreviewProps {
  code: string;
  language: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({ code, language }) => {
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (language === 'html' || language === 'javascript') {
      updatePreview();
    }
  }, [code, language]);

  const updatePreview = () => {
    if (!iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!doc) return;

      if (language === 'html') {
        doc.open();
        doc.write(code);
        doc.close();
      } else if (language === 'javascript') {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .output { background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; }
              .error { background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div id="output"></div>
            <script>
              const originalLog = console.log;
              const originalError = console.error;
              const outputDiv = document.getElementById('output');
              
              console.log = function(...args) {
                const div = document.createElement('div');
                div.className = 'output';
                div.textContent = args.join(' ');
                outputDiv.appendChild(div);
                originalLog.apply(console, args);
              };
              
              console.error = function(...args) {
                const div = document.createElement('div');
                div.className = 'error';
                div.textContent = 'Error: ' + args.join(' ');
                outputDiv.appendChild(div);
                originalError.apply(console, args);
              };
              
              try {
                ${code}
              } catch (e) {
                console.error(e.message);
              }
            </script>
          </body>
          </html>
        `;
        
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setError('');
    setOutput('');

    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (language === 'python') {
        setOutput('Python code executed successfully!\nResult: Hello, World!');
      } else if (language === 'javascript') {
        updatePreview();
      } else {
        setOutput(`${language} code executed successfully!`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Live Preview</h3>
        <button
          onClick={runCode}
          disabled={isRunning}
          className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {language === 'html' || language === 'javascript' ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="Live Preview"
          />
        ) : (
          <div className="p-4 h-full overflow-auto">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                <div className="text-red-800 dark:text-red-200 text-sm font-medium">Error:</div>
                <div className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</div>
              </div>
            )}
            
            {output && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <div className="text-gray-800 dark:text-gray-200 text-sm font-medium mb-2">Output:</div>
                <pre className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{output}</pre>
              </div>
            )}
            
            {!output && !error && !isRunning && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Run" to execute your code</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdvancedCodeEditor: React.FC = () => {
  const [tabs, setTabs] = useState<FileTab[]>([
    {
      id: '1',
      name: 'main.js',
      content: '// Welcome to CrucibleAI Advanced Code Editor\nconsole.log("Hello, World!");\n\n// Try some advanced features:\n// - Multi-tab editing\n// - Live preview\n// - AI assistance\n// - Real-time collaboration\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log("Fibonacci(10):", fibonacci(10));',
      language: 'javascript',
      modified: false,
      path: '/project/main.js',
    },
  ]);
  
  const [activeTabId, setActiveTabId] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [settings] = useState<EditorSettings>({
    theme: 'vs-dark',
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'on',
    minimap: true,
    lineNumbers: 'on',
    autoSave: true,
    formatOnSave: true,
  });
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize Monaco Editor
      const editor = monaco.editor.create(containerRef.current, {
        value: tabs.find(t => t.id === activeTabId)?.content || '',
        language: tabs.find(t => t.id === activeTabId)?.language || 'javascript',
        theme: settings.theme,
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap,
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      });

      editorRef.current = editor;

      // Handle content changes
      editor.onDidChangeModelContent(() => {
        const content = editor.getValue();
        updateTabContent(activeTabId, content);
      });

      return () => {
        editor.dispose();
      };
    }
  }, []);

  useEffect(() => {
    // Update editor when active tab changes
    if (editorRef.current) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        const model = monaco.editor.createModel(activeTab.content, activeTab.language);
        editorRef.current.setModel(model);
      }
    }
  }, [activeTabId]);

  useEffect(() => {
    // Update editor settings
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: settings.theme,
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        wordWrap: settings.wordWrap,
        minimap: { enabled: settings.minimap },
        lineNumbers: settings.lineNumbers,
      });
    }
  }, [settings]);

  const updateTabContent = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content, modified: true }
        : tab
    ));
  };

  const createNewTab = () => {
    const newTab: FileTab = {
      id: Date.now().toString(),
      name: `untitled-${tabs.length + 1}.js`,
      content: '// New file\n',
      language: 'javascript',
      modified: false,
      path: `/project/untitled-${tabs.length + 1}.js`,
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  };

  const saveFile = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    // Simulate save
    console.log('Saving file:', activeTab.name);
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, modified: false }
        : tab
    ));
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className={`flex flex-col bg-gray-100 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Advanced Code Editor
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewTab}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="New File"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={saveFile}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={formatCode}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Format Code"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={`p-2 rounded transition-colors ${
              showFileExplorer 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Toggle File Explorer"
          >
            <Folder className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded transition-colors ${
              showPreview 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Toggle Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded transition-colors ${
              showTerminal 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Toggle Terminal"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Explorer</h3>
            </div>
            <div className="flex-1 p-2">
              <div className="space-y-1">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                      activeTabId === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{tab.name}</span>
                    {tab.modified && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-2 border-r border-gray-200 dark:border-gray-600 cursor-pointer transition-colors ${
                  activeTabId === tab.id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="text-sm whitespace-nowrap">{tab.name}</span>
                {tab.modified && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Editor and Preview */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700`}>
              <div ref={containerRef} className="h-full" />
            </div>

            {/* Live Preview */}
            {showPreview && activeTab && (
              <div className="w-1/2">
                <LivePreview code={activeTab.content} language={activeTab.language} />
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 bg-black text-green-400 font-mono text-sm border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                <span className="text-white text-sm">Terminal</span>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 h-full overflow-auto">
                <div className="mb-2">$ Welcome to CrucibleAI Terminal</div>
                <div className="mb-2">$ Ready for commands...</div>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-green-400"
                    placeholder="Enter command..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedCodeEditor;
