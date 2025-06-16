import {
  ASTNode, Program, Statement, Expression, VariableDeclaration, Assignment,
  IfStatement, WhileLoop, ForLoop, FunctionDeclaration, ReturnStatement,
  PrintStatement, InputStatement, BinaryExpression, UnaryExpression,
  CallExpression, Identifier, Literal
} from '../types/ast';
import { EasyLangError } from './lexer';

export interface RuntimeValue {
  type: 'number' | 'string' | 'boolean' | 'function' | 'range';
  value: any;
}

export interface EasyLangFunction {
  name: string;
  parameters: string[];
  body: Statement[];
  closure: Environment;
}

class Environment {
  private values = new Map<string, RuntimeValue>();
  private constants = new Set<string>();
  private parent?: Environment;

  constructor(parent?: Environment) {
    this.parent = parent;
  }

  define(name: string, value: RuntimeValue, isConstant = false): void {
    if (this.values.has(name)) {
      throw new Error(`Variable '${name}' already defined`);
    }
    this.values.set(name, value);
    if (isConstant) {
      this.constants.add(name);
    }
  }

  get(name: string): RuntimeValue {
    if (this.values.has(name)) {
      return this.values.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Undefined variable '${name}'`);
  }

  assign(name: string, value: RuntimeValue): void {
    if (this.constants.has(name)) {
      throw new Error(`Cannot reassign constant '${name}'`);
    }
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }
    throw new Error(`Undefined variable '${name}'`);
  }
}

export class ReturnException extends Error {
  constructor(public value: RuntimeValue) {
    super();
  }
}

export class Interpreter {
  private globals = new Environment();
  private environment = this.globals;
  private output: string[] = [];
  private inputCallback?: (prompt: string) => string;

  constructor(inputCallback?: (prompt: string) => string) {
    this.inputCallback = inputCallback;
    this.setupBuiltins();
  }

  interpret(program: Program): { output: string[]; error?: string } {
    this.output = [];
    try {
      this.visitProgram(program);
      return { output: this.output };
    } catch (error) {
      if (error instanceof EasyLangError) {
        return { 
          output: this.output, 
          error: `${error.type} at line ${error.line}:${error.column}: ${error.message}` 
        };
      }
      return { 
        output: this.output, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  private setupBuiltins(): void {
    // Built-in range function
    this.globals.define('range', {
      type: 'function',
      value: {
        name: 'range',
        parameters: ['n'],
        body: [],
        closure: this.globals
      }
    });
  }

  private visitProgram(node: Program): void {
    for (const statement of node.body) {
      this.visitStatement(statement);
    }
  }

  private visitStatement(node: Statement): void {
    switch (node.type) {
      case 'VariableDeclaration':
        this.visitVariableDeclaration(node as VariableDeclaration);
        break;
      case 'Assignment':
        this.visitAssignment(node as Assignment);
        break;
      case 'IfStatement':
        this.visitIfStatement(node as IfStatement);
        break;
      case 'WhileLoop':
        this.visitWhileLoop(node as WhileLoop);
        break;
      case 'ForLoop':
        this.visitForLoop(node as ForLoop);
        break;
      case 'FunctionDeclaration':
        this.visitFunctionDeclaration(node as FunctionDeclaration);
        break;
      case 'ReturnStatement':
        this.visitReturnStatement(node as ReturnStatement);
        break;
      case 'PrintStatement':
        this.visitPrintStatement(node as PrintStatement);
        break;
      default:
        this.visitExpression(node as Expression);
    }
  }

  private visitVariableDeclaration(node: VariableDeclaration): void {
    const value = this.visitExpression(node.value);
    this.environment.define(node.identifier, value, node.isConstant);
  }

  private visitAssignment(node: Assignment): void {
    const value = this.visitExpression(node.value);
    this.environment.assign(node.identifier, value);
  }

  private visitIfStatement(node: IfStatement): void {
    const condition = this.visitExpression(node.condition);
    
    if (this.isTruthy(condition)) {
      for (const statement of node.thenBranch) {
        this.visitStatement(statement);
      }
    } else if (node.elseBranch) {
      for (const statement of node.elseBranch) {
        this.visitStatement(statement);
      }
    }
  }

  private visitWhileLoop(node: WhileLoop): void {
    while (this.isTruthy(this.visitExpression(node.condition))) {
      try {
        for (const statement of node.body) {
          this.visitStatement(statement);
        }
      } catch (error) {
        if (error instanceof ReturnException) {
          throw error;
        }
        break;
      }
    }
  }

  private visitForLoop(node: ForLoop): void {
    const iterable = this.visitExpression(node.iterable);
    
    if (iterable.type !== 'range') {
      throw new Error('For loop requires a range');
    }

    const previous = this.environment;
    this.environment = new Environment(previous);

    try {
      for (let i = 0; i < iterable.value; i++) {
        this.environment.define(node.variable, { type: 'number', value: i });
        
        for (const statement of node.body) {
          this.visitStatement(statement);
        }
      }
    } finally {
      this.environment = previous;
    }
  }

  private visitFunctionDeclaration(node: FunctionDeclaration): void {
    const func: EasyLangFunction = {
      name: node.name,
      parameters: node.parameters,
      body: node.body,
      closure: this.environment
    };

    this.environment.define(node.name, {
      type: 'function',
      value: func
    });
  }

  private visitReturnStatement(node: ReturnStatement): void {
    let value: RuntimeValue = { type: 'boolean', value: false };
    
    if (node.value) {
      value = this.visitExpression(node.value);
    }

    throw new ReturnException(value);
  }

  private visitPrintStatement(node: PrintStatement): void {
    const value = this.visitExpression(node.value);
    this.output.push(this.stringify(value));
  }

  private visitExpression(node: Expression): RuntimeValue {
    switch (node.type) {
      case 'BinaryExpression':
        return this.visitBinaryExpression(node as BinaryExpression);
      case 'UnaryExpression':
        return this.visitUnaryExpression(node as UnaryExpression);
      case 'CallExpression':
        return this.visitCallExpression(node as CallExpression);
      case 'Identifier':
        return this.visitIdentifier(node as Identifier);
      case 'Literal':
        return this.visitLiteral(node as Literal);
      case 'InputStatement':
        return this.visitInputStatement(node as InputStatement);
      default:
        throw new Error(`Unknown expression type: ${node.type}`);
    }
  }

  private visitBinaryExpression(node: BinaryExpression): RuntimeValue {
    const left = this.visitExpression(node.left);
    const right = this.visitExpression(node.right);

    switch (node.operator) {
      case '+':
        if (left.type === 'string' || right.type === 'string') {
          return { type: 'string', value: this.stringify(left) + this.stringify(right) };
        }
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'number', value: left.value + right.value };
        }
        break;
      case '-':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'number', value: left.value - right.value };
        }
        break;
      case '*':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'number', value: left.value * right.value };
        }
        break;
      case '/':
        if (left.type === 'number' && right.type === 'number') {
          if (right.value === 0) throw new Error('Division by zero');
          return { type: 'number', value: left.value / right.value };
        }
        break;
      case '%':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'number', value: left.value % right.value };
        }
        break;
      case '**':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'number', value: Math.pow(left.value, right.value) };
        }
        break;
      case '==':
        return { type: 'boolean', value: this.isEqual(left, right) };
      case '!=':
        return { type: 'boolean', value: !this.isEqual(left, right) };
      case '<':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'boolean', value: left.value < right.value };
        }
        break;
      case '>':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'boolean', value: left.value > right.value };
        }
        break;
      case '<=':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'boolean', value: left.value <= right.value };
        }
        break;
      case '>=':
        if (left.type === 'number' && right.type === 'number') {
          return { type: 'boolean', value: left.value >= right.value };
        }
        break;
      case 'aur':
        return { type: 'boolean', value: this.isTruthy(left) && this.isTruthy(right) };
      case 'ya':
        return { type: 'boolean', value: this.isTruthy(left) || this.isTruthy(right) };
    }

    throw new Error(`Invalid binary operation: ${left.type} ${node.operator} ${right.type}`);
  }

  private visitUnaryExpression(node: UnaryExpression): RuntimeValue {
    const operand = this.visitExpression(node.operand);

    switch (node.operator) {
      case 'nahi':
        return { type: 'boolean', value: !this.isTruthy(operand) };
      case '-':
        if (operand.type === 'number') {
          return { type: 'number', value: -operand.value };
        }
        break;
    }

    throw new Error(`Invalid unary operation: ${node.operator} ${operand.type}`);
  }

  private visitCallExpression(node: CallExpression): RuntimeValue {
    // Handle built-in range function
    if (node.callee === 'range') {
      if (node.arguments.length !== 1) {
        throw new Error('range() expects exactly one argument');
      }
      const arg = this.visitExpression(node.arguments[0]);
      if (arg.type !== 'number') {
        throw new Error('range() argument must be a number');
      }
      return { type: 'range', value: Math.floor(arg.value) };
    }

    const callee = this.environment.get(node.callee);
    if (callee.type !== 'function') {
      throw new Error(`'${node.callee}' is not a function`);
    }

    const func = callee.value as EasyLangFunction;
    const args = node.arguments.map(arg => this.visitExpression(arg));

    if (args.length !== func.parameters.length) {
      throw new Error(`Function '${func.name}' expects ${func.parameters.length} arguments, got ${args.length}`);
    }

    const previous = this.environment;
    this.environment = new Environment(func.closure);

    // Bind parameters
    for (let i = 0; i < func.parameters.length; i++) {
      this.environment.define(func.parameters[i], args[i]);
    }

    try {
      for (const statement of func.body) {
        this.visitStatement(statement);
      }
      return { type: 'boolean', value: false }; // Default return
    } catch (error) {
      if (error instanceof ReturnException) {
        return error.value;
      }
      throw error;
    } finally {
      this.environment = previous;
    }
  }

  private visitIdentifier(node: Identifier): RuntimeValue {
    return this.environment.get(node.name);
  }

  private visitLiteral(node: Literal): RuntimeValue {
    return {
      type: node.dataType,
      value: node.value
    };
  }

  private visitInputStatement(node: InputStatement): RuntimeValue {
    if (this.inputCallback) {
      const input = this.inputCallback(node.prompt);
      // Try to parse as number first
      const num = parseFloat(input);
      if (!isNaN(num) && isFinite(num)) {
        return { type: 'number', value: num };
      }
      return { type: 'string', value: input };
    }
    throw new Error('Input not available in this context');
  }

  private isTruthy(value: RuntimeValue): boolean {
    switch (value.type) {
      case 'boolean':
        return value.value;
      case 'number':
        return value.value !== 0;
      case 'string':
        return value.value.length > 0;
      default:
        return true;
    }
  }

  private isEqual(left: RuntimeValue, right: RuntimeValue): boolean {
    if (left.type !== right.type) return false;
    return left.value === right.value;
  }

  private stringify(value: RuntimeValue): string {
    switch (value.type) {
      case 'boolean':
        return value.value ? 'sach' : 'jhooth';
      case 'number':
        return value.value.toString();
      case 'string':
        return value.value;
      default:
        return '[object]';
    }
  }
}