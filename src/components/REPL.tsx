import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { Lexer } from '../interpreter/lexer';
import { Parser } from '../interpreter/parser';
import { Interpreter } from '../interpreter/interpreter';

interface REPLProps {
  className?: string;
}

interface REPLEntry {
  input: string;
  output?: string;
  error?: string;
}

const REPL: React.FC<REPLProps> = ({ className = '' }) => {
  const [history, setHistory] = useState<REPLEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const interpreter = useRef(new Interpreter());

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (input: string) => {
    if (!input.trim()) return;

    // Add to command history
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    try {
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const result = interpreter.current.interpret(ast);

      setHistory(prev => [...prev, {
        input,
        output: result.output.join('\n'),
        error: result.error
      }]);
    } catch (error) {
      setHistory(prev => [...prev, {
        input,
        error: error instanceof Error ? error.message : String(error)
      }]);
    }

    setCurrentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearREPL = () => {
    setHistory([]);
    setCurrentInput('');
    setCommandHistory([]);
    setHistoryIndex(-1);
    interpreter.current = new Interpreter();
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="ml-4 font-semibold text-gray-100">EasyLang REPL</span>
        </div>
        
        <button
          onClick={clearREPL}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm"
        style={{ minHeight: '300px' }}
      >
        <div className="text-gray-400 mb-4 text-xs">
          EasyLang Interactive REPL - Type commands and press Enter
        </div>
        
        {history.map((entry, index) => (
          <div key={index} className="mb-3">
            <div className="flex items-center space-x-2 text-blue-400">
              <ChevronRight className="h-4 w-4" />
              <span>{entry.input}</span>
            </div>
            {entry.output && (
              <div className="ml-6 text-green-400 whitespace-pre-wrap">
                {entry.output}
              </div>
            )}
            {entry.error && (
              <div className="ml-6 text-red-400">
                ❌ {entry.error}
              </div>
            )}
          </div>
        ))}
        
        <div className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none"
            placeholder="Enter EasyLang command..."
          />
        </div>
      </div>
    </div>
  );
};

export default REPL;