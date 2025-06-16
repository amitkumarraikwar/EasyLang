import React, { useRef, useEffect } from 'react';
import { Play, Save, Upload, Download, FileText } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  onSave,
  onLoad,
  onDownload
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const lineCount = lines.length;
  const maxLineNumberWidth = Math.max(3, lineCount.toString().length);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [code]);

  // Sync line numbers scroll with textarea scroll
  useEffect(() => {
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;

    if (textarea && lineNumbers) {
      const handleScroll = () => {
        lineNumbers.scrollTop = textarea.scrollTop;
      };

      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const lines = code.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      let newIndent = indent;
      if (currentLine.trim().endsWith(':')) {
        newIndent += '    ';
      }
      
      const newValue = code.substring(0, start) + '\n' + newIndent + code.substring(start);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + newIndent.length;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Code Editor</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
          >
            <Upload className="h-4 w-4" />
            <span>Load</span>
          </button>
          
          <button
            onClick={onDownload}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={onRun}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 shadow-sm"
          >
            <Play className="h-4 w-4" />
            <span>Run</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div 
          ref={lineNumbersRef}
          className="flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-hidden"
          style={{ 
            width: `${maxLineNumberWidth * 0.6 + 2}rem`,
            minWidth: '3rem'
          }}
        >
          <div className="py-4 px-2">
            {lines.map((_, index) => (
              <div 
                key={index} 
                className="text-gray-400 text-sm font-mono leading-6 text-right select-none"
                style={{ height: '1.5rem' }}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Code Content */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none font-mono text-sm leading-6 text-gray-800 placeholder-gray-400 p-4"
            placeholder="# Write your EasyLang code here...
banao message = &quot;Hello, World!&quot;
likho message"
            style={{ 
              minHeight: '400px',
              lineHeight: '1.5rem'
            }}
            spellCheck={false}
          />
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".easy,.txt"
        onChange={onLoad}
        className="hidden"
      />
    </div>
  );
};

export default CodeEditor;