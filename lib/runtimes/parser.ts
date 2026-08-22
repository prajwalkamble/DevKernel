/**
 * One parser, four dialects. Rust, C++ and Java share almost all of their
 * expression grammar, so the Pratt expression parser below is common and only
 * declarations, loops and type syntax branch on the dialect.
 *
 * Go is the exception that earns its own section. Its expressions are close
 * enough to reuse the same Pratt parser, but everything around them is
 * genuinely different — the type follows the name, the loop keyword is spelled
 * one way for four kinds of loop, assignment comes in a declaring form, and the
 * language has no semicolons at all. That last one is handled before parsing
 * starts, by `goSemicolons`, so the statement parser can still assume them.
 */
import { ProgramError, UnsupportedError } from "./types";
import {
  tokenize,
  type Expr,
  type FnDecl,
  type MatchArm,
  type Param,
  type Pattern,
  type Program,
  type Stmt,
  type StructDecl,
  type Token,
} from "./lang";

export type DialectName = "rust" | "cpp" | "java" | "go";

const RUST_KEYWORDS = new Set([
  "fn", "let", "mut", "if", "else", "while", "for", "in", "loop", "match", "return",
  "break", "continue", "struct", "impl", "enum", "const", "static", "use", "pub",
  "mod", "as", "true", "false", "self", "Self", "where", "type", "trait", "move", "ref",
]);

/** Binding powers for the shared expression parser. */
const BINARY_POWER: Record<string, number> = {
  "||": 1, "&&": 2,
  "|": 3, "^": 4, "&": 5,
  "==": 6, "!=": 6,
  "<": 7, "<=": 7, ">": 7, ">=": 7,
  "<<": 8, ">>": 8,
  "+": 9, "-": 9,
  "*": 10, "/": 10, "%": 10,
};

const ASSIGN_OPS = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="]);

const RUST_INT_TYPES = new Set([
  "i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize",
]);

const CLIKE_TYPES = new Set([
  "int", "long", "short", "char", "float", "double", "bool", "boolean", "void", "auto", "var",
  "String", "string", "size_t", "unsigned", "signed", "byte",
]);

/**
 * Keywords that may precede a type in a declaration and carry no meaning for an
 * interpreter that runs the code once, single-threaded: they change compile-time
 * or storage semantics, not the value produced. Skipping them lets
 * `constexpr int n = 4;` parse as the declaration it is.
 *
 * `extern` and `register` are deliberately absent. Both change what the
 * declaration *means* rather than decorating it, so a program using them should
 * fail loudly here instead of running with the qualifier quietly dropped.
 */
const CLIKE_SPECIFIERS = new Set([
  "const", "constexpr", "consteval", "constinit", "static", "inline", "mutable", "volatile", "final",
]);

export class Parser {
  private tokens: Token[];
  private pos = 0;
  /** Counter behind the generated names desugaring introduces. */
  private temps = 0;

  constructor(source: string, private readonly dialect: DialectName) {
    this.tokens = tokenize(source);
    if (dialect === "go") this.tokens = goSemicolons(this.tokens);
  }

  // ------------------------------------------------------------- primitives

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private get line(): number {
    return this.peek().line;
  }

  private at(text: string, offset = 0): boolean {
    return this.peek(offset).text === text;
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private accept(text: string): boolean {
    if (this.at(text)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expect(text: string): Token {
    if (!this.at(text)) {
      throw new ProgramError(`expected \`${text}\`, found \`${this.peek().text || "end of file"}\``, this.line);
    }
    return this.next();
  }

  private identifier(): string {
    const tok = this.peek();
    if (tok.kind !== "ident") {
      throw new ProgramError(`expected a name, found \`${tok.text || "end of file"}\``, tok.line);
    }
    this.pos++;
    return tok.text;
  }

  // ------------------------------------------------------------------ types

  /**
   * A brace-enclosed aggregate: `{1, 2, 3}`, and nested for `{{1, 2}, {3, 4}}`.
   *
   * Recursive because the element parser has no case for `{` outside Rust, so
   * a two-dimensional initialiser used to stop at the inner brace.
   */
  private parseBraceList(line: number): Expr {
    this.expect("{");
    const items: Expr[] = [];
    while (!this.at("}")) {
      items.push(this.at("{") ? this.parseBraceList(this.peek().line) : this.parseExpr());
      if (!this.accept(",")) break;
    }
    this.expect("}");
    return { k: "list", items, line };
  }

  /**
   * Consumes a type and returns its text. Types are only used for integer
   * width and for spotting declarations, so nested generics are collected
   * verbatim rather than modelled.
   */
  private parseType(): string {
    if (this.dialect === "go") return this.parseGoType();
    let out = "";
    // Rust references and C++ const/&/* decorations.
    while (this.at("&") || this.at("*")) out += this.next().text;
    if (this.peek().kind === "ident" && (this.peek().text === "const" || this.peek().text === "mut")) {
      out += this.next().text + " ";
    }
    if (this.at("(")) {
      // A unit or tuple type.
      let depth = 0;
      do {
        const tok = this.next();
        if (tok.text === "(") depth++;
        if (tok.text === ")") depth--;
        out += tok.text;
      } while (depth > 0 && this.peek().kind !== "eof");
      return out;
    }
    if (this.at("[")) {
      let depth = 0;
      do {
        const tok = this.next();
        if (tok.text === "[") depth++;
        if (tok.text === "]") depth--;
        out += tok.text;
      } while (depth > 0 && this.peek().kind !== "eof");
      return out;
    }
    out += this.identifier();
    while (this.at("::") && this.peek(1).kind === "ident") {
      this.next();
      out += "::" + this.identifier();
    }
    // Java spells a nested type with a dot — `Map.Entry<K, V>` — and a
    // fully-qualified one with lowercase package segments in front of it:
    // `java.util.Map<K, V>`.
    //
    // A lowercase segment is only swallowed when a capitalised one actually
    // follows it, because that is the whole difference between a package path
    // and a method call. `System.out.println(...)` has no capitalised segment
    // after `System`, so it stops there and stays an expression — which
    // matters, since callers reach this speculatively from
    // `looksLikeDeclaration`.
    while (this.dialect === "java") {
      let ahead = 0;
      let target = -1;
      while (this.at(".", ahead) && this.peek(ahead + 1).kind === "ident") {
        if (/^[A-Z]/.test(this.peek(ahead + 1).text)) { target = ahead; break; }
        ahead += 2;
      }
      if (target === -1) break;
      for (let i = 0; i <= target; i += 2) {
        this.next();
        out += "." + this.identifier();
      }
    }
    // Drop the package path once it has been consumed, so that
    // `java.util.Map` and an imported `Map` are one name from here on. Every
    // later consumer — the constructor table, default construction, integer
    // width — keys off the bare type, and normalising here means none of them
    // needs to know packages exist. A nested type such as `Map.Entry` starts
    // with a capital and is left whole.
    if (this.dialect === "java") out = out.replace(/^(?:[a-z][A-Za-z0-9_]*\.)+/, "");
    if (this.at("<")) {
      let depth = 0;
      do {
        const tok = this.next();
        if (tok.text === "<") depth++;
        if (tok.text === ">") depth--;
        if (tok.text === ">>") depth -= 2;
        out += tok.text;
      } while (depth > 0 && this.peek().kind !== "eof");
    }
    // Java arrays and C++ pointer suffixes.
    while (this.at("[") && this.at("]", 1)) {
      this.next();
      this.next();
      out += "[]";
    }
    while (this.at("*") || this.at("&")) out += this.next().text;
    return out;
  }

  /** Consumes any `const`/`constexpr`/`static`/... run in front of a type. */
  private skipClikeSpecifiers(): void {
    while (this.peek().kind === "ident" && CLIKE_SPECIFIERS.has(this.peek().text)) this.next();
  }

  /** True when the tokens at the cursor look like a C-family declaration. */
  private looksLikeDeclaration(): boolean {
    const tok = this.peek();
    if (tok.kind !== "ident") return false;
    if (CLIKE_TYPES.has(tok.text)) return true;
    if (CLIKE_SPECIFIERS.has(tok.text)) return true;
    // A declaration is a type followed by a name: `Foo bar`, `Foo<T> bar`,
    // `Foo[] bar`. A call such as `foo(x)` has no second identifier, so
    // requiring one keeps the two apart.
    const save = this.pos;
    try {
      this.parseType();
      if (this.peek().kind !== "ident") return false;
      const after = this.peek(1).text;
      return ["=", ";", ",", "[", "(", "{", ":"].includes(after);
    } catch {
      return false;
    } finally {
      this.pos = save;
    }
  }

  // ------------------------------------------------------------- expressions

  parseExpr(noStruct = false): Expr {
    return this.parseAssignment(noStruct);
  }

  private parseAssignment(noStruct: boolean): Expr {
    const left = this.parseTernary(noStruct);
    const op = this.peek().text;
    if (ASSIGN_OPS.has(op)) {
      const line = this.line;
      this.next();
      const value = this.parseAssignment(noStruct);
      return { k: "assign", op, target: left, value, line };
    }
    return left;
  }

  private parseTernary(noStruct: boolean): Expr {
    const cond = this.parseRange(noStruct);
    if (this.dialect !== "rust" && this.at("?")) {
      const line = this.line;
      this.next();
      const then = this.parseAssignment(noStruct);
      this.expect(":");
      const other = this.parseAssignment(noStruct);
      return { k: "ternary", cond, then, other, line };
    }
    return cond;
  }

  private parseRange(noStruct: boolean): Expr {
    const from = this.parseBinary(0, noStruct);
    if (this.at("..") || this.at("..=")) {
      const line = this.line;
      const inclusive = this.next().text === "..=";
      const to = this.parseBinary(0, noStruct);
      return { k: "range", from, to, inclusive, line };
    }
    return from;
  }

  private parseBinary(minPower: number, noStruct: boolean): Expr {
    let left = this.parseUnary(noStruct);
    for (;;) {
      const tok = this.peek();
      // `as` is Rust's cast operator and binds tighter than any binary operator.
      if (this.dialect === "rust" && tok.text === "as") {
        this.next();
        left = { k: "cast", value: left, type: this.parseType(), line: tok.line };
        continue;
      }
      const power = BINARY_POWER[tok.text];
      if (power === undefined || power < minPower) break;
      // A `>` that opens a generic argument list is not a comparison; the
      // expression parser never sees one because parseType consumes them.
      this.next();
      const right = this.parseBinary(power + 1, noStruct);
      left = { k: "binary", op: tok.text, left, right, line: tok.line };
    }
    return left;
  }

  private parseUnary(noStruct: boolean): Expr {
    const tok = this.peek();
    if (tok.text === "-" || tok.text === "!" || tok.text === "~") {
      this.next();
      return { k: "unary", op: tok.text, operand: this.parseUnary(noStruct), line: tok.line };
    }
    if (tok.text === "++" || tok.text === "--") {
      this.next();
      return { k: "incdec", op: tok.text, target: this.parseUnary(noStruct), prefix: true, line: tok.line };
    }
    if (tok.text === "&") {
      // A Rust borrow. The interpreter has no aliasing model, so `&x` is `x`.
      this.next();
      const mutable = this.accept("mut");
      return { k: "ref", mutable, value: this.parseUnary(noStruct), line: tok.line };
    }
    if (tok.text === "*" && this.dialect !== "cpp") {
      this.next();
      return this.parseUnary(noStruct);
    }
    if (tok.text === "*" && this.dialect === "cpp") {
      // A real dereference node. It used to unwrap to the operand, which read
      // correctly and made `*returnSize = 2` assign to the pointer variable
      // itself — so the write never reached the caller's buffer.
      this.next();
      return { k: "unary", op: "*", operand: this.parseUnary(noStruct), line: tok.line };
    }
    // A C-style cast: `(int) x`, `(const int *) p`, `(char) c`.
    //
    // `(a) * b` is the classic ambiguity here — a real compiler consults its
    // symbol table to decide whether `a` names a type. This one requires the
    // parenthesised text to *contain a type keyword* or to end in `*`, which
    // resolves it the way a reader would: `(a) * b` is a multiplication and
    // `(int *) p` is a cast.
    if (this.dialect !== "rust" && tok.text === "(" && this.looksLikeCast()) {
      this.next();
      const type = this.parseType();
      this.expect(")");
      return { k: "cast", value: this.parseUnary(noStruct), type, line: tok.line };
    }
    return this.parsePostfix(this.parsePrimary(), noStruct);
  }

  private parsePostfix(target: Expr, noStruct: boolean): Expr {
    for (;;) {
      const tok = this.peek();
      // `->` is member access through a pointer or an iterator. Both are plain
      // values in this runtime — a pointer is the sequence it points into, an
      // iterator is the entry it found — so the two spellings do the same work
      // and only C and C++ have the second one.
      if (tok.text === "." || (tok.text === "->" && this.dialect === "cpp")) {
        this.next();
        // A tuple field is a number, not a name.
        if (this.peek().kind === "num") {
          const numTok = this.next();
          // `nested.1.0` lexes as `1.0`; split it back apart.
          if (numTok.float && numTok.text.includes(".")) {
            const [a, b] = numTok.text.split(".");
            target = { k: "field", target: { k: "field", target, name: a, line: tok.line }, name: b, line: tok.line };
          } else {
            target = { k: "field", target, name: numTok.text, line: tok.line };
          }
          continue;
        }
        const name = this.identifier().replace(/!$/, "");
        if (this.at("(")) {
          const args = this.parseArgs();
          /**
           * Rust's entry API, folded into an indexing expression.
           *
           * `*counts.entry(c).or_insert(0) += 1` means exactly `counts[c] += 1`
           * with a default for the missing case, so it becomes that. The
           * alternative was a new kind of value standing for "a writable place
           * inside a map", which would have had to be understood by every
           * switch over `Value` — printing, comparison, copying — to buy one
           * idiom. The deref in front is dropped in `parseUnary`.
           */
          const folded = this.foldEntryApi(target, name, args, tok.line);
          target = folded ?? { k: "method", target, name, args, line: tok.line };
        } else {
          target = { k: "field", target, name, line: tok.line };
        }
        continue;
      }
      if (tok.text === "[") {
        this.next();
        // Go writes a slice with a colon and either bound optional:
        // `a[1:3]`, `a[:k]`, `a[2:]`, `a[:]`.
        if (this.dialect === "go") {
          const from = this.at(":") ? undefined : this.parseExpr();
          if (this.accept(":")) {
            const to = this.at("]") ? undefined : this.parseExpr();
            this.expect("]");
            target = { k: "slice", target, from, to, inclusive: false, line: tok.line };
            continue;
          }
          this.expect("]");
          target = { k: "index", target, index: from!, line: tok.line };
          continue;
        }
        // Rust spells the same thing with a range, and either end may be
        // left off: `&v[1..3]`, `&v[..k]`, `&v[3..]`, `&v[..]`. The bounds are
        // read with `parseBinary` rather than `parseExpr` so that the `..`
        // stays visible here instead of being folded into a range value that
        // cannot represent a missing end.
        if (this.dialect === "rust") {
          const from = this.at("..") || this.at("..=") ? undefined : this.parseBinary(0, false);
          if (this.at("..") || this.at("..=")) {
            const inclusive = this.next().text === "..=";
            const to = this.at("]") ? undefined : this.parseBinary(0, false);
            this.expect("]");
            target = { k: "slice", target, from, to, inclusive, line: tok.line };
            continue;
          }
          this.expect("]");
          target = { k: "index", target, index: from!, line: tok.line };
          continue;
        }
        const index = this.parseExpr();
        this.expect("]");
        target = { k: "index", target, index, line: tok.line };
        continue;
      }
      if (tok.text === "(") {
        target = { k: "call", callee: target, args: this.parseArgs(), line: tok.line };
        continue;
      }
      if (tok.text === "++" || tok.text === "--") {
        this.next();
        target = { k: "incdec", op: tok.text, target, prefix: false, line: tok.line };
        continue;
      }
      if (tok.text === "?" && this.dialect === "rust") {
        throw new UnsupportedError("the `?` operator", tok.line);
      }
      // A Go composite literal for a named type: `Point{1, 2}`. Gated on
      // `noStruct` for the same reason Rust's is — inside an `if` or `for`
      // header the brace opens the body, not a literal.
      if (this.dialect === "go" && tok.text === "{" && !noStruct && target.k === "name") {
        target = this.parseGoComposite(target.name, tok.line);
        continue;
      }
      // A Rust struct literal: `Point { x: 1, y: 2 }`.
      if (
        this.dialect === "rust" && tok.text === "{" && !noStruct && target.k === "name" &&
        /^[A-Z]/.test(target.name)
      ) {
        this.next();
        const fields: { name: string; value: Expr }[] = [];
        while (!this.at("}")) {
          const name = this.identifier();
          let value: Expr;
          if (this.accept(":")) value = this.parseExpr();
          else value = { k: "name", name, line: tok.line };
          fields.push({ name, value });
          if (!this.accept(",")) break;
        }
        this.expect("}");
        target = { k: "struct", name: target.name, fields, line: tok.line };
        continue;
      }
      return target;
    }
  }

  private parseArgs(): Expr[] {
    this.expect("(");
    const args: Expr[] = [];
    while (!this.at(")")) {
      args.push(this.parseExpr());
      if (!this.accept(",")) break;
    }
    this.expect(")");
    return args;
  }

  /**
   * True when the cursor is at a Java or C++ lambda rather than a
   * parenthesised expression.
   *
   * Java's `(a, b) -> a - b` and a parenthesised `(a + b)` both start with the
   * same token, so the only way to tell them apart is to find the matching
   * close paren and look at what follows. `x -> x * 2` and C++'s leading `[`
   * need no scan.
   */
  private looksLikeLambda(): boolean {
    if (this.dialect === "cpp" && this.at("[")) {
      // `[]`, `[&]`, `[=]`, `[&x]` — a capture list, then a parameter list.
      let i = 1;
      let depth = 1;
      while (depth > 0 && this.peek(i).kind !== "eof") {
        if (this.peek(i).text === "[") depth++;
        if (this.peek(i).text === "]") depth--;
        i++;
      }
      return this.peek(i).text === "(";
    }
    // Java only. In C++ an identifier followed by `->` is pointer member
    // access — `p->size()` — and reading that as a lambda would break every
    // program that dereferences anything.
    if (this.dialect === "java" && this.peek().kind === "ident" && this.at("->", 1)) return true;
    if (this.dialect !== "java") return false;
    if (!this.at("(")) return false;
    let i = 1;
    let depth = 1;
    while (depth > 0 && this.peek(i).kind !== "eof") {
      if (this.peek(i).text === "(") depth++;
      if (this.peek(i).text === ")") depth--;
      i++;
    }
    return this.peek(i).text === "->";
  }

  /** Parses the lambda `looksLikeLambda` just identified. */
  private parseLambda(line: number): Expr {
    if (this.dialect === "cpp" && this.at("[")) {
      // Captures are irrelevant here: this interpreter evaluates the body in
      // the defining scope, which is what `[&]` means and is a superset of
      // what `[=]` means for a body that does not outlive its scope.
      let depth = 0;
      do {
        const t = this.next();
        if (t.text === "[") depth++;
        if (t.text === "]") depth--;
      } while (depth > 0 && this.peek().kind !== "eof");
      const params = this.parseClikeParams().map((p) => p.name);
      // An explicit return type, `-> bool`, carries no meaning for us.
      if (this.accept("->")) this.parseType();
      const body: Expr = { k: "block", body: this.parseBlockBody(), line };
      return { k: "closure", params, body, line };
    }

    const params: string[] = [];
    if (this.accept("(")) {
      while (!this.at(")")) {
        // Either `a` or a typed `int a`; the type is skipped either way.
        const save = this.pos;
        this.parseType();
        if (this.peek().kind === "ident") params.push(this.identifier());
        else {
          this.pos = save;
          params.push(this.identifier());
        }
        if (!this.accept(",")) break;
      }
      this.expect(")");
    } else {
      params.push(this.identifier());
    }
    this.expect("->");
    const body: Expr = this.at("{")
      ? { k: "block", body: this.parseBlockBody(), line }
      : this.parseExpr();
    return { k: "closure", params, body, line };
  }

  /** Decides whether the `(` at the cursor opens a C-style cast. */
  private looksLikeCast(): boolean {
    const save = this.pos;
    try {
      this.next();                       // the `(`
      const type = this.parseType();
      if (!this.at(")")) return false;
      // Only a spelling that names a type counts. A bare identifier could be a
      // variable, and reading `(a) * b` as a cast would silently change the
      // meaning of ordinary arithmetic.
      const namesAType = type.endsWith("*") ||
        type.split(/[^A-Za-z_]+/).some((word) => CLIKE_TYPES.has(word));
      if (!namesAType) return false;
      // A cast has to be followed by something to cast.
      const after = this.peek(1);
      if (after.kind === "ident" || after.kind === "num" || after.kind === "str" || after.kind === "char") return true;
      return ["(", "*", "-", "!", "~", "&", "+"].includes(after.text);
    } catch {
      return false;
    } finally {
      this.pos = save;
    }
  }

  private parsePrimary(): Expr {
    // `[]int{...}` and `map[string]int{...}`: a composite literal whose type is
    // written out. Neither `[` nor `map[` can begin any other Go expression, so
    // this needs no lookahead beyond the first two tokens.
    // A Go function literal: `func(i, j int) bool { ... }`. The result type is
    // parsed and dropped — the runtime carries values, not types — and the body
    // becomes a block expression, which is what a closure already holds.
    if (this.dialect === "go" && this.at("func")) {
      const line = this.line;
      this.next();
      const params = this.parseGoParams();
      this.parseGoResult();
      const body: Expr = { k: "block", body: this.parseBlockBody(), line };
      return { k: "closure", params: params.map((param) => param.name), body, line };
    }

    if (this.dialect === "go" && this.atGoTypeLiteral()) {
      const line = this.line;
      const type = this.parseGoType();
      if (this.at("{")) return this.parseGoComposite(type, line);
      // `[]byte(s)` and `[]rune(s)`: a conversion, not a literal.
      if (this.at("(")) {
        this.next();
        const value = this.parseExpr();
        this.accept(",");
        this.expect(")");
        return { k: "cast", value, type, line };
      }
      // A bare type, which only `make` and `new` take. It is carried as a
      // marker so that using one anywhere else fails plainly instead of
      // pretending to be a string.
      return {
        k: "call",
        callee: { k: "name", name: "__type", line },
        args: [{ k: "str", v: type, line }],
        line,
      };
    }

    const tok = this.peek();
    const line = tok.line;

    if (tok.kind === "num") {
      this.next();
      if (tok.float) return { k: "float", v: Number(tok.text.replace(/_/g, "")), line };
      const raw = tok.text.replace(/_/g, "");
      const suffix = tok.suffix ?? "";
      // An unsuffixed literal defaults to 32 bits, but widens rather than
      // overflowing when the value cannot fit — `let c = 9_223_372_036_854_775_807;`
      // is an i64 in every one of these languages.
      let width = BigInt(raw) > 2147483647n || BigInt(raw) < -2147483648n ? 64 : 32;
      let signed = true;
      if (RUST_INT_TYPES.has(suffix)) {
        signed = suffix.startsWith("i");
        width = suffix === "usize" || suffix === "isize" ? 64 : Number(suffix.slice(1));
      } else if (/^[lL]$/.test(suffix)) {
        width = 64;
      }
      return { k: "int", v: BigInt(raw), width, signed, line };
    }
    if (tok.kind === "str") {
      this.next();
      return { k: "str", v: tok.value ?? "", line };
    }
    if (tok.kind === "char") {
      this.next();
      return { k: "char", v: tok.value ?? "", line };
    }

    // A Rust closure: `|x| expr`, `|a, b| { ... }`, or `|| expr` with no params.
    if (this.dialect === "rust" && (tok.text === "|" || tok.text === "||")) {
      this.next();
      const params: string[] = [];
      if (tok.text === "|") {
        while (!this.at("|")) {
          this.accept("mut");
          this.accept("&");
          params.push(this.identifier());
          if (this.accept(":")) this.parseType();
          if (!this.accept(",")) break;
        }
        this.expect("|");
      }
      const body: Expr = this.at("{")
        ? { k: "block", body: this.parseBlockBody(), line }
        : this.parseExpr();
      return { k: "closure", params, body, line };
    }

    // `sizeof(int)` and `sizeof x`. The operand may be a type, which is not an
    // expression, so it is captured as text and resolved by the dialect.
    if (this.dialect === "cpp" && tok.text === "sizeof") {
      this.next();
      if (this.at("(")) {
        const save = this.pos;
        this.next();
        try {
          const type = this.parseType();
          if (this.at(")")) {
            this.next();
            return { k: "call", callee: { k: "name", name: "__sizeof", line }, args: [{ k: "str", v: type, line }], line };
          }
        } catch {
          // Not a type — fall through and read it as an expression.
        }
        this.pos = save;
      }
      const operand = this.parseUnary(false);
      return { k: "call", callee: { k: "name", name: "__sizeof_value", line }, args: [operand], line };
    }

    // A Java or C++ lambda. Both end up as the same closure the Rust `|x|`
    // form produces, which is what lets one comparator implementation serve
    // every dialect.
    if (this.dialect !== "rust" && this.looksLikeLambda()) {
      return this.parseLambda(line);
    }

    // `return {a, b};` and `f({1, 2})`. Only in the C family: Rust reads `{` as
    // a block expression, and Java's array initialisers arrive through `new`.
    if (this.dialect === "cpp" && tok.text === "{") {
      return this.parseBraceList(line);
    }

    if (tok.text === "(") {
      this.next();
      if (this.accept(")")) return { k: "unit", line };
      const first = this.parseExpr();
      if (this.at(",")) {
        const items = [first];
        while (this.accept(",")) {
          if (this.at(")")) break;
          items.push(this.parseExpr());
        }
        this.expect(")");
        return { k: "tuple", items, line };
      }
      this.expect(")");
      return first;
    }

    if (tok.text === "[") {
      this.next();
      const items: Expr[] = [];
      let repeat: Expr | undefined;
      while (!this.at("]")) {
        items.push(this.parseExpr());
        if (this.accept(";")) {
          repeat = this.parseExpr();
          break;
        }
        if (!this.accept(",")) break;
      }
      this.expect("]");
      return { k: "list", items, repeat, line };
    }

    if (tok.text === "{" && this.dialect === "rust") {
      return { k: "block", body: this.parseBlockBody(), line };
    }

    if (tok.kind === "ident") {
      // Keywords that are expressions.
      if (tok.text === "true" || tok.text === "false") {
        this.next();
        return { k: "bool", v: tok.text === "true", line };
      }
      if (tok.text === "if") {
        this.next();
        const cond = this.parseExpr(true);
        const then: Stmt = { k: "block", body: this.parseBlockBody(), line };
        let other: Stmt | undefined;
        if (this.accept("else")) {
          other = this.at("if")
            ? { k: "expr", expr: this.parsePrimary(), line }
            : { k: "block", body: this.parseBlockBody(), line };
          // `else if` must propagate its value, so wrap it as a tail statement.
          if (other.k === "expr") other = { k: "tail", expr: other.expr, line };
        }
        return { k: "if", cond, then, other, line };
      }
      if (tok.text === "match" && this.dialect === "rust") {
        this.next();
        return this.parseMatch(line);
      }
      if (tok.text === "new" && this.dialect === "java") {
        this.next();
        const type = this.parseType();
        // `new int[]{1, 2, 3}` — the sized form is handled below, but with the
        // brackets empty `parseType` has already eaten them and what is left
        // is the initialiser.
        if (this.at("{")) return this.parseBraceList(line);
        if (this.at("[")) {
          // Every dimension at once: `new int[m][n]` is two, and parsing only
          // the first left `[n]` to be read as an *index* into the row array,
          // which failed with an out-of-bounds instead of allocating a grid.
          const dims: (Expr | null)[] = [];
          while (this.at("[")) {
            this.next();
            if (this.accept("]")) {
              dims.push(null);          // a jagged dimension: `new int[n][]`
              continue;
            }
            const size = this.parseExpr();
            this.expect("]");
            dims.push(size);
          }
          // Built inside out, so each row is repeated from a fresh copy of the
          // row below it rather than every row aliasing one shared array.
          let element: Expr = zeroFor(type, line);
          for (let i = dims.length - 1; i >= 0; i--) {
            const size = dims[i];
            element = size
              ? { k: "list", items: [element], repeat: size, line }
              : { k: "list", items: [], line };
          }
          return element;
        }
        const args = this.at("(") ? this.parseArgs() : [];
        return { k: "call", callee: { k: "name", name: "new " + type.replace(/<.*>$/, ""), line }, args, line };
      }
      if (tok.text.endsWith("!")) {
        this.next();
        const name = tok.text.slice(0, -1);
        const open = this.peek().text;
        if (open !== "(" && open !== "[" && open !== "{") {
          throw new ProgramError(`expected arguments after \`${tok.text}\``, line);
        }
        const close = open === "(" ? ")" : open === "[" ? "]" : "}";
        this.next();
        const args: Expr[] = [];
        while (!this.at(close)) {
          args.push(this.parseExpr());
          if (this.accept(";")) {
            // `vec![0; 4]` — the repeat form.
            const count = this.parseExpr();
            this.expect(close);
            return { k: "macro", name, args: [{ k: "list", items: args, repeat: count, line }], line };
          }
          if (!this.accept(",")) break;
        }
        this.expect(close);
        return { k: "macro", name, args, line };
      }

      // A path such as `String::from`, `i32::MAX`, `System.out.println`.
      this.next();

      // `greater<int>()`, `vector<int>(n)`: a template instantiated as a value.
      // C++ resolves the `a < b > (c)` ambiguity with type information, which
      // is not available here, so the rule is syntactic — commit only when a
      // balanced `<...>` is followed immediately by `(`. Two comparisons in a
      // row almost never take that shape, and when they do the parentheses
      // that disambiguate them are already there.
      if (this.dialect === "cpp" && this.at("<")) {
        const save = this.pos;
        const generic = this.scanTemplateArgs();
        if (generic !== null && this.at("(")) {
          return { k: "name", name: tok.text + generic, line };
        }
        this.pos = save;
      }

      const segments = [tok.text];
      while ((this.at("::") || (this.dialect !== "rust" && this.at(".") && this.peek(1).kind === "ident" && isNamespace(segments, this.dialect)))) {
        this.next();
        if (this.at("<")) {
          // A turbofish: `size_of::<i32>()`
          this.parseGenericArgs(segments);
          continue;
        }
        segments.push(this.identifier());
      }
      if (segments.length > 1) return { k: "path", segments, line };
      if (RUST_KEYWORDS.has(tok.text) && this.dialect === "rust" && tok.text !== "self" && tok.text !== "Self") {
        throw new ProgramError(`unexpected keyword \`${tok.text}\``, line);
      }
      return { k: "name", name: tok.text, line };
    }

    throw new ProgramError(`unexpected \`${tok.text || "end of file"}\``, line);
  }

  /**
   * A braced initialiser, converted to the declared type when that type is a
   * container a brace list cannot itself express.
   *
   * `set<int> s = {10, 20, 30}` and `vector<int> v = {10, 20, 30}` are written
   * identically, so the elements alone never say which was meant — the
   * declaration is the only evidence, and it is available right here. Anything
   * that is not one of those container types keeps the plain list it had.
   */
  private braceInit(declType: string, line: number): Expr {
    const items = this.parseBraceList(line);
    if (this.dialect === "cpp" && DEFAULT_CONSTRUCTED.test(declType)) {
      return {
        k: "call",
        callee: { k: "name", name: "__init", line },
        args: [{ k: "str", v: declType, line }, items],
        line,
      };
    }
    return items;
  }

  /**
   * Consumes a balanced `<...>` and returns its text, or null — restoring
   * nothing — when the angle brackets do not close before the statement does.
   * The caller decides whether to keep the result.
   */
  private scanTemplateArgs(): string | null {
    let depth = 0;
    let text = "";
    for (;;) {
      const t = this.peek();
      if (t.kind === "eof" || t.text === ";" || t.text === "{") return null;
      this.next();
      if (t.text === "<") depth++;
      else if (t.text === ">") depth--;
      else if (t.text === ">>") depth -= 2;
      text += t.text;
      if (depth <= 0) return text;
    }
  }

  private parseGenericArgs(segments: string[]) {
    let depth = 0;
    let text = "";
    do {
      const t = this.next();
      if (t.text === "<") depth++;
      if (t.text === ">") depth--;
      if (t.text === ">>") depth -= 2;
      if (depth > 0 && t.text !== "<") text += t.text;
    } while (depth > 0 && this.peek().kind !== "eof");
    if (text) segments.push("<" + text + ">");
  }

  private parseMatch(line: number): Expr {
    const subject = this.parseExpr(true);
    this.expect("{");
    const arms: MatchArm[] = [];
    while (!this.at("}")) {
      const pattern = this.parsePattern();
      let guard: Expr | undefined;
      if (this.accept("if")) guard = this.parseExpr(true);
      this.expect("=>");
      const body = this.at("{")
        ? ({ k: "block", body: this.parseBlockBody(), line: this.line } as Expr)
        : this.parseExpr();
      arms.push({ pattern, guard, body });
      this.accept(",");
    }
    this.expect("}");
    return { k: "match", subject, arms, line };
  }

  private parsePattern(): Pattern | null {
    const options: Pattern[] = [];
    for (;;) {
      const tok = this.peek();
      if (tok.text === "_") {
        this.next();
        if (options.length === 0 && !this.at("|")) return null;
        options.push({ k: "bind", name: "_" });
      } else if (tok.kind === "ident" && /^[A-Z]/.test(tok.text)) {
        // A variant, possibly with bindings: `Some(x)`, `None`.
        this.next();
        let name = tok.text;
        while (this.accept("::")) name += "::" + this.identifier();
        const bindings: string[] = [];
        if (this.accept("(")) {
          while (!this.at(")")) {
            // `Some(&x)` and `Some(ref x)` bind what `Some(x)` binds: this
            // runtime has no separate borrowed value to distinguish them.
            while (this.at("&")) this.next();
            if (this.peek().kind === "ident" && this.peek().text === "ref") this.next();
            if (this.peek().kind === "ident" && this.peek().text === "mut") this.next();
            bindings.push(this.identifier());
            if (!this.accept(",")) break;
          }
          this.expect(")");
        }
        options.push({ k: "variant", name, bindings });
      } else if (tok.kind === "ident" && !RUST_KEYWORDS.has(tok.text)) {
        this.next();
        options.push({ k: "bind", name: tok.text });
      } else {
        const value = this.parseBinary(0, true);
        if (this.at("..=") || this.at("..")) {
          const inclusive = this.next().text === "..=";
          const to = this.parseBinary(0, true);
          options.push({ k: "range", from: value, to, inclusive });
        } else {
          options.push({ k: "lit", value });
        }
      }
      if (!this.accept("|")) break;
    }
    return options.length === 1 ? options[0] : { k: "or", options };
  }

  /**
   * Turns `m.entry(k).or_insert(d)` into `m[k]`, carrying `d` as the value to
   * store when the key is absent.
   *
   * `or_insert_with(f)` defers to a call, so `Vec::new` is only invoked on a
   * miss. `or_default()` is deliberately left alone: the default depends on a
   * type this runtime does not track, and guessing zero would silently be
   * wrong for every map whose values are not numbers.
   */
  private foldEntryApi(target: Expr, name: string, args: Expr[], line: number): Expr | null {
    if (this.dialect !== "rust") return null;
    if (target.k !== "method" || target.name !== "entry" || target.args.length !== 1) return null;
    if (name === "or_insert" && args.length === 1) {
      return { k: "index", target: target.target, index: target.args[0], orInsert: args[0], line };
    }
    if (name === "or_insert_with" && args.length === 1) {
      return {
        k: "index",
        target: target.target,
        index: target.args[0],
        orInsert: { k: "call", callee: args[0], args: [], line },
        line,
      };
    }
    return null;
  }

  // -------------------------------------------------------------- statements

  private parseBlockBody(): Stmt[] {
    this.expect("{");
    const body: Stmt[] = [];
    while (!this.at("}") && this.peek().kind !== "eof") {
      body.push(this.parseStmt());
    }
    this.expect("}");
    return body;
  }

  parseStmt(): Stmt {
    if (this.dialect === "go") return this.parseGoStmt();
    const tok = this.peek();
    const line = tok.line;

    if (tok.text === "{") return { k: "block", body: this.parseBlockBody(), line };
    if (tok.text === ";") { this.next(); return { k: "block", body: [], line }; }

    if (tok.kind === "ident") {
      switch (tok.text) {
        case "let": {
          if (this.dialect !== "rust") break;
          this.next();
          const mutable = this.accept("mut");
          // `let (a, b) = ...` destructuring is common enough to be worth it.
          if (this.at("(")) return this.parseDestructuringLet(mutable, line);
          const name = this.identifier();
          let type: string | undefined;
          if (this.accept(":")) type = this.parseType();
          let init: Expr | undefined;
          if (this.accept("=")) init = this.parseExpr();
          this.expect(";");
          return { k: "let", name, mutable, type, init, line };
        }
        case "if": {
          this.next();
          // `if let Some(x) = e { .. } else { .. }` is the same thing as a
          // two-arm match, so it becomes one rather than growing a second
          // pattern-matching path that could drift from the first.
          if (this.dialect === "rust" && this.at("let")) {
            this.next();
            const pattern = this.parsePattern();
            this.expect("=");
            const subject = this.parseExpr(true);
            const then = this.parseBlockBody();
            let other: Stmt[] = [];
            if (this.accept("else")) {
              other = this.at("if") ? [this.parseStmt()] : this.parseBlockBody();
            }
            const arms: MatchArm[] = [
              { pattern, body: { k: "block", body: then, line } },
              { pattern: null, body: { k: "block", body: other, line } },
            ];
            return { k: "expr", expr: { k: "match", subject, arms, line }, line };
          }
          const cond = this.parseExpr(true);
          const then = this.parseBody();
          let other: Stmt | undefined;
          if (this.accept("else")) other = this.at("if") ? this.parseStmt() : this.parseBody();
          return { k: "if", cond, then, other, line };
        }
        case "while": {
          this.next();
          // `while let Some(x) = stack.pop()` — loop until the pattern stops
          // matching. Built as `loop { match .. { pat => body, _ => break } }`
          // for the same reason as `if let`: one pattern matcher, not two.
          if (this.dialect === "rust" && this.at("let")) {
            this.next();
            const pattern = this.parsePattern();
            this.expect("=");
            const subject = this.parseExpr(true);
            const body = this.parseBlockBody();
            const arms: MatchArm[] = [
              { pattern, body: { k: "block", body, line } },
              { pattern: null, body: { k: "block", body: [{ k: "break", line }], line } },
            ];
            return {
              k: "while",
              cond: { k: "bool", v: true, line },
              body: { k: "expr", expr: { k: "match", subject, arms, line }, line },
              line,
            };
          }
          const cond = this.dialect === "rust" ? this.parseExpr(true) : this.parenExpr();
          return { k: "while", cond, body: this.parseBody(), line };
        }
        case "do": {
          if (this.dialect === "rust") break;
          this.next();
          const body = this.parseBody();
          this.expect("while");
          const cond = this.parenExpr();
          this.expect(";");
          return { k: "doWhile", cond, body, line };
        }
        case "loop": {
          if (this.dialect !== "rust") break;
          this.next();
          return { k: "loop", body: this.parseBody(), line };
        }
        case "for":
          this.next();
          return this.parseFor(line);
        case "return": {
          this.next();
          if (this.accept(";")) return { k: "return", line };
          const value = this.parseExpr();
          this.accept(";");
          return { k: "return", value, line };
        }
        case "break":
          this.next();
          this.accept(";");
          return { k: "break", line };
        case "continue":
          this.next();
          this.accept(";");
          return { k: "continue", line };
        case "final":
        case "const":
        case "static":
          if (this.dialect === "rust") break;
          this.next();
          return this.parseStmt();
      }

      if (this.dialect !== "rust" && this.looksLikeDeclaration()) {
        return this.parseClikeDeclaration(line);
      }
    }

    const expr = this.parseExpr();
    if (this.accept(";")) return { k: "expr", expr, line };
    // Rust: an expression with no semicolon at the end of a block is its value.
    return { k: "tail", expr, line };
  }

  private parseDestructuringLet(mutable: boolean, line: number): Stmt {
    this.expect("(");
    const names: string[] = [];
    while (!this.at(")")) {
      this.accept("mut");
      names.push(this.identifier());
      if (!this.accept(",")) break;
    }
    this.expect(")");
    if (this.accept(":")) this.parseType();
    this.expect("=");
    const init = this.parseExpr();
    this.expect(";");
    // Bind the tuple to a hidden name, then pull each field out of it.
    const temp = `__destructure_${line}`;
    const body: Stmt[] = [{ k: "let", name: temp, mutable: false, init, line }];
    names.forEach((name, i) => {
      body.push({
        k: "let",
        name,
        mutable,
        init: { k: "field", target: { k: "name", name: temp, line }, name: String(i), line },
        line,
      });
    });
    // `multi` runs in the enclosing scope; a `block` would scope the new
    // bindings away the moment the statement finished.
    return { k: "multi", body, line };
  }

  private parenExpr(): Expr {
    this.expect("(");
    const expr = this.parseExpr();
    this.expect(")");
    return expr;
  }

  private parseBody(): Stmt {
    if (this.at("{")) return { k: "block", body: this.parseBlockBody(), line: this.line };
    if (this.dialect === "rust" || this.dialect === "go") {
      const language = this.dialect === "rust" ? "Rust" : "Go";
      throw new ProgramError(`expected \`{\` — ${language} requires braces around a block`, this.line);
    }
    return this.parseStmt();
  }

  private parseFor(line: number): Stmt {
    if (this.dialect === "rust") {
      if (this.at("(")) {
        const names = this.destructureLoopPattern();
        this.expect("in");
        const iterable = this.parseExpr(true);
        return { k: "forIn", name: names[0], names, iterable, body: this.parseBody(), line };
      }
      const name = this.identifier();
      this.expect("in");
      const iterable = this.parseExpr(true);
      return { k: "forIn", name, iterable, body: this.parseBody(), line };
    }

    this.expect("(");
    // for-each: `for (auto x : items)` / `for (int x : items)`
    const save = this.pos;
    try {
      if (this.peek().kind === "ident") {
        this.parseType();
        if (this.peek().kind === "ident" && this.at(":", 1)) {
          const name = this.identifier();
          this.expect(":");
          const iterable = this.parseExpr();
          this.expect(")");
          return { k: "forIn", name, iterable, body: this.parseBody(), line };
        }
      }
    } catch {
      // fall through to the C-style form
    }
    this.pos = save;

    let init: Stmt | undefined;
    if (!this.at(";")) {
      init = this.looksLikeDeclaration() ? this.parseClikeDeclaration(line) : { k: "expr", expr: this.parseExpr(), line };
      if (init.k === "expr") this.expect(";");
    } else {
      this.next();
    }
    const cond = this.at(";") ? undefined : this.parseExpr();
    this.expect(";");
    const step = this.at(")") ? undefined : this.parseExpr();
    this.expect(")");
    return { k: "forC", init, cond, step, body: this.parseBody(), line };
  }

  /**
   * A Rust tuple pattern in a `for` header: `for (i, x) in ...`.
   *
   * `&` and `ref` are accepted and dropped. The interpreter has no separate
   * notion of a borrow, so `for (i, &x)` binds exactly what `for (i, x)` does
   * — and rejecting the ampersand would turn ordinary Rust into a parse error
   * over a distinction this runtime does not model anyway.
   */
  private destructureLoopPattern(): string[] {
    this.expect("(");
    const names: string[] = [];
    do {
      while (this.at("&")) this.next();
      if (this.peek().kind === "ident" && this.peek().text === "ref") this.next();
      if (this.peek().kind === "ident" && this.peek().text === "mut") this.next();
      names.push(this.identifier());
    } while (this.accept(","));
    this.expect(")");
    return names;
  }

  /** `int x = 3, y = 4;` becomes a block of `let` statements. */
  private parseClikeDeclaration(line: number): Stmt {
    this.skipClikeSpecifiers();
    const type = this.parseType();
    const decls: Stmt[] = [];
    for (;;) {
      const name = this.identifier();
      let declType = type;
      // C and C++ put the size on the *name*: `char buf[64]`, `int grid[3][4]`.
      // An empty pair is just a type decoration; a sized one has to allocate.
      const dims: Expr[] = [];
      while (this.at("[")) {
        this.next();
        if (this.accept("]")) { declType += "[]"; continue; }
        dims.push(this.parseExpr());
        this.expect("]");
        declType += "[]";
      }
      let init: Expr | undefined;
      if (this.accept("=")) {
        init = this.at("{") ? this.braceInit(declType, line) : this.parseExpr();
      } else if (this.at("(")) {
        // C++ direct initialisation: `std::string name("x")`
        init = { k: "call", callee: { k: "name", name: declType, line }, args: this.parseArgs(), line };
      } else if (this.at("{")) {
        init = this.braceInit(declType, line);
      } else if (dims.length > 0) {
        // Built inside out so each row is its own array rather than a shared one.
        let element: Expr = zeroFor(type, line);
        for (let i = dims.length - 1; i >= 0; i--) {
          element = { k: "list", items: [element], repeat: dims[i], line };
        }
        init = element;
      } else {
        init = zeroFor(declType, line);
      }
      decls.push({ k: "let", name, mutable: true, type: declType, init, line });
      if (!this.accept(",")) break;
    }
    this.expect(";");
    return decls.length === 1 ? decls[0] : { k: "multi", body: decls, line };
  }

  // ------------------------------------------------------------------ items

  parseProgram(): Program {
    const functions = new Map<string, FnDecl>();
    const structs = new Map<string, StructDecl>();
    const globals: Stmt[] = [];

    while (this.peek().kind !== "eof") {
      const tok = this.peek();

      if (tok.text === "use" || tok.text === "mod" || tok.text === "using" || tok.text === "import" || tok.text === "package") {
        this.next();
        // Go groups its imports in parentheses, and every line inside one ends
        // with an inserted semicolon — so stopping at the first `;` would leave
        // the rest of the group sitting at the top level.
        if (this.at("(")) {
          let depth = 0;
          do {
            const inner = this.next();
            if (inner.text === "(") depth++;
            if (inner.text === ")") depth--;
          } while (depth > 0 && this.peek().kind !== "eof");
          this.accept(";");
          continue;
        }
        while (this.peek().kind !== "eof" && !this.accept(";")) this.next();
        continue;
      }
      if (tok.text === "pub" || tok.text === "public" || tok.text === "private" || tok.text === "protected" || tok.text === "final" || tok.text === "abstract") {
        this.next();
        continue;
      }
      if (tok.text === "static" && this.dialect === "java") {
        this.next();
        continue;
      }
      if (tok.text === ";") { this.next(); continue; }

      if (this.dialect === "go") {
        if (tok.text === "func") {
          const { decl, receiverType } = this.parseGoFn();
          if (receiverType) {
            const target = structs.get(receiverType)
              ?? { name: receiverType, fields: [], methods: new Map() };
            structs.set(receiverType, target);
            target.methods.set(decl.name, decl);
          } else {
            functions.set(decl.name, decl);
          }
          continue;
        }
        if (tok.text === "var" || tok.text === "const") {
          globals.push(this.parseGoVar(tok.text, tok.line));
          continue;
        }
        if (tok.text === "type") {
          this.parseGoTypeDecl(structs, functions);
          continue;
        }
        throw new ProgramError(`unexpected \`${tok.text}\` at the top level`, tok.line);
      }

      if (tok.text === "fn" && this.dialect === "rust") {
        const decl = this.parseRustFn();
        functions.set(decl.name, decl);
        continue;
      }
      // Rust's `const NAME: T = ...;` / `static NAME: T = ...;`. C++ spells its
      // file-scope constants `const int MAX = 10;`, which is an ordinary
      // declaration and is handled by the C-family branch further down.
      if ((tok.text === "const" || tok.text === "static") && this.dialect === "rust") {
        this.next();
        this.accept("mut");
        const name = this.identifier();
        let type: string | undefined;
        if (this.accept(":")) type = this.parseType();
        this.expect("=");
        const init = this.parseExpr();
        this.accept(";");
        globals.push({ k: "let", name, mutable: false, type, init, line: tok.line });
        continue;
      }
      if (tok.text === "struct" || tok.text === "class") {
        this.parseTypeDecl(structs, functions, globals);
        continue;
      }
      if (tok.text === "enum") {
        throw new UnsupportedError("`enum` declarations", tok.line);
      }
      if (tok.text === "impl" && this.dialect === "rust") {
        this.next();
        const name = this.parseType();
        this.expect("{");
        const target = structs.get(name) ?? { name, fields: [], methods: new Map() };
        structs.set(name, target);
        while (!this.at("}") && this.peek().kind !== "eof") {
          if (this.accept("pub")) continue;
          if (this.at("fn")) {
            const decl = this.parseRustFn();
            // An associated function with no `self` is callable as `Type::name`.
            if (decl.params[0]?.name === "self") {
              decl.params.shift();
              target.methods.set(decl.name, decl);
            } else {
              functions.set(decl.name, decl);
              functions.set(`${name}::${decl.name}`, decl);
            }
            continue;
          }
          this.next();
        }
        this.expect("}");
        continue;
      }

      if (this.dialect !== "rust") {
        // A free function: `T name(params) { ... }`, possibly behind specifiers
        // such as `constexpr` or `inline`. They are skipped inside the attempt
        // so that a failure rewinds past them and the declaration fallback
        // below still sees them.
        const save = this.pos;
        // Once the signature and the opening brace are behind us this can only
        // be a function, so a later failure is a failure *in the body* and must
        // surface with its own line rather than being rewound and re-reported
        // against the signature.
        let committed = false;
        try {
          this.skipClikeSpecifiers();
          const returnType = this.parseType();
          const name = this.identifier();
          if (this.at("(")) {
            const params = this.parseClikeParams();
            if (this.at("{")) {
              committed = true;
              const body = this.parseBlockBody();
              functions.set(name, { name, params, body, returnType, line: tok.line });
              continue;
            }
            if (this.accept(";")) continue; // a forward declaration
          }
          this.pos = save;
        } catch (error) {
          if (committed) throw error;
          this.pos = save;
        }
        // Anything else at top level is a global declaration.
        if (this.looksLikeDeclaration()) {
          globals.push(this.parseClikeDeclaration(tok.line));
          continue;
        }
      }

      throw new ProgramError(`unexpected \`${tok.text}\` at the top level`, tok.line);
    }

    const entry = this.dialect === "rust" ? "main" : "main";
    return { functions, structs, globals, entry };
  }

  private parseRustFn(): FnDecl {
    const line = this.line;
    this.expect("fn");
    const name = this.identifier();
    if (this.at("<")) this.parseGenericArgs([]);
    this.expect("(");
    const params: Param[] = [];
    while (!this.at(")")) {
      // `&self` / `&mut self` / `self`
      const save = this.pos;
      while (this.at("&") || this.at("mut")) this.next();
      if (this.at("self")) {
        this.next();
        params.push({ name: "self" });
        this.accept(",");
        continue;
      }
      this.pos = save;
      this.accept("mut");
      const pname = this.identifier();
      let type: string | undefined;
      if (this.accept(":")) type = this.parseType();
      params.push({ name: pname, type });
      if (!this.accept(",")) break;
    }
    this.expect(")");
    let returnType: string | undefined;
    if (this.accept("->")) returnType = this.parseType();
    if (this.at("where")) {
      while (!this.at("{") && this.peek().kind !== "eof") this.next();
    }
    return { name, params, body: this.parseBlockBody(), returnType, line };
  }

  private parseClikeParams(): Param[] {
    this.expect("(");
    const params: Param[] = [];
    while (!this.at(")")) {
      while (this.at("final") || this.at("const")) this.next();
      const type = this.parseType();
      if (type === "void" && this.at(")")) break;
      const name = this.identifier();
      let full = type;
      while (this.at("[") && this.at("]", 1)) {
        this.next();
        this.next();
        full += "[]";
      }
      params.push({ name, type: full });
      if (!this.accept(",")) break;
    }
    this.expect(")");
    return params;
  }

  private parseTypeDecl(
    structs: Map<string, StructDecl>,
    functions: Map<string, FnDecl>,
    globals: Stmt[]
  ) {
    this.next(); // struct | class
    const name = this.identifier();
    if (this.at("<")) this.parseGenericArgs([]);
    // Java `extends`/`implements`, C++ base clauses.
    while (!this.at("{") && !this.at(";") && this.peek().kind !== "eof") this.next();
    if (this.accept(";")) return;
    this.expect("{");

    const decl: StructDecl = structs.get(name) ?? { name, fields: [], methods: new Map() };
    structs.set(name, decl);
    const isMainClass = this.dialect === "java";

    while (!this.at("}") && this.peek().kind !== "eof") {
      const tok = this.peek();
      if (["public", "private", "protected", "static", "final", "abstract"].includes(tok.text)) {
        this.next();
        // C++ access labels are followed by a colon.
        this.accept(":");
        continue;
      }
      if (tok.text === ";") { this.next(); continue; }

      const save = this.pos;
      /**
       * Set once the tokens can only be a method: a type, a name, a parameter
       * list and an opening brace. After that point an error comes from the
       * *body*, and swallowing it reported every such failure as "cannot parse
       * member `void`" — pointing at the signature, which was fine, instead of
       * at the line that was not.
       */
      let committed = false;
      try {
        const returnType = this.parseType();
        if (this.peek().kind === "ident") {
          const memberName = this.identifier();
          if (this.at("(")) {
            const params = this.parseClikeParams();
            while (this.at("const") || this.at("override") || this.at("throws")) {
              this.next();
              if (this.peek().kind === "ident" && !this.at("{")) this.next();
            }
            if (this.at("{")) {
              committed = true;
              const body = this.parseBlockBody();
              const fn: FnDecl = { name: memberName, params, body, returnType, line: tok.line };
              // Java's `main` and any other static method live in the global
              // function table; C++ member functions stay on the struct.
              if (isMainClass) functions.set(memberName, fn);
              else decl.methods.set(memberName, fn);
              continue;
            }
            if (this.accept(";")) continue;
          }
          // A field.
          this.pos = save;
          const stmt = this.parseClikeDeclaration(tok.line);
          if (isMainClass) globals.push(stmt);
          else {
            for (const s of stmt.k === "block" ? stmt.body : [stmt]) {
              if (s.k === "let") decl.fields.push(s.name);
            }
          }
          continue;
        }
      } catch (error) {
        if (committed) throw error;
        // Not a C-family member; fall through to the Rust field form.
      }
      this.pos = save;

      if (this.dialect === "rust") {
        // `field: Type,`
        const fieldName = this.identifier();
        this.expect(":");
        this.parseType();
        decl.fields.push(fieldName);
        this.accept(",");
        continue;
      }
      throw new ProgramError(`cannot parse member \`${tok.text}\``, tok.line);
    }
    this.expect("}");
    this.accept(";");
  }

  // -------------------------------------------------------------------- Go

  /**
   * Go's types read the opposite way round from C's: the name comes first and
   * the type follows, and a composite type is built with prefixes rather than
   * the spiral rule. `[]int`, `map[string][]int` and `*Node` are all parsed
   * here and kept as their written text, which is all the runtime needs.
   */
  private parseGoType(): string {
    if (this.accept("*")) return "*" + this.parseGoType();
    if (this.at("[")) {
      this.next();
      if (this.accept("]")) return "[]" + this.parseGoType();
      let size = "";
      while (!this.at("]") && this.peek().kind !== "eof") size += this.next().text;
      this.expect("]");
      return `[${size}]` + this.parseGoType();
    }
    if (this.at("map")) {
      this.next();
      this.expect("[");
      const key = this.parseGoType();
      this.expect("]");
      return `map[${key}]${this.parseGoType()}`;
    }
    if (this.at("interface")) {
      this.next();
      this.expect("{");
      this.expect("}");
      return "any";
    }
    if (this.at("chan") || this.at("func")) {
      throw new UnsupportedError(`the \`${this.peek().text}\` type`, this.line);
    }
    let name = this.identifier();
    if (this.at(".") && this.peek(1).kind === "ident") {
      this.next();
      name += "." + this.identifier();
    }
    return name;
  }

  /** The zero value of a Go type, left for the dialect to build. */
  private goZero(type: string, line: number): Expr {
    return {
      k: "call",
      callee: { k: "name", name: "__default", line },
      args: [{ k: "str", v: type, line }],
      line,
    };
  }

  /**
   * A composite literal: `[]int{1, 2}`, `map[string]int{"a": 1}`, `Point{1, 2}`.
   *
   * Nested literals may leave their type out — `[][]int{{1, 2}, {3, 4}}` writes
   * the inner slices bare — so the element type is threaded down and supplied
   * on the way.
   */
  private parseGoComposite(type: string, line: number): Expr {
    this.expect("{");
    const items: Expr[] = [];
    const elem = goElementType(type);
    const isMap = type.startsWith("map[");
    const composite = type.startsWith("[]") || type.startsWith("[") || isMap;
    while (!this.at("}")) {
      if (this.at(";")) { this.next(); continue; }
      // `Point{X: 3}` names a *field*, where `map[string]int{k: 1}` gives an
      // expression for a key. They are written identically, so the declared
      // type is what tells them apart — and a field name must not be looked up
      // as a variable.
      if (!composite && this.peek().kind === "ident" && this.at(":", 1)) {
        const field = this.identifier();
        this.next();
        const value = this.at("{") ? this.parseGoComposite(elem, line) : this.parseExpr();
        items.push({ k: "tuple", items: [{ k: "str", v: field, line }, value], line });
        if (!this.accept(",")) { this.accept(";"); break; }
        this.accept(";");
        continue;
      }
      let item = this.at("{") ? this.parseGoComposite(elem, line) : this.parseExpr();
      // A key: either a map entry, or a named field in a struct literal.
      if (this.accept(":")) {
        const value = this.at("{") ? this.parseGoComposite(elem, line) : this.parseExpr();
        item = { k: "tuple", items: [item, value], line };
      } else if (isMap) {
        throw new ProgramError("a map literal needs `key: value` entries", line);
      }
      items.push(item);
      if (!this.accept(",")) {
        this.accept(";");
        break;
      }
      this.accept(";");
    }
    this.expect("}");
    return {
      k: "call",
      callee: { k: "name", name: "__composite", line },
      args: [{ k: "str", v: type, line }, { k: "list", items, line }],
      line,
    };
  }

  /** True when the cursor is on a type that can only introduce a literal. */
  private atGoTypeLiteral(): boolean {
    if (this.at("map") && this.at("[", 1)) return true;
    // `[]T{...}` and `[N]T{...}`. A bare `[` otherwise cannot start a Go
    // expression, so there is nothing to be ambiguous with.
    return this.at("[");
  }

  private parseGoParams(): Param[] {
    this.expect("(");
    const out: Param[] = [];
    let pending: string[] = [];
    while (!this.at(")") && this.peek().kind !== "eof") {
      const name = this.identifier();
      if (this.accept(",")) {
        pending.push(name);
        continue;
      }
      if (this.at(")")) {
        pending.push(name);
        break;
      }
      const type = this.parseGoType();
      pending.push(name);
      for (const n of pending) out.push({ name: n, type });
      pending = [];
      if (!this.accept(",")) break;
    }
    this.expect(")");
    // Names with no type at all: a signature written types-only, which a
    // program that calls it never depends on.
    for (const n of pending) out.push({ name: n });
    return out;
  }

  /** The return type, which Go writes after the parameters and may omit. */
  private parseGoResult(): string | undefined {
    if (this.at("{") || this.at(";")) return undefined;
    if (this.at("(")) {
      this.next();
      const parts: string[] = [];
      while (!this.at(")") && this.peek().kind !== "eof") {
        const save = this.pos;
        // A named result — `(n int, err error)` — carries a name we discard.
        try {
          const first = this.parseGoType();
          if (!this.at(",") && !this.at(")")) parts.push(this.parseGoType());
          else parts.push(first);
        } catch {
          this.pos = save;
          parts.push(this.parseGoType());
        }
        if (!this.accept(",")) break;
      }
      this.expect(")");
      return parts.length === 1 ? parts[0] : `(${parts.join(", ")})`;
    }
    return this.parseGoType();
  }

  /**
   * A function, or a method.
   *
   * `func (p *Point) Dist() float64` names its receiver whatever the author
   * liked, where the evaluator binds a method's receiver as `self`. Rather than
   * teach the evaluator a second convention, the receiver's chosen name is
   * bound to `self` by a statement inserted at the top of the body — after
   * which the body reads exactly as written.
   */
  private parseGoFn(): { decl: FnDecl; receiverType?: string } {
    const line = this.line;
    this.expect("func");
    let receiver: Param | undefined;
    if (this.at("(")) receiver = this.parseGoParams()[0];
    const name = this.identifier();
    const params = this.parseGoParams();
    const returnType = this.parseGoResult();
    const body = this.parseBlockBody();
    if (!receiver) return { decl: { name, params, body, returnType, line } };
    return {
      decl: {
        name,
        params,
        body: [
          {
            k: "let",
            name: receiver.name,
            mutable: true,
            init: { k: "name", name: "self", line },
            line,
          },
          ...body,
        ],
        returnType,
        line,
      },
      receiverType: (receiver.type ?? "").replace(/^\*/, ""),
    };
  }

  /**
   * `var` and `const`, in both the single and the parenthesised group form.
   */
  private parseGoVar(keyword: string, line: number): Stmt {
    this.expect(keyword);
    const decls: Stmt[] = [];
    const one = () => {
      const names = [this.identifier()];
      while (this.accept(",")) names.push(this.identifier());
      let type: string | undefined;
      if (!this.at("=") && !this.at(";") && !this.at(")")) type = this.parseGoType();
      if (this.accept("=")) {
        const values = [this.parseGoValue(type)];
        while (this.accept(",")) values.push(this.parseGoValue(type));
        if (names.length > 1 && values.length === 1) {
          decls.push(...this.spreadTuple(names, values[0], line));
        } else {
          names.forEach((n, i) => {
            decls.push({ k: "let", name: n, mutable: true, type, init: values[i], line });
          });
        }
      } else {
        for (const n of names) {
          decls.push({ k: "let", name: n, mutable: true, type, init: this.goZero(type ?? "int", line), line });
        }
      }
    };
    if (this.accept("(")) {
      while (!this.at(")") && this.peek().kind !== "eof") {
        if (this.accept(";")) continue;
        one();
        this.accept(";");
      }
      this.expect(")");
    } else {
      one();
    }
    this.accept(";");
    return decls.length === 1 ? decls[0] : { k: "multi", body: decls, line };
  }

  /**
   * An initialiser, which may be a composite literal whose type was written on
   * the left instead: `var xs []int = {1, 2}` is not legal Go, but
   * `var xs = []int{1, 2}` is, and this is where the second is recognised.
   */
  private parseGoValue(type: string | undefined): Expr {
    if (type && this.at("{")) return this.parseGoComposite(type, this.line);
    return this.parseExpr();
  }

  /**
   * Binds several names to the parts of one tuple, which is how a call with
   * several results is unpacked: `a, b := twoThings()`.
   */
  private spreadTuple(names: string[], value: Expr, line: number): Stmt[] {
    const temp = `__spread${this.temps++}`;
    const out: Stmt[] = [{ k: "let", name: temp, mutable: false, init: value, line }];
    names.forEach((name, i) => {
      out.push({
        k: "let",
        name,
        mutable: true,
        init: { k: "field", target: { k: "name", name: temp, line }, name: String(i), line },
        line,
      });
    });
    return out;
  }

  /**
   * One Go statement.
   *
   * Go has no semicolons in its source; they are inserted into the token
   * stream before parsing, so everything below can rely on a statement ending
   * at a `;` exactly as C's does.
   */
  private parseGoStmt(): Stmt {
    const tok = this.peek();
    const line = tok.line;

    if (tok.text === "{") return { k: "block", body: this.parseBlockBody(), line };
    if (tok.text === ";") { this.next(); return { k: "block", body: [], line }; }

    switch (tok.text) {
      case "var":
      case "const":
        return this.parseGoVar(tok.text, line);
      case "type":
        throw new UnsupportedError("a `type` declaration inside a function", line);
      case "return": {
        this.next();
        if (this.at(";") || this.at("}")) {
          this.accept(";");
          return { k: "return", line };
        }
        const values = [this.parseExpr()];
        while (this.accept(",")) values.push(this.parseExpr());
        this.accept(";");
        // Several results travel as a tuple, which is what the caller's
        // `a, b := f()` unpacks again.
        const value: Expr = values.length === 1 ? values[0] : { k: "tuple", items: values, line };
        return { k: "return", value, line };
      }
      case "if": return this.parseGoIf(line);
      case "for": return this.parseGoFor(line);
      case "switch": return this.parseGoSwitch(line);
      case "break": this.next(); this.accept(";"); return { k: "break", line };
      case "continue": this.next(); this.accept(";"); return { k: "continue", line };
      case "go":
      case "defer":
      case "select":
        throw new UnsupportedError(`\`${tok.text}\``, line);
      case "fallthrough":
        throw new UnsupportedError("`fallthrough`", line);
    }

    const stmt = this.parseGoSimple();
    this.accept(";");
    return stmt;
  }

  /**
   * A simple statement: an assignment, a short declaration, an increment, or a
   * bare expression. Go allows any of them in the header of an `if`, a `for`
   * or a `switch`, which is why this is separate from `parseGoStmt`.
   *
   * `noStruct` is set only by those three headers. There, a `{` opens the body
   * rather than a composite literal, so `if p == Point{1, 2}` has to be written
   * with parentheses — which is exactly the rule Go itself imposes. Everywhere
   * else `p := Point{1, 2}` is ordinary and must parse.
   */
  private parseGoSimple(noStruct = false): Stmt {
    const line = this.line;
    const first = this.parseExpr(noStruct);

    // `a, b := ...` / `a, b = ...` — several targets.
    //
    // Every element here is parsed *below* assignment precedence. `parseExpr`
    // treats `=` as an operator, so reading the second target of `a, b = b, a`
    // with it would swallow the `= b` and leave the statement looking like a
    // list with nothing assigned to it.
    if (this.at(",")) {
      const targets = [first];
      while (this.accept(",")) targets.push(this.parseTernary(noStruct));
      const op = this.peek().text;
      if (op !== ":=" && op !== "=") {
        throw new ProgramError("expected `=` or `:=` after a list of names", line);
      }
      this.next();
      const values = [this.parseTernary(noStruct)];
      while (this.accept(",")) values.push(this.parseTernary(noStruct));
      return this.parseGoMultiAssign(targets, values, op === ":=", line);
    }

    if (this.at(":=")) {
      this.next();
      if (first.k !== "name") throw new ProgramError("`:=` needs a name on the left", line);
      const init = this.parseExpr(noStruct);
      return { k: "let", name: first.name, mutable: true, init, line };
    }

    if (ASSIGN_OPS.has(this.peek().text)) {
      const op = this.next().text;
      const value = this.parseExpr(noStruct);
      return { k: "expr", expr: { k: "assign", op, target: first, value, line }, line };
    }

    // Go makes `x++` a statement rather than an expression, so it can only
    // appear here.
    if (this.at("++") || this.at("--")) {
      const op = this.next().text;
      return { k: "expr", expr: { k: "incdec", op, target: first, prefix: false, line }, line };
    }

    return { k: "expr", expr: first, line };
  }

  /**
   * `a, b = b, a` and its declaring cousin.
   *
   * Every right-hand side is evaluated before any left-hand side is written,
   * which is what makes the one-line swap work; doing it in place would leave
   * both names holding the same value.
   */
  private parseGoMultiAssign(
    targets: Expr[],
    values: Expr[],
    declare: boolean,
    line: number
  ): Stmt {
    const names = targets.map((t) => (t.k === "name" ? t.name : null));

    // `a, b := f()` and `v, ok := m[k]`: one value feeding several names.
    if (values.length === 1) {
      if (!declare) {
        const temp = `__spread${this.temps++}`;
        const body: Stmt[] = [{ k: "let", name: temp, mutable: false, init: values[0], line }];
        targets.forEach((target, i) => {
          body.push({
            k: "expr",
            expr: {
              k: "assign",
              op: "=",
              target,
              value: { k: "field", target: { k: "name", name: temp, line }, name: String(i), line },
              line,
            },
            line,
          });
        });
        return { k: "multi", body, line };
      }
      if (names.some((n) => n === null)) {
        throw new ProgramError("`:=` needs names on the left", line);
      }
      // The comma-ok form. A map read that also reports whether the key was
      // there cannot be an ordinary index, which yields the zero value and
      // says nothing — so it becomes a call the dialect answers.
      const source = values[0];
      const value: Expr =
        source.k === "index"
          ? {
              k: "call",
              callee: { k: "name", name: "__comma_ok", line },
              args: [source.target, source.index],
              line,
            }
          : source;
      return { k: "multi", body: this.spreadTuple(names as string[], value, line), line };
    }

    if (targets.length !== values.length) {
      throw new ProgramError(
        `assignment mismatch: ${targets.length} names but ${values.length} values`,
        line
      );
    }

    const body: Stmt[] = [];
    const temps = values.map((value, i) => {
      const temp = `__swap${this.temps++}_${i}`;
      body.push({ k: "let", name: temp, mutable: false, init: value, line });
      return temp;
    });
    targets.forEach((target, i) => {
      const read: Expr = { k: "name", name: temps[i], line };
      if (declare && names[i]) {
        body.push({ k: "let", name: names[i]!, mutable: true, init: read, line });
      } else {
        body.push({ k: "expr", expr: { k: "assign", op: "=", target, value: read, line }, line });
      }
    });
    return { k: "multi", body, line };
  }

  /** `if cond { }`, with Go's optional initialiser before the condition. */
  private parseGoIf(line: number): Stmt {
    this.expect("if");
    let init: Stmt | undefined;
    const save = this.pos;
    const simple = this.parseGoSimple(true);
    if (this.accept(";")) {
      init = simple;
    } else {
      this.pos = save;
    }
    const cond = this.parseExpr(true);
    const then = this.parseBody();
    let other: Stmt | undefined;
    if (this.accept("else")) other = this.at("if") ? this.parseGoStmt() : this.parseBody();
    const stmt: Stmt = { k: "if", cond, then, other, line };
    // The initialiser is scoped to the `if`, which `multi` gives it only
    // because the caller wraps the pair in a block.
    return init ? { k: "block", body: [init, stmt], line } : stmt;
  }

  /**
   * Go writes every loop with the one keyword: an infinite loop, a while, a
   * three-clause for, and a range are all `for`.
   */
  private parseGoFor(line: number): Stmt {
    this.expect("for");

    if (this.at("{")) return { k: "loop", body: this.parseBody(), line };

    // `for range xs { }` — the count-only form.
    if (this.at("range")) {
      this.next();
      const iterable = this.parseExpr(true);
      return { k: "forIn", name: "_", indexed: true, iterable, body: this.parseBody(), line };
    }

    const save = this.pos;
    // `for i, v := range xs` / `for i := range xs`.
    try {
      const names = [this.identifier()];
      while (this.accept(",")) names.push(this.identifier());
      if ((this.at(":=") || this.at("=")) && this.at("range", 1)) {
        this.next();
        this.next();
        const iterable = this.parseExpr(true);
        return {
          k: "forIn",
          name: names[0],
          name2: names[1],
          indexed: true,
          iterable,
          body: this.parseBody(),
          line,
        };
      }
    } catch {
      // Not a range clause; fall through.
    }
    this.pos = save;

    // `for cond { }` — Go's while.
    if (!this.at(";")) {
      const probe = this.pos;
      try {
        const cond = this.parseExpr(true);
        if (this.at("{")) {
          return { k: "while", cond, body: this.parseBody(), line };
        }
      } catch {
        // Not a bare condition; fall through to the three-clause form.
      }
      this.pos = probe;
    }

    const init = this.at(";") ? undefined : this.parseGoSimple(true);
    this.expect(";");
    const cond = this.at(";") ? undefined : this.parseExpr(true);
    this.expect(";");
    const step = this.at("{") ? undefined : this.parseGoSimple(true);
    const body = this.parseBody();
    return {
      k: "forC",
      init,
      cond,
      // A `for` step may be a multiple assignment — `l, r = l+1, r-1` walks a
      // pair of pointers inwards — which desugars to several statements rather
      // than one expression. A block expression carries them, and dropping it
      // instead would leave the loop running forever.
      step:
        step === undefined ? undefined
          : step.k === "expr" ? step.expr
            : { k: "block", body: [step], line },
      body,
      line,
    };
  }

  /**
   * `switch`, in both its forms: on a subject, and with bare boolean cases.
   *
   * Go breaks out of a case implicitly, so each one becomes the arm of an
   * if/else chain rather than anything needing a break signal.
   */
  private parseGoSwitch(line: number): Stmt {
    this.expect("switch");
    let subject: Expr | undefined;
    if (!this.at("{")) {
      const save = this.pos;
      const simple = this.parseGoSimple(true);
      if (this.accept(";")) {
        // An initialiser, then the subject.
        const inner = this.at("{") ? undefined : this.parseExpr(true);
        const body = this.parseGoSwitchBody(inner, line);
        return { k: "block", body: [simple, body], line };
      }
      this.pos = save;
      subject = this.parseExpr(true);
    }
    return this.parseGoSwitchBody(subject, line);
  }

  private parseGoSwitchBody(subject: Expr | undefined, line: number): Stmt {
    this.expect("{");
    const temp = `__switch${this.temps++}`;
    const arms: { cond: Expr | null; body: Stmt[] }[] = [];
    while (!this.at("}") && this.peek().kind !== "eof") {
      if (this.accept(";")) continue;
      if (this.accept("default")) {
        this.expect(":");
        arms.push({ cond: null, body: this.parseGoCaseBody() });
        continue;
      }
      this.expect("case");
      const options = [this.parseExpr(true)];
      while (this.accept(",")) options.push(this.parseExpr(true));
      this.expect(":");
      // With a subject, a case matches it; without one, the case *is* the test.
      let cond: Expr = subject
        ? { k: "binary", op: "==", left: { k: "name", name: temp, line }, right: options[0], line }
        : options[0];
      for (const option of options.slice(1)) {
        const next: Expr = subject
          ? { k: "binary", op: "==", left: { k: "name", name: temp, line }, right: option, line }
          : option;
        cond = { k: "binary", op: "||", left: cond, right: next, line };
      }
      arms.push({ cond, body: this.parseGoCaseBody() });
    }
    this.expect("}");

    let chain: Stmt | undefined;
    for (let i = arms.length - 1; i >= 0; i--) {
      const arm = arms[i];
      const body: Stmt = { k: "block", body: arm.body, line };
      chain = arm.cond === null ? body : { k: "if", cond: arm.cond, then: body, other: chain, line };
    }
    const body: Stmt[] = [];
    if (subject) body.push({ k: "let", name: temp, mutable: false, init: subject, line });
    if (chain) body.push(chain);
    return { k: "block", body, line };
  }

  private parseGoCaseBody(): Stmt[] {
    const body: Stmt[] = [];
    while (!this.at("case") && !this.at("default") && !this.at("}") && this.peek().kind !== "eof") {
      if (this.accept(";")) continue;
      body.push(this.parseGoStmt());
    }
    return body;
  }

  /** `type Name struct { ... }`, and the alias form. */
  private parseGoTypeDecl(
    structs: Map<string, StructDecl>,
    functions: Map<string, FnDecl>
  ): void {
    void functions;
    this.expect("type");
    const name = this.identifier();
    if (!this.at("struct")) {
      // `type Celsius float64` — an alias. Nothing downstream reads it, since
      // the runtime carries values rather than types.
      this.parseGoType();
      this.accept(";");
      return;
    }
    this.next();
    this.expect("{");
    const fields: string[] = [];
    while (!this.at("}") && this.peek().kind !== "eof") {
      if (this.accept(";")) continue;
      const names = [this.identifier()];
      while (this.accept(",")) names.push(this.identifier());
      this.parseGoType();
      fields.push(...names);
      this.accept(";");
    }
    this.expect("}");
    this.accept(";");
    const existing = structs.get(name);
    if (existing) existing.fields.push(...fields);
    else structs.set(name, { name, fields, methods: new Map() });
  }

}


/**
 * The element type inside a composite type, for filling in the type a nested
 * literal left out: `[][]int` yields `[]int`, `map[string][]int` yields
 * `[]int`.
 */
function goElementType(type: string): string {
  if (type.startsWith("[]")) return type.slice(2);
  const array = type.match(/^\[[^\]]*\](.*)$/);
  if (array && !type.startsWith("[]")) return array[1];
  if (type.startsWith("map[")) {
    // Walk past the bracketed key, which may itself contain brackets.
    let depth = 0;
    for (let i = 3; i < type.length; i++) {
      if (type[i] === "[") depth++;
      else if (type[i] === "]") {
        depth--;
        if (depth === 0) return type.slice(i + 1);
      }
    }
  }
  return type;
}

/**
 * Go's automatic semicolons.
 *
 * The language has no statement terminator in its source; the specification
 * defines one being inserted at the end of any line whose last token could end
 * a statement. Doing that here rather than in the parser is what lets every
 * Go statement rule below read like C's, and it is also the rule that makes
 * `return\nx` two statements rather than one — the reason Go insists on
 * `return x` sharing a line.
 */
function goSemicolons(tokens: Token[]): Token[] {
  const ENDERS = new Set(["break", "continue", "fallthrough", "return"]);
  const CLOSERS = new Set([")", "]", "}", "++", "--"]);
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    out.push(tok);
    const next = tokens[i + 1];
    if (!next || next.kind === "eof") continue;
    if (next.line === tok.line) continue;
    const ends =
      tok.kind === "num" ||
      tok.kind === "str" ||
      tok.kind === "char" ||
      (tok.kind === "ident" && (ENDERS.has(tok.text) || !GO_KEYWORDS.has(tok.text))) ||
      CLOSERS.has(tok.text);
    if (ends) out.push({ kind: "punct", text: ";", line: tok.line });
  }
  return out;
}

/**
 * The words that cannot end a line, so that no semicolon is inserted after
 * them. Everything else spelled as an identifier is a name or a literal, and a
 * line ending in one of those does end a statement.
 */
const GO_KEYWORDS = new Set([
  "break", "case", "chan", "const", "continue", "default", "defer", "else",
  "fallthrough", "for", "func", "go", "goto", "if", "import", "interface",
  "map", "package", "range", "return", "select", "struct", "switch", "type", "var",
]);

function isNamespace(segments: string[], dialect: DialectName): boolean {
  // `System.out.println` is a path; `list.size()` is a method call. Only names
  // that start with a capital and are known namespaces are treated as paths.
  const head = segments[0];
  // Go's are lower-case package names, which would otherwise be
  // indistinguishable from a variable — so they are only consulted for Go,
  // where a local called `sort` or `math` would shadow the package anyway.
  if (dialect === "go") {
    return [
      "fmt", "strings", "strconv", "sort", "math", "os", "errors", "unicode",
      "bytes", "utf8",
    ].includes(head);
  }
  return [
    "System", "Math", "Integer", "Long", "Double", "Float", "Boolean", "Character",
    "String", "Arrays", "Collections", "List", "Map", "Set", "Objects", "java",
    "Comparator", "Byte", "Short", "StringBuilder", "Optional", "Thread",
  ].includes(head);
}

/**
 * Container types whose default constructor builds something a literal cannot
 * express — a map, a set, a heap, an adapter over one of those. `zeroFor` hands
 * these to the dialect as a `__default` call carrying the written type, because
 * only the dialect knows what `unordered_map<char,int>` should read as when the
 * program touches a key that is not there.
 */
const DEFAULT_CONSTRUCTED =
  /^(std::)?(unordered_map|unordered_set|unordered_multiset|unordered_multimap|map|multimap|set|multiset|stack|queue|deque|priority_queue|pair|HashMap|TreeMap|LinkedHashMap|HashSet|TreeSet|LinkedHashSet|PriorityQueue|ArrayDeque|Stack|BTreeMap|BTreeSet|VecDeque|BinaryHeap)\b/;

function zeroFor(type: string, line: number): Expr {
  if (/\[\]$/.test(type)) return { k: "list", items: [], line };
  if (/^(double|float|f32|f64)$/.test(type)) return { k: "float", v: 0, line };
  if (/^(bool|boolean)$/.test(type)) return { k: "bool", v: false, line };
  if (/^(String|string|std::string)$/.test(type)) return { k: "str", v: "", line };
  if (/^char$/.test(type)) return { k: "char", v: "\0", line };
  if (DEFAULT_CONSTRUCTED.test(type)) {
    return {
      k: "call",
      callee: { k: "name", name: "__default", line },
      args: [{ k: "str", v: type, line }],
      line,
    };
  }
  if (/vector|ArrayList|List|Vec/.test(type)) return { k: "list", items: [], line };
  return { k: "int", v: 0n, width: /long|64/.test(type) ? 64 : 32, signed: true, line };
}

export function parse(source: string, dialect: DialectName): Program {
  return new Parser(source, dialect).parseProgram();
}
