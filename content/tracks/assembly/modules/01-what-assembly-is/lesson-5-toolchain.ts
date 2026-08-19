import type { Lesson } from "@/content/types";

export const toolchainLesson: Lesson = {
  id: "asm-toolchain",
  slug: "the-toolchain",
  moduleSlug: "what-assembly-is",
  title: "The Toolchain, and Seeing the Machine Code",
  summary:
    "The five tools you will use for the rest of this track — nasm, ld, objdump, readelf and gdb — and what each one lets you see. By the end you will have watched a program's registers change one instruction at a time.",
  estimatedMinutes: 30,
  objectives: [
    "Assemble and link a program, and know what each command produced",
    "Read a NASM listing file and match each source line to its bytes",
    "Disassemble a binary in Intel syntax with objdump",
    "Inspect a binary's headers and section contents",
    "Set a breakpoint, step single instructions and read registers in gdb",
    "Configure gdb for Intel syntax so it matches what you write",
  ],
  sections: [
    {
      id: "five-tools",
      heading: "Five tools, five jobs",
      body: [
        "**`nasm`** — the assembler. Turns your `.asm` into an object file, and optionally into a *listing* that shows the bytes it produced for each line.",
        "**`ld`** — the linker. Turns object files into an executable. You will also use `gcc` as a linker from module 10 onwards, when you start calling C library functions.",
        "**`objdump`** — disassembles a binary and dumps sections. The tool you will reach for most, after nasm itself.",
        "**`readelf`** — reads the metadata of an ELF file: headers, sections, symbols, relocations. Overlaps with objdump but is more thorough on structure.",
        "**`gdb`** — the debugger. Lets you stop a program mid-instruction and look at everything.",
        "None of these are assembly-specific; they are the standard GNU binary tools, and knowing them pays off in C, Rust and anything else that produces native code.",
      ],
    },
    {
      id: "assemble-link",
      heading: "Assembling and linking",
      body: [
        "Two commands, and it is worth being precise about what each one is for.",
        "`nasm -f elf64 hello.asm -o hello.o` — the `-f elf64` is the **output format**, and it is not optional. NASM can emit several formats (`elf64` for 64-bit Linux, `macho64` for macOS, `win64` for Windows), and it will not guess. Getting this wrong is the most common first error.",
        "`ld hello.o -o hello` — the linker resolves addresses, lays out sections, and writes an executable. By default `ld` looks for an entry point called `_start`, which is why that particular name appears in the program and why it must be `global`.",
      ],
      examples: [
        {
          id: "build-commands",
          title: "Build and run",
          lang: "bash",
          code: `nasm -f elf64 hello.asm -o hello.o
ld hello.o -o hello
./hello
echo "exit status: $?"`,
          output: `Hello from assembly!
exit status: 0`,
          explanation:
            "`$?` in the shell is the exit status of the last command, which is the value the program passed to the `exit` syscall. Change `xor edi, edi` to `mov edi, 3` and this prints 3 — a small, immediate way to confirm the syscall convention is doing what you think.",
        },
      ],
      pitfalls: [
        {
          title: "`ld: warning: cannot find entry symbol _start`",
          body: "This means you forgot `global _start`, or misspelled it. The linker carries on, defaults the entry point to the start of `.text`, and you may even get a program that works by accident — which makes it worse, because the warning is easy to ignore and the failure mode later is confusing. Treat it as an error.",
        },
      ],
    },
    {
      id: "listing",
      heading: "The listing file: your source and its bytes, side by side",
      body: [
        "Pass `-l` to NASM and it writes a listing: every source line, with the offset and the exact bytes it assembled to. For learning, this is the single most useful output the toolchain produces, because it makes the source-to-bytes correspondence literal.",
      ],
      examples: [
        {
          id: "listing-output",
          title: "nasm -l, on the program from the previous lesson",
          lang: "bash",
          code: `nasm -f elf64 -l hello.lst hello.asm -o hello.o
cat hello.lst`,
          output: `     1                                  ; x86-64 Linux, Intel syntax, assembled with NASM.
     2                                  ; There is no runtime here: you ask the kernel to do the work directly.
     3
     4                                  section .data
     5 00000000 48656C6C6F2066726F-         msg:    db  "Hello from assembly!", 10
     5 00000009 6D20617373656D626C-
     5 00000012 79210A
     6                                      msglen: equ $ - msg
     7
     8                                  section .text
     9                                      global _start
    10
    11                                  _start:
    12 00000000 B801000000                  mov rax, 1
    13 00000005 BF01000000                  mov rdi, 1
    14 0000000A 48BE-                       mov rsi, msg
    14 0000000C [0000000000000000]
    15 00000014 BA15000000                  mov rdx, msglen
    16 00000019 0F05                        syscall
    17
    18 0000001B B83C000000                  mov rax, 60
    19 00000020 31FF                        xor edi, edi
    20 00000022 0F05                        syscall`,
          explanation:
            "Four columns: line number, offset within the section, the bytes, and the source. Comments and directives produce no bytes, which is why lines 1-4, 6 and 9 have an empty byte column — direct confirmation that directives are not instructions.",
        },
      ],
      pitfalls: [
        {
          title: "Square brackets in a listing mean 'the linker will fill this in'",
          body: "Line 14 shows `[0000000000000000]` where the address of `msg` should be. The assembler does not know where `.data` will end up — that is the linker's decision — so it emits zeroes and records a relocation. After linking, that field holds `0x402000`. Any time you see bracketed zeroes in a listing, you are looking at a relocation.",
        },
      ],
    },
    {
      id: "objdump",
      heading: "objdump: reading the finished binary",
      body: [
        "The listing shows what the assembler intended. `objdump` shows what is actually in the file, after linking, with real addresses.",
        "**Always pass `-M intel`.** GNU tools default to AT&T syntax, and reading your own program back in a different notation than you wrote it is needlessly confusing while learning.",
      ],
      examples: [
        {
          id: "objdump-disasm",
          title: "Disassembling the executable",
          lang: "bash",
          code: `objdump -d -M intel hello`,
          output: `hello:     file format elf64-x86-64

Disassembly of section .text:

0000000000401000 <_start>:
  401000:	b8 01 00 00 00       	mov    eax,0x1
  401005:	bf 01 00 00 00       	mov    edi,0x1
  40100a:	48 be 00 20 40 00 00 	movabs rsi,0x402000
  401011:	00 00 00
  401014:	ba 15 00 00 00       	mov    edx,0x15
  401019:	0f 05                	syscall
  40101b:	b8 3c 00 00 00       	mov    eax,0x3c
  401020:	31 ff                	xor    edi,edi
  401022:	0f 05                	syscall`,
          explanation:
            "The relocation is resolved: `msg` is `0x402000`. `-d` disassembles executable sections only; `-D` does every section, which mostly produces nonsense because it tries to decode data as instructions.",
        },
        {
          id: "objdump-data",
          title: "Dumping the data section, to see the bytes as bytes",
          lang: "bash",
          code: `objdump -s -j .data hello`,
          output: `hello:     file format elf64-x86-64

Contents of section .data:
 402000 48656c6c 6f206672 6f6d2061 7373656d  Hello from assem
 402010 626c7921 0a                          bly!.`,
          explanation:
            "Address on the left, raw bytes in the middle, printable interpretation on the right. `48` is `H`, `65` is `e`, and the final `0a` is the newline — decimal 10, exactly as declared. Twenty-one bytes, from `0x402000` to `0x402014`, which is where `msglen` came from.",
        },
        {
          id: "readelf-header",
          title: "readelf: the metadata around the code",
          lang: "bash",
          code: `readelf -h hello`,
          output: `ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Type:                              EXEC (Executable file)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x401000
  Number of program headers:         3
  Number of section headers:         6`,
          explanation:
            "Output trimmed. The magic bytes `7f 45 4c 46` are `\\x7f` followed by `ELF` in ASCII — how every tool recognises the format. **Entry point address `0x401000`** is where the kernel will jump, and it matches `_start` in the disassembly exactly. Module 11 goes through this format properly.",
        },
      ],
    },
    {
      id: "gdb",
      heading: "gdb: watching it happen",
      body: [
        "Static tools show you the program. `gdb` shows you the program *running* — stopped between two instructions, with every register visible.",
        "The first thing to do is fix the syntax. gdb also defaults to AT&T, and you can change it permanently by putting one line in `~/.gdbinit`.",
        "The commands worth knowing on day one are few. **`break *0x401000`** sets a breakpoint at an address — the `*` is required, and distinguishes it from breaking on a function name. **`run`** starts the program. **`stepi`** (or `si`) executes exactly one instruction. **`info registers`** prints registers, optionally named ones. **`x`** examines memory: `x/4i $rip` shows the next four instructions, `x/s addr` shows a string, `x/16xb addr` shows sixteen bytes in hex.",
      ],
      examples: [
        {
          id: "gdbinit",
          title: "Set this once and forget it",
          lang: "bash",
          code: `echo "set disassembly-flavor intel" >> ~/.gdbinit`,
          explanation:
            "Every future gdb session will now disassemble in the same notation you write. Without it, `mov rax, 1` comes back at you as `mov $0x1,%rax` and you will misread operand order at least once.",
        },
        {
          id: "gdb-session",
          title: "Stepping through the write syscall",
          lang: "bash",
          code: `gdb -q ./hello

(gdb) set disassembly-flavor intel
(gdb) break *0x401000
(gdb) run
(gdb) info registers rax rdi rsi rdx
(gdb) x/4i $rip
(gdb) stepi 4
(gdb) info registers rax rdi rsi rdx
(gdb) x/s 0x402000`,
          output: `Breakpoint 1 at 0x401000

Breakpoint 1, 0x0000000000401000 in _start ()

rax            0x0                 0
rdi            0x0                 0
rsi            0x0                 0
rdx            0x0                 0

=> 0x401000 <_start>:	mov    eax,0x1
   0x401005 <_start+5>:	mov    edi,0x1
   0x40100a <_start+10>:	movabs rsi,0x402000
   0x401014 <_start+20>:	mov    edx,0x15

0x0000000000401019 in _start ()

rax            0x1                 1
rdi            0x1                 1
rsi            0x402000            4202496
rdx            0x15                21

0x402000:	"Hello from assembly!\\n"`,
          explanation:
            "This is the payoff. At the breakpoint every register is zero — the kernel handed us a clean slate. After four `stepi`s we are stopped just before `syscall`, and the four registers hold exactly the arguments the convention specifies: syscall number 1, file descriptor 1, buffer at `0x402000`, length 21. The last command reads that address back as a string and finds the message. **Nothing here is inferred; you are looking at the machine's actual state.**",
        },
      ],
      pitfalls: [
        {
          title: "`stepi` steps into the kernel, and gdb cannot follow",
          body: "Stepping over a `syscall` instruction executes the whole system call as one step — the kernel's code is not yours to single-step through. That is normal. Similarly, `stepi` over a `call` enters the called function; `nexti` steps over it instead. Confusing the two is how people get lost inside library code they did not mean to visit.",
        },
      ],
    },
    {
      id: "a-loop",
      heading: "A loop you can run right now",
      body: [
        "You now have everything you need for the working rhythm of the rest of this track: **edit, assemble, link, run — and when it does not do what you expected, disassemble it and step through it.** A short shell function makes the first four one keystroke.",
      ],
      examples: [
        {
          id: "build-script",
          title: "A build helper worth keeping",
          lang: "bash",
          code: `# Put this in ~/.bashrc
asmrun() {
    nasm -f elf64 -g -F dwarf "$1.asm" -o "$1.o" || return 1
    ld "$1.o" -o "$1" || return 1
    ./"$1"
    echo "exit status: $?"
}

# Then:
#   asmrun hello`,
          output: `Hello from assembly!
exit status: 0`,
          explanation:
            "`-g -F dwarf` tells NASM to include debug information, so gdb can show your original source lines next to the instructions rather than addresses alone. There is no reason not to have it on while learning.",
        },
      ],
    },
  ],
  takeaways: [
    "nasm assembles, ld links, objdump disassembles, readelf reads structure, gdb runs it under a microscope",
    "`-f elf64` is mandatory for nasm on 64-bit Linux, and ld looks for `_start` as the entry point",
    "`nasm -l` writes a listing showing each source line's offset and exact bytes — the clearest possible view of what assembling does",
    "Bracketed zeroes in a listing are relocations the linker will fill in",
    "Always pass `-M intel` to objdump and set `disassembly-flavor intel` in ~/.gdbinit, or the tools answer in AT&T syntax",
    "`break *addr`, `run`, `stepi`, `info registers` and `x` are enough to watch a program execute one instruction at a time",
    "`stepi` cannot follow a syscall into the kernel, and `nexti` steps over a call rather than into it",
  ],
  status: "available",
};
