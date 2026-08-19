/**
 * An x86-64 assembler and emulator for the NASM subset the Assembly track
 * teaches, running entirely in the browser.
 *
 * What is faithful: the 64/32/16/8-bit register file including the rule that a
 * 32-bit write zeroes the upper half, two's complement arithmetic at every
 * width, the ZF/SF/CF/OF/PF flags and the conditional jumps that read them, the
 * full base+index*scale+disp addressing formula, a real downward-growing stack,
 * and the Linux write/read/exit syscall convention.
 *
 * What is not: this executes decoded instructions rather than encoded bytes, so
 * there is no instruction-length or opcode-byte modelling. Everything the track
 * teaches about semantics holds; nothing about encoding does.
 */
import { OutputSink, ProgramError, UnsupportedError, type RuntimeResult } from "./types";

const MASK64 = (1n << 64n) - 1n;
const BASE_ADDR = 0x400000n;
const MEM_SIZE = 1 << 20; // 1 MiB of address space, plenty for teaching programs
const STACK_TOP = BASE_ADDR + BigInt(MEM_SIZE) - 16n;

const REG64 = [
  "rax", "rcx", "rdx", "rbx", "rsp", "rbp", "rsi", "rdi",
  "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15",
];
const REG32 = [
  "eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi",
  "r8d", "r9d", "r10d", "r11d", "r12d", "r13d", "r14d", "r15d",
];
const REG16 = [
  "ax", "cx", "dx", "bx", "sp", "bp", "si", "di",
  "r8w", "r9w", "r10w", "r11w", "r12w", "r13w", "r14w", "r15w",
];
const REG8 = [
  "al", "cl", "dl", "bl", "spl", "bpl", "sil", "dil",
  "r8b", "r9b", "r10b", "r11b", "r12b", "r13b", "r14b", "r15b",
];
/** The legacy high-byte registers: ah is bits 8..15 of rax. */
const REG8_HIGH: Record<string, number> = { ah: 0, ch: 1, dh: 2, bh: 3 };

interface RegRef {
  index: number;
  size: 1 | 2 | 4 | 8;
  high?: boolean;
}

function lookupRegister(name: string): RegRef | null {
  const n = name.toLowerCase();
  let i = REG64.indexOf(n);
  if (i !== -1) return { index: i, size: 8 };
  i = REG32.indexOf(n);
  if (i !== -1) return { index: i, size: 4 };
  i = REG16.indexOf(n);
  if (i !== -1) return { index: i, size: 2 };
  i = REG8.indexOf(n);
  if (i !== -1) return { index: i, size: 1 };
  if (n in REG8_HIGH) return { index: REG8_HIGH[n], size: 1, high: true };
  return null;
}

type Operand =
  | { kind: "reg"; reg: RegRef }
  | { kind: "imm"; value: bigint }
  | { kind: "label"; name: string }
  | { kind: "mem"; base?: RegRef; index?: RegRef; scale: number; disp: bigint; dispLabel?: string; size?: 1 | 2 | 4 | 8 };

interface Instruction {
  op: string;
  operands: Operand[];
  line: number;
}

const SIZE_KEYWORDS: Record<string, 1 | 2 | 4 | 8> = {
  byte: 1,
  word: 2,
  dword: 4,
  qword: 8,
};

// ---------------------------------------------------------------- assembling

interface Assembled {
  instructions: Instruction[];
  /** Label -> instruction index, for code labels. */
  codeLabels: Map<string, number>;
  /** Label -> absolute address, for data labels and equ constants. */
  symbols: Map<string, bigint>;
  memory: Uint8Array;
  entry: number;
}

/** Splits a line into label, mnemonic and operand text, honouring quotes. */
function stripComment(line: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\" && i + 1 < line.length) {
        out += ch + line[i + 1];
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      out += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === ";") break;
    out += ch;
  }
  return out;
}

/** Splits operands on commas that are not inside quotes or brackets. */
function splitOperands(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\" && i + 1 < text.length) {
        current += ch + text[i + 1];
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseEscapes(raw: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "\\" && i + 1 < raw.length) {
      const next = raw[++i];
      const map: Record<string, number> = {
        n: 10, t: 9, r: 13, "0": 0, "\\": 92, '"': 34, "'": 39,
      };
      bytes.push(next in map ? map[next] : next.charCodeAt(0));
      continue;
    }
    // Encode as UTF-8, so a non-ASCII character in a string still round-trips.
    for (const b of new TextEncoder().encode(ch)) bytes.push(b);
  }
  return bytes;
}

function parseNumber(token: string): bigint | null {
  const t = token.trim().toLowerCase().replace(/_/g, "");
  if (/^0x[0-9a-f]+$/.test(t)) return BigInt(t);
  if (/^[0-9a-f]+h$/.test(t)) return BigInt("0x" + t.slice(0, -1));
  if (/^0b[01]+$/.test(t)) return BigInt(t);
  if (/^[01]+b$/.test(t)) return BigInt("0b" + t.slice(0, -1));
  if (/^0o[0-7]+$/.test(t)) return BigInt(t);
  if (/^-?\d+$/.test(t)) return BigInt(t);
  return null;
}

/**
 * Evaluates the constant arithmetic NASM allows in an operand — `msg + 4`,
 * `$ - msg`, `2 * 8`. Symbols are resolved through `symbols`; `here` supplies
 * the value of `$`.
 */
function evalConstExpr(
  text: string,
  symbols: Map<string, bigint>,
  here: bigint,
  line: number
): bigint {
  const matched = text.match(/\$|[A-Za-z_.][\w.$]*|0[xX][0-9a-fA-F]+|\d+[hH]?|[-+*/()]/g);
  if (!matched) throw new ProgramError(`cannot parse expression "${text}"`, line);
  const tokens = matched;

  let pos = 0;
  const peek = () => tokens[pos];

  function primary(): bigint {
    const tok = tokens[pos++];
    if (tok === "(") {
      const v = additive();
      if (tokens[pos++] !== ")") throw new ProgramError("missing )", line);
      return v;
    }
    if (tok === "-") return -primary();
    if (tok === "+") return primary();
    if (tok === "$") return here;
    const num = parseNumber(tok);
    if (num !== null) return num;
    const sym = symbols.get(tok);
    if (sym === undefined) throw new ProgramError(`unknown symbol "${tok}"`, line);
    return sym;
  }

  function multiplicative(): bigint {
    let left = primary();
    while (peek() === "*" || peek() === "/") {
      const op = tokens[pos++];
      const right = primary();
      if (op === "/" && right === 0n) throw new ProgramError("divide by zero in expression", line);
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function additive(): bigint {
    let left = multiplicative();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++];
      const right = multiplicative();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const value = additive();
  if (pos !== tokens.length) throw new ProgramError(`cannot parse expression "${text}"`, line);
  return value;
}

function parseOperand(text: string, line: number): Operand {
  let t = text.trim();
  let size: 1 | 2 | 4 | 8 | undefined;

  const sizeMatch = t.match(/^(byte|word|dword|qword)\s+/i);
  if (sizeMatch) {
    size = SIZE_KEYWORDS[sizeMatch[1].toLowerCase()];
    t = t.slice(sizeMatch[0].length).trim();
  }
  if (/^ptr\s+/i.test(t)) t = t.replace(/^ptr\s+/i, "").trim();

  if (t.startsWith("[") && t.endsWith("]")) {
    const inner = t.slice(1, -1).trim();
    const mem: Operand = { kind: "mem", scale: 1, disp: 0n, size };
    // Split on + / - at the top level and classify each term.
    const terms = inner.match(/[+-]?[^+-]+/g) ?? [];
    for (const rawTerm of terms) {
      const negative = rawTerm.trim().startsWith("-");
      const term = rawTerm.replace(/^[+-]/, "").trim();
      if (!term) continue;

      const scaled = term.match(/^([A-Za-z][\w]*)\s*\*\s*(\d+)$/) ?? term.match(/^(\d+)\s*\*\s*([A-Za-z][\w]*)$/);
      if (scaled) {
        const regName = /^\d+$/.test(scaled[1]) ? scaled[2] : scaled[1];
        const scaleText = /^\d+$/.test(scaled[1]) ? scaled[1] : scaled[2];
        const reg = lookupRegister(regName);
        if (!reg) throw new ProgramError(`"${regName}" is not a register`, line);
        mem.index = reg;
        mem.scale = Number(scaleText);
        if (![1, 2, 4, 8].includes(mem.scale)) {
          throw new ProgramError(`scale must be 1, 2, 4 or 8, got ${mem.scale}`, line);
        }
        continue;
      }

      const reg = lookupRegister(term);
      if (reg) {
        if (!mem.base) mem.base = reg;
        else if (!mem.index) mem.index = reg;
        else throw new ProgramError("too many registers in an address", line);
        continue;
      }

      const num = parseNumber(term);
      if (num !== null) {
        mem.disp += negative ? -num : num;
        continue;
      }
      if (mem.dispLabel) throw new ProgramError("too many symbols in an address", line);
      mem.dispLabel = term;
      if (negative) throw new ProgramError("cannot negate a symbol in an address", line);
    }
    return mem;
  }

  const reg = lookupRegister(t);
  if (reg) return { kind: "reg", reg };

  const num = parseNumber(t);
  if (num !== null) return { kind: "imm", value: num };

  if (/^'.'$/.test(t)) return { kind: "imm", value: BigInt(t.charCodeAt(1)) };

  return { kind: "label", name: t };
}

export function assemble(source: string): Assembled {
  const memory = new Uint8Array(MEM_SIZE);
  const symbols = new Map<string, bigint>();
  const codeLabels = new Map<string, number>();
  const instructions: Instruction[] = [];

  interface PendingData {
    line: number;
    directive: string;
    operands: string[];
    address: bigint;
  }
  const pendingData: PendingData[] = [];

  let section: "text" | "data" | "bss" = "text";
  let dataCursor = BASE_ADDR + 0x2000n; // .data starts a page or two above the base
  let bssCursor = BASE_ADDR + 0x10000n;
  let globalName: string | null = null;

  const rawLines = source.split("\n");

  // ---- pass 1: place labels, size data, collect instructions
  for (let i = 0; i < rawLines.length; i++) {
    const line = i + 1;
    let text = stripComment(rawLines[i]).trim();
    if (!text) continue;

    // A leading label may be followed by more content on the same line.
    const labelMatch = text.match(/^([A-Za-z_.][\w.$]*)\s*:\s*/);
    let label: string | null = null;
    if (labelMatch) {
      label = labelMatch[1];
      text = text.slice(labelMatch[0].length).trim();
    } else {
      // NASM also allows a label with no colon when it starts the line and is
      // followed by a data directive.
      const bare = text.match(/^([A-Za-z_.][\w.$]*)\s+(db|dw|dd|dq|resb|resw|resd|resq|equ)\b/i);
      if (bare) {
        label = bare[1];
        text = text.slice(bare[1].length).trim();
      }
    }

    const words = text.split(/\s+/);
    const head = (words[0] ?? "").toLowerCase();

    if (head === "section" || head === "segment") {
      const name = (words[1] ?? "").replace(/^\./, "").toLowerCase();
      if (name === "text" || name === "data" || name === "bss" || name === "rodata") {
        section = name === "rodata" ? "data" : (name as "text" | "data" | "bss");
      } else {
        throw new UnsupportedError(`section "${words[1]}"`, line);
      }
      continue;
    }

    if (head === "global" || head === "extern" || head === "bits" || head === "default") {
      if (head === "global") globalName = words[1] ?? null;
      if (head === "extern") {
        throw new UnsupportedError(
          `extern "${words[1] ?? ""}" — the browser runtime has no libc to link against`,
          line
        );
      }
      continue;
    }

    if (head === "equ") {
      if (!label) throw new ProgramError("equ needs a label", line);
      const here = section === "data" ? dataCursor : section === "bss" ? bssCursor : 0n;
      symbols.set(label, evalConstExpr(text.slice(3).trim(), symbols, here, line));
      continue;
    }

    if (["db", "dw", "dd", "dq"].includes(head)) {
      if (section === "text") throw new ProgramError(`${head} outside a data section`, line);
      const operands = splitOperands(text.slice(head.length).trim());
      const width = { db: 1, dw: 2, dd: 4, dq: 8 }[head] as number;
      if (label) symbols.set(label, dataCursor);
      // Size it now; the values are written in pass 2 once symbols are known.
      let bytes = 0;
      for (const operand of operands) {
        const str = operand.match(/^"(.*)"$/s) ?? operand.match(/^'(.*)'$/s);
        bytes += str && width === 1 ? parseEscapes(str[1]).length : width;
      }
      pendingData.push({ line, directive: head, operands, address: dataCursor });
      dataCursor += BigInt(bytes);
      continue;
    }

    if (["resb", "resw", "resd", "resq"].includes(head)) {
      const width = { resb: 1, resw: 2, resd: 4, resq: 8 }[head] as number;
      const count = evalConstExpr(text.slice(head.length).trim(), symbols, bssCursor, line);
      if (label) symbols.set(label, bssCursor);
      bssCursor += BigInt(width) * count;
      continue;
    }

    if (head === "times") {
      throw new UnsupportedError("the times directive", line);
    }

    // Anything left in .text is an instruction; a bare label just records a spot.
    if (label && section === "text") codeLabels.set(label, instructions.length);
    if (label && section !== "text" && !text) continue;
    if (!text) continue;

    if (section !== "text") throw new ProgramError(`instruction in a data section`, line);

    const op = head;
    const operandText = text.slice(words[0].length).trim();
    const operands = splitOperands(operandText).map((o) => parseOperand(o, line));
    instructions.push({ op, operands, line });
  }

  // ---- pass 2: write data now that every symbol is known
  for (const item of pendingData) {
    let cursor = item.address;
    const width = { db: 1, dw: 2, dd: 4, dq: 8 }[item.directive] as number;
    for (const operand of item.operands) {
      const str = operand.match(/^"(.*)"$/s) ?? operand.match(/^'(.*)'$/s);
      if (str && width === 1) {
        for (const b of parseEscapes(str[1])) {
          memory[Number(cursor - BASE_ADDR)] = b;
          cursor += 1n;
        }
        continue;
      }
      const value = evalConstExpr(operand, symbols, cursor, item.line);
      let v = value & ((1n << BigInt(width * 8)) - 1n);
      for (let b = 0; b < width; b++) {
        memory[Number(cursor - BASE_ADDR)] = Number(v & 0xffn);
        v >>= 8n;
        cursor += 1n;
      }
    }
  }

  const entryName = globalName ?? "_start";
  const entry = codeLabels.get(entryName);
  if (entry === undefined) {
    throw new ProgramError(
      `no entry point: expected a label called "${entryName}". Add "global _start" and a "_start:" label.`
    );
  }

  return { instructions, codeLabels, symbols, memory, entry };
}

// ----------------------------------------------------------------- executing

class Cpu {
  regs = new BigUint64Array(16);
  zf = false;
  sf = false;
  cf = false;
  of = false;
  pf = false;

  constructor(
    private readonly mem: Uint8Array,
    private readonly out: OutputSink
  ) {
    this.regs[4] = STACK_TOP; // rsp
  }

  private offset(addr: bigint, size: number, line: number): number {
    const off = Number(addr - BASE_ADDR);
    if (off < 0 || off + size > MEM_SIZE) {
      throw new ProgramError(
        `segmentation fault: address 0x${addr.toString(16)} is outside the program's memory`,
        line
      );
    }
    return off;
  }

  readMem(addr: bigint, size: number, line: number): bigint {
    const off = this.offset(addr, size, line);
    let v = 0n;
    for (let i = size - 1; i >= 0; i--) v = (v << 8n) | BigInt(this.mem[off + i]);
    return v;
  }

  writeMem(addr: bigint, size: number, value: bigint, line: number) {
    const off = this.offset(addr, size, line);
    let v = value & ((1n << BigInt(size * 8)) - 1n);
    for (let i = 0; i < size; i++) {
      this.mem[off + i] = Number(v & 0xffn);
      v >>= 8n;
    }
  }

  readReg(ref: RegRef): bigint {
    const full = this.regs[ref.index];
    if (ref.high) return (full >> 8n) & 0xffn;
    switch (ref.size) {
      case 8: return full;
      case 4: return full & 0xffffffffn;
      case 2: return full & 0xffffn;
      case 1: return full & 0xffn;
    }
  }

  writeReg(ref: RegRef, value: bigint) {
    const current = this.regs[ref.index];
    if (ref.high) {
      this.regs[ref.index] = (current & ~0xff00n & MASK64) | ((value & 0xffn) << 8n);
      return;
    }
    switch (ref.size) {
      case 8:
        this.regs[ref.index] = value & MASK64;
        break;
      case 4:
        // The rule from module 4: writing a 32-bit register zeroes the top half.
        this.regs[ref.index] = value & 0xffffffffn;
        break;
      case 2:
        this.regs[ref.index] = (current & ~0xffffn & MASK64) | (value & 0xffffn);
        break;
      case 1:
        this.regs[ref.index] = (current & ~0xffn & MASK64) | (value & 0xffn);
        break;
    }
  }

  push(value: bigint, line: number) {
    this.regs[4] = (this.regs[4] - 8n) & MASK64;
    this.writeMem(this.regs[4], 8, value, line);
  }

  pop(line: number): bigint {
    const value = this.readMem(this.regs[4], 8, line);
    this.regs[4] = (this.regs[4] + 8n) & MASK64;
    return value;
  }

  setFlagsLogical(result: bigint, size: number) {
    const bits = BigInt(size * 8);
    const masked = result & ((1n << bits) - 1n);
    this.zf = masked === 0n;
    this.sf = (masked >> (bits - 1n)) === 1n;
    this.cf = false;
    this.of = false;
    this.pf = parity(masked);
  }

  setFlagsArith(result: bigint, size: number, carry: boolean, overflow: boolean) {
    const bits = BigInt(size * 8);
    const masked = result & ((1n << bits) - 1n);
    this.zf = masked === 0n;
    this.sf = (masked >> (bits - 1n)) === 1n;
    this.cf = carry;
    this.of = overflow;
    this.pf = parity(masked);
  }

  writeString(fd: number, addr: bigint, count: number, line: number): number {
    const off = this.offset(addr, count, line);
    const bytes = this.mem.subarray(off, off + count);
    const text = new TextDecoder().decode(bytes);
    if (fd === 1) {
      this.out.write(text);
    } else if (fd === 2) {
      this.out.note("error", text.replace(/\n$/, ""));
    } else {
      return -9; // -EBADF
    }
    return count;
  }
}

function parity(value: bigint): boolean {
  let low = Number(value & 0xffn);
  let bits = 0;
  while (low) {
    bits += low & 1;
    low >>= 1;
  }
  return bits % 2 === 0;
}

function signed(value: bigint, size: number): bigint {
  const bits = BigInt(size * 8);
  const masked = value & ((1n << bits) - 1n);
  return masked >> (bits - 1n) ? masked - (1n << bits) : masked;
}

const CONDITIONS: Record<string, (c: Cpu) => boolean> = {
  e: (c) => c.zf,
  z: (c) => c.zf,
  ne: (c) => !c.zf,
  nz: (c) => !c.zf,
  l: (c) => c.sf !== c.of,
  nge: (c) => c.sf !== c.of,
  ge: (c) => c.sf === c.of,
  nl: (c) => c.sf === c.of,
  le: (c) => c.zf || c.sf !== c.of,
  ng: (c) => c.zf || c.sf !== c.of,
  g: (c) => !c.zf && c.sf === c.of,
  nle: (c) => !c.zf && c.sf === c.of,
  b: (c) => c.cf,
  c: (c) => c.cf,
  nae: (c) => c.cf,
  ae: (c) => !c.cf,
  nb: (c) => !c.cf,
  nc: (c) => !c.cf,
  be: (c) => c.cf || c.zf,
  na: (c) => c.cf || c.zf,
  a: (c) => !c.cf && !c.zf,
  nbe: (c) => !c.cf && !c.zf,
  s: (c) => c.sf,
  ns: (c) => !c.sf,
  o: (c) => c.of,
  no: (c) => !c.of,
  p: (c) => c.pf,
  np: (c) => !c.pf,
};

export function runAssembly(source: string): RuntimeResult {
  const out = new OutputSink();
  let exitCode: number | null = null;

  try {
    const program = assemble(source);
    const cpu = new Cpu(program.memory, out);
    let rip = program.entry;

    const resolveAddress = (operand: Operand, line: number): bigint => {
      if (operand.kind !== "mem") throw new ProgramError("expected a memory operand", line);
      let addr = operand.disp;
      if (operand.dispLabel) {
        const sym = program.symbols.get(operand.dispLabel);
        if (sym === undefined) throw new ProgramError(`unknown symbol "${operand.dispLabel}"`, line);
        addr += sym;
      }
      if (operand.base) addr += cpu.readReg(operand.base);
      if (operand.index) addr += cpu.readReg(operand.index) * BigInt(operand.scale);
      return addr & MASK64;
    };

    /** Operand width, inferred from whichever operand names a register. */
    const widthOf = (operands: Operand[], line: number): 1 | 2 | 4 | 8 => {
      for (const o of operands) {
        if (o.kind === "reg") return o.reg.size;
        if (o.kind === "mem" && o.size) return o.size;
      }
      throw new ProgramError(
        "operand size is ambiguous — add a size keyword such as `qword`",
        line
      );
    };

    const read = (operand: Operand, size: number, line: number): bigint => {
      switch (operand.kind) {
        case "reg":
          return cpu.readReg(operand.reg);
        case "imm":
          return operand.value & MASK64;
        case "mem":
          return cpu.readMem(resolveAddress(operand, line), size, line);
        case "label": {
          const sym = program.symbols.get(operand.name);
          if (sym !== undefined) return sym;
          const code = program.codeLabels.get(operand.name);
          if (code !== undefined) return BigInt(code);
          throw new ProgramError(`unknown symbol "${operand.name}"`, line);
        }
      }
    };

    const write = (operand: Operand, size: number, value: bigint, line: number) => {
      if (operand.kind === "reg") cpu.writeReg(operand.reg, value);
      else if (operand.kind === "mem") cpu.writeMem(resolveAddress(operand, line), size, value, line);
      else throw new ProgramError("cannot write to that operand", line);
    };

    const jumpTarget = (operand: Operand, line: number): number => {
      if (operand.kind !== "label") throw new UnsupportedError("indirect jumps and calls", line);
      const target = program.codeLabels.get(operand.name);
      if (target === undefined) throw new ProgramError(`unknown label "${operand.name}"`, line);
      return target;
    };

    running: while (true) {
      out.step();
      if (rip < 0 || rip >= program.instructions.length) {
        throw new ProgramError(
          "execution ran off the end of the program — did you forget the exit syscall?"
        );
      }
      const inst = program.instructions[rip];
      const { op, operands, line } = inst;
      let next = rip + 1;

      switch (op) {
        case "mov": {
          const size = widthOf(operands, line);
          write(operands[0], size, read(operands[1], size, line), line);
          break;
        }
        case "movzx": {
          const dstSize = widthOf([operands[0]], line);
          const srcSize = operands[1].kind === "reg" ? operands[1].reg.size : operands[1].kind === "mem" && operands[1].size ? operands[1].size : 1;
          write(operands[0], dstSize, read(operands[1], srcSize, line), line);
          break;
        }
        case "movsx":
        case "movsxd": {
          const dstSize = widthOf([operands[0]], line);
          const srcSize = operands[1].kind === "reg" ? operands[1].reg.size : operands[1].kind === "mem" && operands[1].size ? operands[1].size : 4;
          write(operands[0], dstSize, signed(read(operands[1], srcSize, line), srcSize) & MASK64, line);
          break;
        }
        case "lea": {
          if (operands[1].kind !== "mem") throw new ProgramError("lea needs a memory operand", line);
          write(operands[0], 8, resolveAddress(operands[1], line), line);
          break;
        }
        case "xchg": {
          const size = widthOf(operands, line);
          const a = read(operands[0], size, line);
          const b = read(operands[1], size, line);
          write(operands[0], size, b, line);
          write(operands[1], size, a, line);
          break;
        }
        case "push":
          cpu.push(read(operands[0], 8, line), line);
          break;
        case "pop":
          write(operands[0], 8, cpu.pop(line), line);
          break;
        case "add":
        case "sub":
        case "cmp": {
          const size = widthOf(operands, line);
          const a = read(operands[0], size, line);
          const b = read(operands[1], size, line);
          const bits = BigInt(size * 8);
          const mask = (1n << bits) - 1n;
          const result = op === "add" ? (a + b) & mask : (a - b) & mask;
          const carry = op === "add" ? a + b > mask : b > a;
          const sa = signed(a, size);
          const sb = signed(b, size);
          const sr = signed(result, size);
          const overflow = op === "add" ? (sa > 0n) === (sb > 0n) && (sr > 0n) !== (sa > 0n) : (sa >= 0n) !== (sb >= 0n) && (sr >= 0n) !== (sa >= 0n);
          cpu.setFlagsArith(result, size, carry, overflow);
          if (op !== "cmp") write(operands[0], size, result, line);
          break;
        }
        case "inc":
        case "dec": {
          const size = widthOf(operands, line);
          const a = read(operands[0], size, line);
          const mask = (1n << BigInt(size * 8)) - 1n;
          const result = (op === "inc" ? a + 1n : a - 1n) & mask;
          const carry = cpu.cf; // inc/dec leave CF alone
          cpu.setFlagsArith(result, size, carry, signed(a, size) === (op === "inc" ? (1n << (BigInt(size * 8) - 1n)) - 1n : -(1n << (BigInt(size * 8) - 1n))));
          write(operands[0], size, result, line);
          break;
        }
        case "neg": {
          const size = widthOf(operands, line);
          const a = read(operands[0], size, line);
          const mask = (1n << BigInt(size * 8)) - 1n;
          const result = (-a) & mask;
          cpu.setFlagsArith(result, size, a !== 0n, false);
          write(operands[0], size, result, line);
          break;
        }
        case "and":
        case "or":
        case "xor":
        case "test": {
          const size = widthOf(operands, line);
          const a = read(operands[0], size, line);
          const b = read(operands[1], size, line);
          const result = op === "and" || op === "test" ? a & b : op === "or" ? a | b : a ^ b;
          cpu.setFlagsLogical(result, size);
          if (op !== "test") write(operands[0], size, result, line);
          break;
        }
        case "not": {
          const size = widthOf(operands, line);
          write(operands[0], size, ~read(operands[0], size, line), line);
          break;
        }
        case "shl":
        case "sal":
        case "shr":
        case "sar": {
          const size = widthOf(operands, line);
          const a = read(operands[0], size, line);
          const countOperand = operands[1] ?? { kind: "imm" as const, value: 1n };
          const count = read(countOperand, 1, line) & 0x3fn;
          let result: bigint;
          if (op === "shl" || op === "sal") result = a << count;
          else if (op === "shr") result = a >> count;
          else result = signed(a, size) >> count;
          cpu.setFlagsLogical(result, size);
          write(operands[0], size, result, line);
          break;
        }
        case "imul": {
          const size = widthOf(operands, line);
          if (operands.length === 1) {
            const a = signed(cpu.readReg({ index: 0, size }), size);
            const b = signed(read(operands[0], size, line), size);
            const product = a * b;
            cpu.writeReg({ index: 0, size }, product & MASK64);
            cpu.setFlagsArith(product, size, false, false);
          } else {
            const a = signed(read(operands[operands.length === 3 ? 1 : 0], size, line), size);
            const b = signed(read(operands[operands.length === 3 ? 2 : 1], size, line), size);
            const product = a * b;
            write(operands[0], size, product & MASK64, line);
            cpu.setFlagsArith(product, size, false, false);
          }
          break;
        }
        case "mul": {
          const size = widthOf(operands, line);
          const a = cpu.readReg({ index: 0, size });
          const b = read(operands[0], size, line);
          const product = a * b;
          const bits = BigInt(size * 8);
          cpu.writeReg({ index: 0, size }, product & ((1n << bits) - 1n));
          cpu.writeReg({ index: 2, size }, product >> bits);
          cpu.setFlagsArith(product, size, product >> bits !== 0n, product >> bits !== 0n);
          break;
        }
        case "div":
        case "idiv": {
          const size = widthOf(operands, line);
          const bits = BigInt(size * 8);
          const low = cpu.readReg({ index: 0, size });
          const high = cpu.readReg({ index: 2, size });
          const divisor = read(operands[0], size, line);
          if (divisor === 0n) throw new ProgramError("integer divide by zero", line);
          if (op === "div") {
            const dividend = (high << bits) | low;
            cpu.writeReg({ index: 0, size }, dividend / divisor);
            cpu.writeReg({ index: 2, size }, dividend % divisor);
          } else {
            const dividend = signed((high << bits) | low, size * 2);
            const d = signed(divisor, size);
            // Truncate towards zero, matching the hardware.
            const q = dividend / d;
            cpu.writeReg({ index: 0, size }, q & MASK64);
            cpu.writeReg({ index: 2, size }, (dividend - q * d) & MASK64);
          }
          break;
        }
        case "cqo":
          cpu.regs[2] = signed(cpu.regs[0], 8) < 0n ? MASK64 : 0n;
          break;
        case "cdq":
          cpu.writeReg({ index: 2, size: 4 }, signed(cpu.readReg({ index: 0, size: 4 }), 4) < 0n ? 0xffffffffn : 0n);
          break;
        case "jmp":
          next = jumpTarget(operands[0], line);
          break;
        case "call":
          cpu.push(BigInt(rip + 1), line);
          next = jumpTarget(operands[0], line);
          break;
        case "ret":
          next = Number(cpu.pop(line));
          break;
        case "leave":
          cpu.regs[4] = cpu.regs[5];
          cpu.regs[5] = cpu.pop(line);
          break;
        case "nop":
          break;
        case "syscall": {
          const number = Number(cpu.regs[0]);
          if (number === 1) {
            const fd = Number(cpu.regs[7]);
            const buf = cpu.regs[6];
            const count = Number(cpu.regs[2]);
            cpu.regs[0] = BigInt(cpu.writeString(fd, buf, count, line)) & MASK64;
          } else if (number === 0) {
            // No stdin in a playground: read() reports end of file.
            cpu.regs[0] = 0n;
          } else if (number === 60 || number === 231) {
            exitCode = Number(cpu.regs[7] & 0xffn);
            break running;
          } else {
            throw new UnsupportedError(
              `syscall ${number} — this runtime implements write (1), read (0) and exit (60)`,
              line
            );
          }
          break;
        }
        default: {
          const cc = op.match(/^j(\w+)$/);
          if (cc && CONDITIONS[cc[1]]) {
            if (CONDITIONS[cc[1]](cpu)) next = jumpTarget(operands[0], line);
            break;
          }
          const setcc = op.match(/^set(\w+)$/);
          if (setcc && CONDITIONS[setcc[1]]) {
            write(operands[0], 1, CONDITIONS[setcc[1]](cpu) ? 1n : 0n, line);
            break;
          }
          const cmov = op.match(/^cmov(\w+)$/);
          if (cmov && CONDITIONS[cmov[1]]) {
            const size = widthOf(operands, line);
            if (CONDITIONS[cmov[1]](cpu)) write(operands[0], size, read(operands[1], size, line), line);
            break;
          }
          throw new UnsupportedError(`instruction "${op}"`, line);
        }
      }

      rip = next;
    }

    out.flush();
    if (exitCode !== 0) out.note("info", `Process exited with status ${exitCode}.`);
  } catch (error) {
    out.flush();
    const message = error instanceof Error ? error.message : String(error);
    out.note("error", message);
    if (exitCode === null) exitCode = 1;
  }

  return { lines: out.lines, exitCode };
}
