import { Token, TokenType } from '../types/token';
import { 
  ASTNode, Program, Statement, Expression, VariableDeclaration, Assignment,
  IfStatement, WhileLoop, ForLoop, FunctionDeclaration, ReturnStatement,
  PrintStatement, InputStatement, BinaryExpression, UnaryExpression,
  CallExpression, Identifier, Literal, Position
} from '../types/ast';
import { EasyLangError } from './lexer';

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const statements: Statement[] = [];
    
    while (!this.isAtEnd()) {
      // Skip newlines at top level
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }
      
      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      type: 'Program',
      body: statements,
      position: { line: 1, column: 1 }
    };
  }

  private statement(): Statement | null {
    try {
      if (this.match(TokenType.BANAO)) return this.variableDeclaration(false);
      if (this.match(TokenType.SADA)) return this.variableDeclaration(true);
      if (this.match(TokenType.AGAR)) return this.ifStatement();
      if (this.match(TokenType.DOHRANA)) return this.forLoop();
      if (this.match(TokenType.JAB_TAK)) return this.whileLoop();
      if (this.match(TokenType.SYSTEM)) return this.functionDeclaration('system');
      if (this.match(TokenType.RETURN)) return this.returnStatement();
      if (this.match(TokenType.LIKHO)) return this.printStatement();
      
      // Check for function declaration with arrow syntax
      if (this.check(TokenType.IDENTIFIER)) {
        const checkpoint = this.current;
        const name = this.advance().value;
        
        if (this.match(TokenType.KA_SYSTEM)) {
          return this.functionDeclaration('arrow', name);
        } else {
          // Reset and try assignment
          this.current = checkpoint;
          return this.assignmentOrExpression();
        }
      }

      return this.assignmentOrExpression();
    } catch (error) {
      // Skip to next statement on error
      this.synchronize();
      throw error;
    }
  }

  private variableDeclaration(isConstant: boolean): VariableDeclaration {
    const name = this.consume(TokenType.IDENTIFIER, `Expected variable name after ${isConstant ? 'sada' : 'banao'}`);
    this.consume(TokenType.ASSIGN, 'Expected "=" after variable name');
    const value = this.expression();

    return {
      type: 'VariableDeclaration',
      identifier: name.value,
      value,
      isConstant,
      position: this.getPosition(name)
    };
  }

  private ifStatement(): IfStatement {
    const condition = this.expression();
    this.consume(TokenType.COLON, 'Expected ":" after if condition');
    this.consumeNewlineAndIndent();

    const thenBranch = this.blockStatement();
    let elseBranch: Statement[] | undefined;

    if (this.match(TokenType.WARNA)) {
      this.consume(TokenType.COLON, 'Expected ":" after warna');
      this.consumeNewlineAndIndent();
      elseBranch = this.blockStatement();
    }

    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      position: this.getPosition()
    };
  }

  private forLoop(): ForLoop {
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name in for loop').value;
    this.consume(TokenType.IN, 'Expected "in" after for loop variable');
    const iterable = this.expression();
    this.consume(TokenType.COLON, 'Expected ":" after for loop expression');
    this.consumeNewlineAndIndent();

    const body = this.blockStatement();

    return {
      type: 'ForLoop',
      variable,
      iterable,
      body,
      position: this.getPosition()
    };
  }

  private whileLoop(): WhileLoop {
    const condition = this.expression();
    this.consume(TokenType.COLON, 'Expected ":" after while condition');
    this.consumeNewlineAndIndent();

    const body = this.blockStatement();

    return {
      type: 'WhileLoop',
      condition,
      body,
      position: this.getPosition()
    };
  }

  private functionDeclaration(style: 'system' | 'arrow', name?: string): FunctionDeclaration {
    let functionName: string;
    
    if (style === 'system') {
      functionName = this.consume(TokenType.IDENTIFIER, 'Expected function name').value;
    } else {
      functionName = name!;
    }

    this.consume(TokenType.LEFT_PAREN, 'Expected "(" after function name');
    
    const parameters: string[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        parameters.push(this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value);
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters');

    if (style === 'system') {
      this.consume(TokenType.COLON, 'Expected ":" after function signature');
      this.consumeNewlineAndIndent();
    } else {
      this.consume(TokenType.LEFT_BRACE, 'Expected "{" after arrow function signature');
      this.match(TokenType.NEWLINE); // Optional newline after {
    }

    const body = this.blockStatement(style === 'arrow');

    if (style === 'arrow') {
      this.consume(TokenType.RIGHT_BRACE, 'Expected "}" after arrow function body');
    }

    return {
      type: 'FunctionDeclaration',
      name: functionName,
      parameters,
      body,
      style,
      position: this.getPosition()
    };
  }

  private returnStatement(): ReturnStatement {
    let value: Expression | undefined;
    
    if (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      value = this.expression();
    }

    return {
      type: 'ReturnStatement',
      value,
      position: this.getPosition()
    };
  }

  private printStatement(): PrintStatement {
    const value = this.expression();
    
    return {
      type: 'PrintStatement',
      value,
      position: this.getPosition()
    };
  }

  private assignmentOrExpression(): Statement {
    const expr = this.expression();

    if (expr.type === 'Identifier' && this.match(TokenType.ASSIGN)) {
      const value = this.expression();
      return {
        type: 'Assignment',
        identifier: (expr as Identifier).name,
        value,
        position: expr.position
      };
    }

    return expr as Statement;
  }

  private expression(): Expression {
    return this.logicalOr();
  }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();

    while (this.match(TokenType.YA)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.equality();

    while (this.match(TokenType.AUR)) {
      const operator = this.previous().value;
      const right = this.equality();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUAL, TokenType.LESS_THAN, TokenType.LESS_EQUAL)) {
      const operator = this.previous().value;
      const right = this.term();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private factor(): Expression {
    let expr = this.power();

    while (this.match(TokenType.DIVIDE, TokenType.MULTIPLY, TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.power();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private power(): Expression {
    let expr = this.unary();

    if (this.match(TokenType.POWER)) {
      const operator = this.previous().value;
      const right = this.power(); // Right associative
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        position: expr.position
      };
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.NAHI, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        operand: right,
        position: this.getPosition()
      };
    }

    return this.call();
  }

  private call(): Expression {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expression): Expression {
    const args: Expression[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after arguments');

    return {
      type: 'CallExpression',
      callee: (callee as Identifier).name,
      arguments: args,
      position: callee.position
    };
  }

  private primary(): Expression {
    if (this.match(TokenType.SACH)) {
      return {
        type: 'Literal',
        value: true,
        dataType: 'boolean',
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.JHOOTH)) {
      return {
        type: 'Literal',
        value: false,
        dataType: 'boolean',
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.NUMBER)) {
      const value = parseFloat(this.previous().value);
      return {
        type: 'Literal',
        value,
        dataType: 'number',
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.STRING)) {
      return {
        type: 'Literal',
        value: this.previous().value,
        dataType: 'string',
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.PUCHHO)) {
      const prompt = this.consume(TokenType.STRING, 'Expected string after puchho').value;
      return {
        type: 'InputStatement',
        prompt,
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.RANGE)) {
      this.consume(TokenType.LEFT_PAREN, 'Expected "(" after range');
      const arg = this.expression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after range argument');
      
      return {
        type: 'CallExpression',
        callee: 'range',
        arguments: [arg],
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: 'Identifier',
        name: this.previous().value,
        position: this.getPosition()
      };
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after expression');
      return expr;
    }

    throw new EasyLangError('Expected expression', this.peek().position.line, this.peek().position.column);
  }

  private blockStatement(isArrowFunction = false): Statement[] {
    const statements: Statement[] = [];

    while (!this.check(TokenType.DEDENT) && !this.check(TokenType.EOF) && 
           (!isArrowFunction || !this.check(TokenType.RIGHT_BRACE))) {
      if (this.match(TokenType.NEWLINE)) continue;
      
      const stmt = this.statement();
      if (stmt) statements.push(stmt);
    }

    if (!isArrowFunction) {
      this.match(TokenType.DEDENT); // Consume dedent if present
    }

    return statements;
  }

  private consumeNewlineAndIndent(): void {
    this.consume(TokenType.NEWLINE, 'Expected newline');
    if (!this.match(TokenType.INDENT)) {
      throw new EasyLangError('Expected indentation', this.peek().position.line, this.peek().position.column);
    }
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.NEWLINE) return;

      switch (this.peek().type) {
        case TokenType.BANAO:
        case TokenType.SADA:
        case TokenType.AGAR:
        case TokenType.DOHRANA:
        case TokenType.JAB_TAK:
        case TokenType.SYSTEM:
        case TokenType.RETURN:
        case TokenType.LIKHO:
          return;
      }

      this.advance();
    }
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const token = this.peek();
    throw new EasyLangError(message, token.position.line, token.position.column);
  }

  private getPosition(token?: Token): Position {
    const pos = token || this.previous();
    return pos.position;
  }
}