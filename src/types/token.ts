export interface Token {
  type: TokenType;
  value: string;
  position: {
    line: number;
    column: number;
  };
}

export enum TokenType {
  // Keywords
  BANAO = 'BANAO',           // banao (variable declaration)
  SADA = 'SADA',             // sada (constant declaration)
  AGAR = 'AGAR',             // agar (if)
  WARNA = 'WARNA',           // warna (else)
  DOHRANA = 'DOHRANA',       // dohrana (for)
  JAB_TAK = 'JAB_TAK',       // jab tak (while)
  SYSTEM = 'SYSTEM',         // system (function)
  KA_SYSTEM = 'KA_SYSTEM',   // ka system (function arrow style)
  RETURN = 'RETURN',         // return
  LIKHO = 'LIKHO',           // likho (print)
  PUCHHO = 'PUCHHO',         // puchho (input)
  RANGE = 'RANGE',           // range
  IN = 'IN',                 // in
  
  // Boolean literals
  SACH = 'SACH',             // sach (true)
  JHOOTH = 'JHOOTH',         // jhooth (false)
  
  // Logical operators
  AUR = 'AUR',               // aur (and)
  YA = 'YA',                 // ya (or)
  NAHI = 'NAHI',             // nahi (not)
  
  // Identifiers and literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  
  // Operators
  PLUS = 'PLUS',             // +
  MINUS = 'MINUS',           // -
  MULTIPLY = 'MULTIPLY',     // *
  DIVIDE = 'DIVIDE',         // /
  MODULO = 'MODULO',         // %
  POWER = 'POWER',           // **
  
  // Comparison operators
  EQUAL = 'EQUAL',           // ==
  NOT_EQUAL = 'NOT_EQUAL',   // !=
  LESS_THAN = 'LESS_THAN',   // <
  GREATER_THAN = 'GREATER_THAN', // >
  LESS_EQUAL = 'LESS_EQUAL', // <=
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  
  // Assignment
  ASSIGN = 'ASSIGN',         // =
  
  // Punctuation
  LEFT_PAREN = 'LEFT_PAREN', // (
  RIGHT_PAREN = 'RIGHT_PAREN', // )
  LEFT_BRACE = 'LEFT_BRACE', // {
  RIGHT_BRACE = 'RIGHT_BRACE', // }
  COMMA = 'COMMA',           // ,
  COLON = 'COLON',           // :
  
  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
}