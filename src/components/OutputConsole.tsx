import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface OutputConsoleProps {
  output: string[];
  error?: string;
  onClear: () => void;
}

const OutputConsole: React.FC<OutputConsoleProps> = ({ output, error, onClear }) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, error]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg shadow-lg border border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-green-400" />
          <h2 className="font-semibold text-gray-100">Output Console</h2>
        </div>
        
        <button
          onClick={onClear}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear</span>
        </button>
      </div>
      
      <div 
        ref={consoleRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm"
        style={{ minHeight: '300px' }}
      >
        {output.length === 0 && !error ? (
          <div className="text-gray-500 italic">
            Console output will appear here...
          </div>
        ) : (
          <>
            {output.map((line, index) => (
              <div key={index} className="text-green-400 mb-1">
                {line}
              </div>
            ))}
            {error && (
              <div className="text-red-400 font-semibold mt-2">
                ❌ {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OutputConsole;