import React, { useState, useCallback } from 'react';
import { Code2, Cpu, BookOpen, Terminal } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import OutputConsole from './components/OutputConsole';
import REPL from './components/REPL';
import LanguageReference from './components/LanguageReference';
import { Lexer } from './interpreter/lexer';
import { Parser } from './interpreter/parser';
import { Interpreter } from './interpreter/interpreter';

type Tab = 'editor' | 'repl' | 'reference';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [code, setCode] = useState(`# Welcome to EasyLang! 🚀
# A programming language designed for simplicity

# Variable declaration
banao name = "EasyLang Programmer"
banao version = 1.0

# Constants
sada GREETING = "Assalam o Alaikum!"

# Print statements
likho GREETING
likho "Your name: " + name
likho "Version: " + version

# Conditional example
banao score = 95
agar score >= 90:
    likho "Excellent work! Grade A"
warna:
    agar score >= 80:
        likho "Good job! Grade B"
    warna:
        likho "Keep trying! Grade C"

# Loop example
likho "Counting to 5:"
dohrana i in range(5):
    likho "Count: " + i

# Function example
system celebrate(name):
    likho "🎉 Congratulations " + name + "!"
    return "Success"

banao result = celebrate(name)
likho result`);
  
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();

  const executeCode = useCallback((codeToRun: string = code) => {
    try {
      const lexer = new Lexer(codeToRun);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const interpreter = new Interpreter();
      const result = interpreter.interpret(ast);
      
      setOutput(result.output);
      setError(result.error);
    } catch (err) {
      setOutput([]);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [code]);

  const handleSave = useCallback(() => {
    localStorage.setItem('easylang-code', code);
  }, [code]);

  const handleLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.easy';
    a.click();
    URL.revokeObjectURL(url);
  }, [code]);

  const clearOutput = useCallback(() => {
    setOutput([]);
    setError(undefined);
  }, []);

  const runExample = useCallback((exampleCode: string) => {
    setCode(exampleCode);
    setActiveTab('editor');
    executeCode(exampleCode);
  }, [executeCode]);

  const tabs = [
    { key: 'editor' as Tab, label: 'Code Editor', icon: Code2 },
    { key: 'repl' as Tab, label: 'Interactive REPL', icon: Terminal },
    { key: 'reference' as Tab, label: 'Language Reference', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EasyLang</h1>
                <p className="text-sm text-gray-500">Programming Language Interpreter</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
            <CodeEditor
              code={code}
              onChange={setCode}
              onRun={() => executeCode()}
              onSave={handleSave}
              onLoad={handleLoad}
              onDownload={handleDownload}
            />
            <OutputConsole
              output={output}
              error={error}
              onClear={clearOutput}
            />
          </div>
        )}

        {activeTab === 'repl' && (
          <div className="h-[calc(100vh-200px)]">
            <REPL />
          </div>
        )}

        {activeTab === 'reference' && (
          <div className="h-[calc(100vh-200px)]">
            <LanguageReference onRunExample={runExample} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              EasyLang - A simple, intuitive programming language
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Built with TypeScript & React</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;