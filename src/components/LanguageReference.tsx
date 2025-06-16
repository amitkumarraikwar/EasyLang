import React, { useState } from 'react';
import { Book, ChevronDown, ChevronRight, Code, Play } from 'lucide-react';

interface LanguageReferenceProps {
  onRunExample: (code: string) => void;
}

const LanguageReference: React.FC<LanguageReferenceProps> = ({ onRunExample }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['variables']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const examples = {
    variables: `# Variable Declaration
banao name = "Ali"
banao age = 25
banao pi = 3.14159

# Constant Declaration
sada MAX_SIZE = 100
sada VERSION = "1.0"

likho name
likho age
likho pi`,

    dataTypes: `# Numbers
banao integer = 42
banao decimal = 3.14

# Strings
banao message = "Assalam o Alaikum!"
banao greeting = "Hello " + "World"

# Booleans
banao isTrue = sach
banao isFalse = jhooth

likho integer
likho message
likho isTrue`,

    operators: `# Arithmetic Operations
banao x = 10
banao y = 3

likho x + y    # Addition: 13
likho x - y    # Subtraction: 7
likho x * y    # Multiplication: 30
likho x / y    # Division: 3.333...
likho x % y    # Modulo: 1
likho x ** y   # Power: 1000

# Comparison
likho x > y    # Greater than: sach
likho x == y   # Equal: jhooth
likho x != y   # Not equal: sach`,

    conditionals: `# If-Else Statement
banao score = 85

agar score >= 90:
    likho "Grade A"
warna:
    agar score >= 80:
        likho "Grade B"
    warna:
        likho "Grade C"

# Logical Operators
banao age = 20
banao hasLicense = sach

agar age >= 18 aur hasLicense:
    likho "Can drive"
warna:
    likho "Cannot drive"`,

    loops: `# For Loop with Range
dohrana i in range(5):
    likho "Count: " + i

# While Loop
banao counter = 0
jab tak counter < 3:
    likho "Counter: " + counter
    counter = counter + 1

# Nested Loops
dohrana i in range(3):
    dohrana j in range(2):
        likho "i=" + i + ", j=" + j`,

    functions: `# Function Declaration (System Style)
system greet(name):
    likho "Hello, " + name + "!"
    return "Greeting sent"

# Function Declaration (Arrow Style)
add ka system = (a, b) {
    return a + b
}

# Function Calls
greet("World")
banao result = add(5, 3)
likho result`,

    input: `# Getting User Input
banao name = puchho "What is your name? "
banao age = puchho "What is your age? "

likho "Hello, " + name
likho "You are " + age + " years old"`
  };

  const sections = [
    { key: 'variables', title: 'Variables & Constants', icon: '📝' },
    { key: 'dataTypes', title: 'Data Types', icon: '🔤' },
    { key: 'operators', title: 'Operators', icon: '➕' },
    { key: 'conditionals', title: 'Conditionals', icon: '🔀' },
    { key: 'loops', title: 'Loops', icon: '🔄' },
    { key: 'functions', title: 'Functions', icon: '⚡' },
    { key: 'input', title: 'User Input', icon: '⌨️' }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center space-x-2 p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
        <Book className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-gray-800">Language Reference</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.key} className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{section.icon}</span>
                <span className="font-medium text-gray-800">{section.title}</span>
              </div>
              {expandedSections.includes(section.key) ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.includes(section.key) && (
              <div className="px-4 pb-4">
                <div className="bg-gray-900 rounded-lg p-4 relative group">
                  <pre className="text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                    {examples[section.key as keyof typeof examples]}
                  </pre>
                  
                  <button
                    onClick={() => onRunExample(examples[section.key as keyof typeof examples])}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center space-x-1"
                  >
                    <Play className="h-3 w-3" />
                    <span>Try</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageReference;