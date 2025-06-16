import { Token, TokenType } from '../types/token';

export class EasyLangError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public type: string = 'SyntaxError'
  ) {
    super(message);
    this.name = 'EasyLangError';
  }
}

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private current = 0;
  private line = 1;
  private column = 1;
  private indentStack: number[] = [0];

  private keywords: Record<string, TokenType> = {
    'banao': TokenType.BANAO,
    'sada': TokenType.SADA,
    'agar': TokenType.AGAR,
    'warna': TokenType.WARNA,
    'dohrana': TokenType.DOHRANA,
    'jab': TokenType.JAB_TAK,
    'tak': TokenType.JAB_TAK,
    'system': TokenType.SYSTEM,
    'ka': TokenType.KA_SYSTEM,
    'return': TokenType.RETURN,
    'likho': TokenType.LIKHO,
    'puchho': TokenType.PUCHHO,
    'range': TokenType.RANGE,
    'in': TokenType.IN,
    'sach': TokenType.SACH,
    'jhooth': TokenType.JHOOTH,
    'aur': TokenType.AUR,
    'ya': TokenType.YA,
    'nahi': TokenType.NAHI,
  };

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    // Handle final dedents
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.addToken(TokenType.DEDENT, '');
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      case ' ':
      case '\r':
      case '\t':
        // Handle indentation at line start
        if (this.column === 2) {
          this.handleIndentation();
        }
        break;
      case '\n':
        this.addToken(TokenType.NEWLINE, '\n');
        this.line++;
        this.column = 1;
        break;
      case '+':
        this.addToken(TokenType.PLUS, '+');
        break;
      case '-':
        this.addToken(TokenType.MINUS, '-');
        break;
      case '/':
        this.addToken(TokenType.DIVIDE, '/');
        break;
      case '%':
        this.addToken(TokenType.MODULO, '%');
        break;
      case '(':
        this.addToken(TokenType.LEFT_PAREN, '(');
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN, ')');
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE, '{');
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE, '}');
        break;
      case ',':
        this.addToken(TokenType.COMMA, ',');
        break;
      case ':':
        this.addToken(TokenType.COLON, ':');
        break;
      case '*':
        if (this.match('*')) {
          this.addToken(TokenType.POWER, '**');
        } else {
          this.addToken(TokenType.MULTIPLY, '*');
        }
        break;
      case '=':
        if (this.match('=')) {
          this.addToken(TokenType.EQUAL, '==');
        } else {
          this.addToken(TokenType.ASSIGN, '=');
        }
        break;
      case '!':
        if (this.match('=')) {
          this.addToken(TokenType.NOT_EQUAL, '!=');
        } else {
          throw new EasyLangError('Unexpected character', this.line, this.column);
        }
        break;
      case '<':
        if (this.match('=')) {
          this.addToken(TokenType.LESS_EQUAL, '<=');
        } else {
          this.addToken(TokenType.LESS_THAN, '<');
        }
        break;
      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.GREATER_EQUAL, '>=');
        } else {
          this.addToken(TokenType.GREATER_THAN, '>');
        }
        break;
      case '"':
        this.string();
        break;
      case '#':
        // Comment - skip to end of line
        while (this.peek() !== '\n' && !this.isAtEnd()) {
          this.advance();
        }
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new EasyLangError(`Unexpected character: ${c}`, this.line, this.column);
        }
        break;
    }
  }

  private handleIndentation(): void {
    let indent = 0;
    this.current--; // Go back to count from the start
    const startColumn = this.column;

    while (!this.isAtEnd() && (this.peek() === ' ' || this.peek() === '\t')) {
      if (this.peek() === ' ') {
        indent++;
      } else {
        indent += 4; // Tab = 4 spaces
      }
      this.advance();
    }

    const currentIndent = this.indentStack[this.indentStack.length - 1];

    if (indent > currentIndent) {
      this.indentStack.push(indent);
      this.addToken(TokenType.INDENT, ' '.repeat(indent));
    } else if (indent < currentIndent) {
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indent) {
        this.indentStack.pop();
        this.addToken(TokenType.DEDENT, '');
      }
      
      if (this.indentStack[this.indentStack.length - 1] !== indent) {
        throw new EasyLangError('Indentation error', this.line, startColumn);
      }
    }
  }

  private string(): void {
    const start = this.current - 1;
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new EasyLangError('Unterminated string', this.line, this.column);
    }

    this.advance(); // Closing "
    const value = this.source.substring(start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    const start = this.current - 1;
    
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // Consume the "."
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.substring(start, this.current);
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    const start = this.current - 1;
    
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(start, this.current);
    
    // Handle compound keywords like "jab tak"
    if (text === 'jab' && this.peek() === ' ') {
      const nextStart = this.current + 1;
      this.advance(); // Skip space
      
      if (this.source.substring(nextStart, nextStart + 3) === 'tak') {
        this.current += 3;
        this.column += 3;
        this.addToken(TokenType.JAB_TAK, 'jab tak');
        return;
      } else {
        this.current--; // Go back
        this.column--;
      }
    }

    // Handle "ka system"
    if (text === 'ka' && this.peek() === ' ') {
      const nextStart = this.current + 1;
      this.advance(); // Skip space
      
      if (this.source.substring(nextStart, nextStart + 6) === 'system') {
        this.current += 6;
        this.column += 6;
        this.addToken(TokenType.KA_SYSTEM, 'ka system');
        return;
      } else {
        this.current--; // Go back
        this.column--;
      }
    }

    const type = this.keywords[text] || TokenType.IDENTIFIER;
    this.addToken(type, text);
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    this.column++;
    return this.source.charAt(this.current++);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      position: {
        line: this.line,
        column: this.column - value.length
      }
    });
  }
}