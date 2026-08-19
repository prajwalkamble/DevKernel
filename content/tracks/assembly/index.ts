import type { TrackDefinition } from "@/content/types";
import { createComingSoonModule } from "@/content/comingSoon";
import { asmFoundationsModule } from "./modules/01-what-assembly-is";

/**
 * Assembly targeting x86-64 in Intel syntax with NASM on Linux. That
 * combination is chosen deliberately: Intel syntax is what the Intel and AMD
 * manuals use, NASM is the least ceremonious assembler to start with, and
 * x86-64 Linux is what the machine in front of you runs. AT&T syntax still gets
 * covered, in the module about reading compiler output, because that is where
 * you actually meet it.
 *
 * This is a track for building and understanding real programs, not for
 * interview preparation — so it ends on shipping assembly inside real projects,
 * and every module is written around code you assemble, link and run.
 */
const soon = (input: Parameters<typeof createComingSoonModule>[0]) =>
  createComingSoonModule({ ...input, interviewPrep: false });

export const assemblyTrack: TrackDefinition = {
  id: "assembly",
  slug: "assembly",
  title: "Assembly (x86-64)",
  shortTitle: "ASM",
  tagline: "What the machine actually executes, in Intel syntax with NASM",
  description:
    "The layer underneath every other language, from the very beginning: what assembly is, why it still exists, and what a CPU is really doing. You start with bits and the fetch-decode-execute cycle, write real x86-64 programs in NASM on Linux — registers, addressing modes, the stack, the System V ABI and syscalls — then use that knowledge to read compiler output, debug binaries, and make code genuinely faster. Built for people who want to write and understand machine-level code, not for interview preparation.",
  order: 9,
  status: "coming-soon",
  accent: "asm",
  mode: "learn",
  lessonMinutes: [25, 40],
  interviewPrep: false,
  runnable: false,
  modules: [
    asmFoundationsModule,
    soon({
      id: "asm-numbers-memory",
      slug: "numbers-bits-memory",
      title: "Numbers, Bits & How Memory Is Addressed",
      order: 2,
      description:
        "Assembly has no types, so the representation is your responsibility. This module makes every bit pattern you will meet legible before you write code that manipulates them.",
      topics: [
        "Bits, bytes, words, and why hexadecimal is the natural notation",
        "Binary and hex arithmetic you can do in your head",
        "Two's complement, signed against unsigned, and what overflow means",
        "Characters, ASCII, and strings as nothing but bytes",
        "Address space, addresses as numbers, and what a pointer really is",
        "Little-endian byte order, seen directly in a hex dump",
        "Alignment, and why the CPU cares where a value starts",
      ],
    }),
    soon({
      id: "asm-first-program",
      slug: "first-nasm-program",
      title: "Your First NASM Program",
      order: 3,
      description:
        "Toolchain, program skeleton, and a working program on screen — assembled, linked, run and stepped through in a debugger before the module is over.",
      topics: [
        "Installing and running the toolchain: nasm, ld and gcc",
        "Program structure: sections, labels, and the _start entry point",
        "Declaring data: db, dw, dd, dq and the equ constant",
        "Reserving uninitialised space in .bss with resb and friends",
        "Writing to stdout with the write syscall, byte by byte",
        "Exiting cleanly, and what an exit status is for",
        "Assembling, linking and running, one command at a time",
        "First contact with gdb: stepping instructions and reading registers",
      ],
    }),
    soon({
      id: "asm-registers",
      slug: "registers-data-movement",
      title: "Registers & Moving Data Around",
      order: 4,
      description:
        "The sixteen registers, the sub-register rules that surprise everyone exactly once, and every way of getting a value from one place to another.",
      topics: [
        "The sixteen general purpose registers and their conventional roles",
        "Sub-registers: rax, eax, ax and al, and the 32-bit zero-extension rule",
        "mov, immediates, and how operand size is decided",
        "Registers against memory: what an instruction may and may not touch",
        "lea, and why it is arithmetic rather than a memory access",
        "Sign extension and zero extension with movsx and movzx",
        "xchg, and swapping without a temporary",
      ],
    }),
    soon({
      id: "asm-arithmetic",
      slug: "arithmetic-logic-flags",
      title: "Arithmetic, Logic & Flags",
      order: 5,
      description:
        "Doing the maths, and reading the flags register that every conditional branch in every program you have ever run depends on.",
      topics: [
        "add, sub, inc, dec and neg",
        "Multiplication: mul against imul, and the forms of imul",
        "Division: div, idiv, the rdx:rax pair, and sign extension first",
        "Bitwise and, or, xor and not, and the idioms they enable",
        "Shifts and rotates, and multiplying by powers of two for free",
        "RFLAGS: the zero, sign, carry and overflow flags",
        "cmp and test, and knowing which one you actually want",
      ],
    }),
    soon({
      id: "asm-control-flow",
      slug: "control-flow",
      title: "Control Flow",
      order: 6,
      description:
        "Rebuilding every construct you know — if, while, for, switch — out of labels and jumps, and seeing why the compiler sometimes refuses to branch at all.",
      topics: [
        "Labels, jmp, and the shape of a basic block",
        "Conditional jumps, and signed against unsigned comparisons",
        "Translating if, else and nested conditions by hand",
        "while, do-while and for loops in assembly",
        "Jump tables, and how a switch statement compiles",
        "Conditional moves, and why branchless code can win",
        "Building a loop-heavy program: a working number formatter",
      ],
    }),
    soon({
      id: "asm-memory",
      slug: "memory-addressing",
      title: "Memory & Addressing Modes",
      order: 7,
      description:
        "The one addressing formula the whole instruction set uses, and how arrays, structs and strings are laid out to suit it.",
      topics: [
        "The addressing formula: base, index, scale and displacement",
        "Indexing arrays, and walking them with a pointer instead",
        "Structs, field offsets, alignment and padding",
        "The data, bss and rodata sections, and what is writable",
        "Strings, and the string instructions with rep",
        "RIP-relative addressing, and why position independence matters",
        "Building a data-structure routine you can call from anywhere",
      ],
    }),
    soon({
      id: "asm-stack",
      slug: "stack-and-calls",
      title: "The Stack & Function Calls",
      order: 8,
      description:
        "How a function call actually works — the return address, the frame, and the ABI contract that lets code from different compilers link together at all.",
      topics: [
        "push and pop, and how the stack grows downward",
        "call and ret, and where the return address lives",
        "Stack frames, rbp and rsp, and the prologue and epilogue",
        "The System V AMD64 ABI: argument registers and return values",
        "Caller-saved against callee-saved registers, and the red zone",
        "Local variables, and 16-byte stack alignment before a call",
        "Recursion in assembly, traced frame by frame",
      ],
    }),
    soon({
      id: "asm-os",
      slug: "os-interface",
      title: "Talking to the Operating System",
      order: 9,
      description:
        "Everything a program cannot do by itself: files, arguments, and memory that the kernel has to hand out.",
      topics: [
        "The Linux syscall convention, and reading the syscall table",
        "Reading and writing files, and the standard descriptors",
        "Command line arguments and the environment, as the kernel leaves them",
        "Getting memory from the kernel with brk and mmap",
        "Error returns from syscalls, and checking them properly",
        "Signals, and what a process can be interrupted by",
        "Writing a small but genuinely useful command-line utility",
      ],
    }),
    soon({
      id: "asm-linking",
      slug: "linking-libc-mixed",
      title: "Linking, libc & Mixing C with Assembly",
      order: 10,
      description:
        "Where assembly earns its keep in real projects: as a routine inside a larger program, called from C and calling back into it.",
      topics: [
        "Object files, symbols, and what the linker actually does",
        "global and extern, and controlling what your code exports",
        "Calling libc from assembly, and linking with gcc rather than ld",
        "Writing an assembly function that C code can call",
        "Calling a C function from assembly, and honouring the ABI both ways",
        "Static against dynamic linking, and the PLT and GOT",
        "Inline assembly in C and Rust, and when to prefer a separate file",
        "Building a mixed-language project with a Makefile",
      ],
    }),
    soon({
      id: "asm-compiler-output",
      slug: "reading-compiler-output",
      title: "Reading Compiler Output & Disassembly",
      order: 11,
      description:
        "The payoff module: point a compiler at C or Rust, read what it produced, and understand every transformation it made — plus AT&T syntax, since that is what the tools print.",
      topics: [
        "Generating assembly with gcc -S, and reading AT&T syntax fluently",
        "Mapping C constructs to the instructions they produce",
        "What actually changes between -O0, -O1, -O2 and -O3",
        "objdump and the disassembly of a binary you did not write",
        "The ELF format: sections, symbols and relocations",
        "Recognising inlining, unrolling and vectorisation in the output",
        "Using Compiler Explorer as a daily tool rather than a curiosity",
      ],
    }),
    soon({
      id: "asm-simd",
      slug: "simd-floating-point",
      title: "SIMD & Floating Point",
      order: 12,
      description:
        "Floating point as it is really represented, and the vector registers that do four or eight operations for the price of one.",
      topics: [
        "IEEE 754, and how a float is laid out in bits",
        "Scalar floating point in SSE: the xmm registers, addss and addsd",
        "Converting between integers and floats, and the rounding modes",
        "Packed operations, and doing four additions in one instruction",
        "Loads, stores, alignment and shuffles",
        "Vectorising a loop by hand, and comparing against the compiler",
        "AVX, wider registers, and detecting support at runtime with cpuid",
      ],
    }),
    soon({
      id: "asm-debugging",
      slug: "debugging-and-memory-safety",
      title: "Debugging, Crashes & Memory Safety",
      order: 13,
      description:
        "Using machine-level knowledge to find real bugs: reading a crash, understanding how memory corruption happens, and knowing what each modern mitigation actually stops.",
      topics: [
        "gdb in depth: breakpoints, watchpoints, and examining memory",
        "Reading a crash: segmentation faults, core dumps and backtraces",
        "How a stack buffer overflow corrupts a return address",
        "Stack canaries, NX, ASLR and PIE, and what each one prevents",
        "Reading disassembly to spot a memory safety bug in review",
        "Sanitizers and valgrind, and what they see that you cannot",
        "Writing assembly that is safe to link into someone else's program",
      ],
    }),
    soon({
      id: "asm-optimisation",
      slug: "optimisation-and-projects",
      title: "Optimisation & Assembly in Real Projects",
      order: 14,
      description:
        "Why two instruction sequences that do identical work run at different speeds, how to measure it honestly, and where hand-written assembly still belongs in a modern codebase.",
      topics: [
        "Instruction latency, throughput, and the out-of-order pipeline",
        "Branch prediction, and the real cost of a mispredict",
        "Cache lines, prefetching, and memory as the true bottleneck",
        "Measuring with perf, and counting cycles honestly",
        "Hand-optimising a routine, and beating or losing to the compiler",
        "Where assembly is still written in production, and where it is not",
        "Project: a hand-written hot routine, benchmarked against C",
      ],
    }),
  ],
};
