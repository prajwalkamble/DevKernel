import type { Lesson } from "@/content/types";

export const whatIsAssemblyLesson: Lesson = {
  id: "asm-what-is-assembly",
  slug: "what-is-assembly",
  moduleSlug: "what-assembly-is",
  title: "What Assembly Is, and Why It Still Matters",
  summary:
    "What assembly language actually is, how it differs from machine code, why there are many assembly languages rather than one, and the honest answer to why you would learn it in an era when compilers write better assembly than you do.",
  estimatedMinutes: 25,
  objectives: [
    "Define assembly language precisely, and distinguish it from machine code",
    "Explain why assembly is specific to a processor architecture",
    "Name the difference between Intel and AT&T syntax, and why this track picks one",
    "Give concrete, current reasons assembly is still written and read",
    "Set a realistic expectation of what this track will and will not make you good at",
  ],
  sections: [
    {
      id: "definition",
      heading: "Assembly is a readable spelling of machine code",
      body: [
        "A processor does not execute text. It executes **machine code**: sequences of bytes, where each sequence encodes one instruction — what operation to perform, on which registers, with which constants.",
        "Nobody wants to write bytes. So for every processor family there is an **assembly language**: a text notation where each line corresponds to one machine instruction, written with a name instead of a number.",
        "That correspondence is the defining property. In C, one line can become fifty instructions or none at all. In assembly, `mov rax, 1` is one instruction, and it becomes exactly the five bytes that encode it. **Assembly is not a higher-level description of what you want; it is machine code with the numbers spelled out.**",
        "The program that performs the translation is an **assembler**. It is a much simpler program than a compiler because there is almost nothing to decide — mostly it is looking names up in a table, calculating how far away your labels are, and emitting bytes.",
      ],
      examples: [
        {
          id: "asm-to-bytes",
          title: "The same instruction, three ways",
          lang: "asm",
          code: `; What you write:
    mov eax, 1

; What the assembler emits (five bytes, in hexadecimal):
;   b8 01 00 00 00
;
;   b8          -> "move the following 32-bit constant into eax"
;   01 00 00 00 -> the constant 1, little-endian`,
          explanation:
            "The opcode byte `b8` encodes both the operation and the destination register. The four bytes after it are the number 1, stored least-significant-byte first — which is what *little-endian* means and why it looks backwards. This is the entire relationship between assembly and machine code.",
        },
      ],
    },
    {
      id: "not-one-language",
      heading: "There is no such thing as 'assembly language'",
      body: [
        "There are many, and they have almost nothing in common. Machine code is defined by the processor, so the assembly language that spells it out is too.",
        "**x86-64** (also called AMD64 or x64) is what desktops, laptops and most servers run — Intel and AMD chips. It has hundreds of instructions accumulated over forty years of backwards compatibility, and it is what this track teaches.",
        "**ARM64** (AArch64) is what phones, Apple Silicon Macs and an increasing share of servers run. Cleaner and more regular than x86-64, with fixed-width instructions.",
        "**RISC-V** is an open architecture growing quickly in embedded work and academia. **AVR** runs on Arduinos. Each of these has its own registers, its own instruction names, its own calling conventions.",
        "Learning one does not give you another for free — but it gives you most of the way. The concepts transfer completely: registers, the stack, addressing modes, calling conventions, flags. Only the spellings change. Somebody fluent in x86-64 can be productive in ARM64 in about a week.",
      ],
      pitfalls: [
        {
          title: "The same processor has two different assembly syntaxes",
          body: "x86 assembly is written in two notations. **Intel syntax** puts the destination first (`mov rax, 1`) and is what Intel's and AMD's own manuals use. **AT&T syntax** puts the source first (`movq $1, %rax`), prefixes registers with `%` and constants with `$`, and is what GCC and older GNU tools emit by default. They describe identical machine code. This track uses Intel syntax with the NASM assembler, because it is far easier to read while learning — but AT&T is covered properly in module 11, because that is where you meet it: reading compiler output.",
        },
      ],
    },
    {
      id: "why-learn",
      heading: "Why learn it, when the compiler is better at it than you",
      body: [
        "This objection is correct and worth confronting directly. For almost any routine you can write, a modern optimising compiler will produce faster assembly than you will, and it will do it in a fraction of the time. If your goal is fast code, the answer is nearly always better algorithms and better data layout, not hand-written assembly.",
        "So the reason to learn it is not to compete with the compiler. It is this:",
        "**You can see what your code actually does.** Every performance question you have ever had — is this abstraction free, is the compiler hoisting this out of the loop, did it vectorise this, is this branch actually there — has a definite answer, and the answer is written in assembly. Being able to read it turns performance work from folklore into observation.",
        "**You can debug what nothing else can reach.** When a program crashes with no source available, when a build is miscompiled, when a stack is corrupted, when the bug only appears at `-O2` — the disassembly is the ground truth. Every stack trace, core dump and profiler output eventually resolves to addresses and instructions.",
        "**Some code has to be written this way.** Operating system boot code, context switching, interrupt handlers, and the first instructions of a process run before there is a C environment to run in. Cryptographic routines are written in assembly to guarantee constant-time execution, because a compiler is free to introduce a data-dependent branch and leak a key through timing. Hand-vectorised SIMD kernels in codecs, compression libraries and BLAS implementations still beat what compilers infer.",
        "**Security work requires it.** Exploit analysis, malware reverse engineering, firmware auditing and vulnerability research all happen at this level, because that is the only level at which the artefact exists.",
        "**It removes the last layer of magic.** After this track, there is no level below which you have not looked. Pointers, the stack, why a struct has padding in it, what a function call costs, what undefined behaviour lets a compiler get away with — all of these stop being rules you memorised and become things you can see.",
      ],
    },
    {
      id: "what-this-track",
      heading: "What this track is, and is not",
      body: [
        "**This track is for building and understanding real programs.** You will write x86-64 assembly with NASM on Linux, assemble it, link it, run it and debug it. You will write functions that C can call and call C functions from assembly. You will read compiler output fluently, disassemble binaries you did not write, and hand-optimise a routine and measure honestly whether you beat the compiler.",
        "**It is not interview preparation.** Assembly does not come up in interviews except as trivia, and building the track around interview questions would mean spending time on things nobody does. The room that would have gone there goes to real programs instead.",
        "**You will not come out writing whole applications in assembly.** Nobody does that, and it would be a bad idea. You will come out able to write the parts that need it, read all of it, and understand precisely what every other language you use is doing underneath.",
        "One practical note before we go further: the whole track assumes **x86-64 Linux**. If you are on an Apple Silicon Mac or Windows, the concepts all transfer, but the exact commands will not. The most reliable way to follow along is a Linux virtual machine, WSL2 on Windows, or a container — module 3 covers setting that up.",
      ],
    },
  ],
  takeaways: [
    "Assembly is a text notation where one line corresponds to one machine instruction — not a higher-level description of intent",
    "An assembler translates that text to bytes; it is a far simpler program than a compiler",
    "Assembly is specific to a processor architecture: x86-64, ARM64 and RISC-V are unrelated languages that share every concept",
    "x86 has two syntaxes for the same machine code — Intel (destination first) and AT&T (source first); this track uses Intel with NASM",
    "The reason to learn it is not to outperform the compiler but to see what your code compiles to, debug what nothing else reaches, and write the code that has to be written this way",
    "This track is aimed at building and reading real programs on x86-64 Linux, not at interview preparation",
  ],
  status: "available",
};
