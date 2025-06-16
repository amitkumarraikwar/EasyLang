export interface Position {
  line: number;
  column: number;
}

export interface ASTNode {
  type: string;
  position: Position;
}

export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

export interface Statement extends ASTNode {}

export interface Expression extends ASTNode {}

export interface VariableDeclaration extends Statement {
  type: 'VariableDeclaration';
  identifier: string;
  value: Expression;
  isConstant: boolean;
}

export interface Assignment extends Statement {
  type: 'Assignment';
  identifier: string;
  value: Expression;
}

export interface IfStatement extends Statement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elseBranch?: Statement[];
}

export interface WhileLoop extends Statement {
  type: 'WhileLoop';
  condition: Expression;
  body: Statement[];
}

export interface ForLoop extends Statement {
  type: 'ForLoop';
  variable: string;
  iterable: Expression;
  body: Statement[];
}

export interface FunctionDeclaration extends Statement {
  type: 'FunctionDeclaration';
  name: string;
  parameters: string[];
  body: Statement[];
  style: 'system' | 'arrow';
}

export interface ReturnStatement extends Statement {
  type: 'ReturnStatement';
  value?: Expression;
}

export interface PrintStatement extends Statement {
  type: 'PrintStatement';
  value: Expression;
}

export interface InputStatement extends Expression {
  type: 'InputStatement';
  prompt: string;
}

export interface BinaryExpression extends Expression {
  type: 'BinaryExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends Expression {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
}

export interface CallExpression extends Expression {
  type: 'CallExpression';
  callee: string;
  arguments: Expression[];
}

export interface Identifier extends Expression {
  type: 'Identifier';
  name: string;
}

export interface Literal extends Expression {
  type: 'Literal';
  value: any;
  dataType: 'number' | 'string' | 'boolean';
}