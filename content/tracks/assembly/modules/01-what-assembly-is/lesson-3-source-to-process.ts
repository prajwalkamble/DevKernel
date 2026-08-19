import type { Lesson } from "@/content/types";

export const sourceToProcessLesson: Lesson = {
  id: "asm-source-to-process",
  slug: "from-source-to-process",
  moduleSlug: "what-assembly-is",
  title: "From Source Code to a Running Process",
  summary:
    "The four programs that stand between a text file and a running process — preprocessor, compiler, assembler, linker — plus the loader that starts it. Each stage run by hand on a real C file, so you can see exactly what each one produces.",
  estimatedMinutes: 35,
  objectives: [
    "Name the four build stages and what each consumes and produces",
    "Run each stage separately and inspect its output",
    "Explain what an object file is and why it is not yet runnable",
    "Read `nm` output and understand what an undefined symbol means",
    "Describe what the loader does when you run a binary",
    "Set up an x86-64 Linux environment if you are not already on one",
  ],
  sections: [
    {
      id: "four-stages",
      heading: "Four programs, not one",
      body: [
        "`gcc hello.c -o hello` looks like a single step. It is four, chained together, and `gcc` is mostly a driver that runs them in order. Doing them one at a time once is the fastest way to understand what an assembler actually is and where your assembly will fit in.",
        "**The preprocessor** is pure text manipulation: it pastes in `#include` files, expands `#define` macros, and strips comments. It knows nothing about C. Output is still C, just much bigger.",
        "**The compiler** turns C into *assembly*. This is the only stage that makes decisions — register allocation, instruction selection, all the optimisation. Its output is a text `.s` file, and this is exactly the language this track teaches.",
        "**The assembler** turns assembly into machine code, producing an **object file**. This is the stage NASM will do for you. It is nearly mechanical.",
        "**The linker** combines object files, resolves references between them, pulls in library code, and lays out the final executable.",
        "Only after all four do you have something you can run — and even then a fifth program, the **loader**, has to put it in memory before anything executes.",
      ],
    },
    {
      id: "stage-by-stage",
      heading: "Running the stages by hand",
      body: [
        "Start from an ordinary C file. Six lines, and by the end you will have watched all of them turn into instructions.",
      ],
      examples: [
        {
          id: "the-c-file",
          title: "hi.c",
          lang: "cpp",
          code: `#include <stdio.h>

int main(void) {
    printf("Hello, world!\\n");
    return 0;
}`,
        },
        {
          id: "stage-preprocess",
          title: "Stage 1 — the preprocessor",
          lang: "bash",
          code: `gcc -E hi.c -o hi.i
wc -l hi.c hi.i`,
          output: `    6 hi.c
  816 hi.i
  822 total`,
          explanation:
            "Six lines became 816. All of that is `stdio.h` and everything it includes, pasted in verbatim — the declarations of `printf`, `fopen`, `FILE` and the rest. Nothing has been compiled; this is still C, and it is why a C file with a few includes takes longer to compile than its length suggests.",
        },
        {
          id: "stage-compile",
          title: "Stage 2 — the compiler, which produces assembly",
          lang: "bash",
          code: `gcc -S -O2 -masm=intel -fno-asynchronous-unwind-tables hi.c -o hi.s
cat hi.s`,
          output: `	.file	"hi.c"
	.intel_syntax noprefix
	.text
	.section	.rodata.str1.1,"aMS",@progbits,1
.LC0:
	.string	"Hello, world!"
	.section	.text.startup,"ax",@progbits
	.p2align 4
	.globl	main
	.type	main, @function
main:
	sub	rsp, 8
	lea	rdi, .LC0[rip]
	call	puts@PLT
	xor	eax, eax
	add	rsp, 8
	ret
	.size	main, .-main
	.ident	"GCC: (Debian 14.2.0-19) 14.2.0"
	.section	.note.GNU-stack,"",@progbits`,
          explanation:
            "**This is the point of the whole lesson: your C file has become assembly, and it is readable.** `-masm=intel` asks GCC for Intel syntax rather than its default AT&T. Six instructions do the work: reserve stack space, put the string's address in `rdi`, call a function, zero `eax` as the return value, release the stack, return. Everything beginning with a dot is a *directive* — an instruction to the assembler rather than to the CPU.",
        },
      ],
      pitfalls: [
        {
          title: "The compiler replaced printf with puts",
          body: "There is no `printf` call in that output. GCC recognised a format string with no format specifiers ending in a newline and rewrote it as `puts`, which is faster. This is a small example of a large point: the assembly a compiler produces is a translation of *what your program means*, not of what you literally wrote. Module 11 is built around reading these transformations.",
        },
      ],
    },
    {
      id: "object-files",
      heading: "Stage 3: the assembler, and what an object file is",
      body: [
        "The assembler turns that text into machine code. What it produces is not a program — it is an **object file**, and the distinction matters.",
        "An object file contains real machine code, but with holes in it. It knows the bytes for every instruction whose meaning is entirely local. It does not know the address of anything defined elsewhere, because it has never seen elsewhere. Instead it records a **symbol table** — a list of names this file defines and names it needs — and **relocations**, which are notes saying \"once you know where `puts` ended up, patch its address into the four bytes at this offset\".",
      ],
      examples: [
        {
          id: "stage-assemble",
          title: "Stage 3 — assemble, then look at the symbols",
          lang: "bash",
          code: `gcc -c hi.s -o hi.o
file hi.o
nm hi.o`,
          output: `hi.o: ELF 64-bit LSB relocatable, x86-64, version 1 (SYSV), not stripped
0000000000000000 r .LC0
0000000000000000 T main
                 U puts`,
          explanation:
            "Three lines from `nm`, and each letter is a symbol type. **`T`** means this file *defines* `main`, in the text (code) section. **`r`** is the read-only string constant. **`U`** means `puts` is *undefined* — this file needs it and does not have it. Note the blank address next to it: there is nothing to write there yet. Resolving that is the linker's entire job.",
        },
        {
          id: "stage-link",
          title: "Stage 4 — the linker, which produces something runnable",
          lang: "bash",
          code: `gcc hi.o -o hi
file hi
./hi`,
          output: `hi: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=bff06ae9..., for GNU/Linux 3.2.0, not stripped
Hello, world!`,
          explanation:
            "Compare this with the object file's description. `relocatable` became `pie executable` — a position-independent executable, which can be loaded at any address. And it is `dynamically linked` with an `interpreter`, which is the crucial detail in the next section.",
        },
      ],
    },
    {
      id: "loader",
      heading: "What happens when you press enter",
      body: [
        "The binary exists. Running it is a fifth stage, done by the kernel and by a program most people have never heard of.",
        "**The kernel** creates a new process, reads the executable's headers, and maps its sections into the new address space: code as read-only and executable, initialised data as read-write, and a region of zeroes for the uninitialised data. It sets up a stack, places the command-line arguments and environment on it, and prepares to jump to the entry point.",
        "**The dynamic linker** runs first, though. That `interpreter /lib64/ld-linux-x86-64.so.2` line in the `file` output means the binary is not self-contained: it needs the C library, and the kernel hands control to the dynamic linker to find it, map it in, and patch up every reference before your code runs. This is why a dynamically linked program starts a little slower and why a missing shared library is a runtime failure rather than a build failure.",
        "**Then `_start` runs** — not `main`. `_start` comes from the C runtime startup code, which the linker added for you. It collects `argc` and `argv` from where the kernel left them, initialises the C library, calls `main`, and when `main` returns, passes its return value to the `exit` system call.",
        "That last point matters for this track. **When you write assembly with NASM and link with `ld` rather than `gcc`, none of that startup code is there.** Your entry point is called directly, there is no C library, `argc` and `argv` are sitting raw on the stack, and returning from your entry point does not exit — there is nowhere to return to. You have to make the `exit` syscall yourself. The starter program in module 3 does exactly that, and now you know why.",
      ],
      examples: [
        {
          id: "static-vs-dynamic",
          title: "The same program, self-contained",
          lang: "bash",
          code: `gcc -static hi.o -o hi_static
file hi_static
ls -l hi hi_static`,
          output: `hi_static: ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), statically linked, BuildID[sha1]=8291a4b6..., for GNU/Linux 3.2.0, not stripped
-rwxrwxr-x 1 you you   15952 hi
-rwxrwxr-x 1 you you  758440 hi_static`,
          explanation:
            "Statically linked: no interpreter, no external dependency, and the whole of the C library it uses copied inside. Roughly fifty times larger, and it will run on any x86-64 Linux system regardless of what is installed. Module 10 covers the trade-off properly.",
        },
      ],
    },
    {
      id: "environment",
      heading: "Getting an x86-64 Linux environment",
      body: [
        "Everything in this track assumes x86-64 Linux with `nasm`, `binutils` (which provides `ld` and `objdump`), `gcc` and `gdb`. If you are already there, one command sets you up.",
        "**On Windows**, use WSL2: `wsl --install` in an administrator PowerShell gets you a real Ubuntu, and everything below works unchanged.",
        "**On an Apple Silicon Mac**, your processor is ARM64 and cannot run x86-64 instructions natively. The most reliable route is a Linux VM under UTM or a Docker container running an x86-64 image under emulation — slower, but correct. Learning ARM64 assembly instead is a perfectly good alternative; every concept here transfers, but none of the commands or instruction names will.",
        "**On an Intel Mac**, the instruction set is right but the object file format (Mach-O) and system call interface are different. A Linux VM or container is still the path of least resistance.",
      ],
      examples: [
        {
          id: "install-toolchain",
          title: "Everything you need, on Debian or Ubuntu",
          lang: "bash",
          code: `sudo apt update
sudo apt install nasm binutils gcc gdb

# Check the architecture is what this track assumes
uname -m

# Check the tools answer
nasm -v
ld --version | head -1
gdb --version | head -1`,
          output: `x86_64
NASM version 2.16.03
GNU ld (GNU Binutils for Debian) 2.44
GNU gdb (Debian 16.3-1) 16.3`,
          explanation:
            "`uname -m` must print `x86_64`. If it prints `aarch64` or `arm64`, you are on an ARM machine and the assembly in this track will assemble but not run. Version numbers will differ; anything recent is fine.",
        },
      ],
    },
  ],
  takeaways: [
    "Four programs stand between source and executable: preprocessor, compiler, assembler, linker — `gcc` is a driver that runs them in order",
    "The compiler's output is assembly text, which is exactly the language this track teaches; `gcc -S -masm=intel` shows it to you",
    "An object file is machine code with holes: a symbol table of what it defines and needs, plus relocations telling the linker where to patch",
    "`nm` marks defined symbols with a capital letter and undefined ones with `U`",
    "Running a binary involves the kernel mapping it in and, for a dynamically linked program, the dynamic linker resolving libraries first",
    "`_start` runs before `main` and comes from the C runtime — link with `ld` instead of `gcc` and none of it is there, which is why raw assembly must make the exit syscall itself",
  ],
  status: "available",
};
