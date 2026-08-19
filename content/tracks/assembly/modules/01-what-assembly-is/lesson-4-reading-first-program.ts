import type { Lesson } from "@/content/types";

export const readingFirstProgramLesson: Lesson = {
  id: "asm-reading-first-program",
  slug: "reading-your-first-program",
  moduleSlug: "what-assembly-is",
  title: "Reading Your First x86-64 Program",
  summary:
    "A complete, working NASM program, read line by line: the anatomy of an instruction, what a label is, why some lines start with a dot, how data is declared, and what a system call actually is.",
  estimatedMinutes: 35,
  objectives: [
    "Read the four parts of an assembly line: label, mnemonic, operands, comment",
    "Tell instructions and assembler directives apart",
    "Explain what sections are and why code and data are separated",
    "Follow how a string and its length are declared and referenced",
    "Describe what a system call is and how arguments are passed to one",
    "Explain why a program written this way must exit explicitly",
  ],
  sections: [
    {
      id: "the-program",
      heading: "The whole program",
      body: [
        "Here it is in full. It prints a line and exits. Read it once without trying to understand it, then we will take it apart from the top.",
      ],
      examples: [
        {
          id: "hello-full",
          title: "hello.asm",
          lang: "asm",
          code: `; x86-64 Linux, Intel syntax, assembled with NASM.
; There is no runtime here: you ask the kernel to do the work directly.

section .data
    msg:    db  "Hello from assembly!", 10   ; 10 is the newline byte
    msglen: equ $ - msg                      ; $ means "here", so this is the length

section .text
    global _start

_start:
    mov rax, 1              ; syscall 1 = write
    mov rdi, 1              ; fd 1 = stdout
    mov rsi, msg            ; buffer address
    mov rdx, msglen         ; how many bytes
    syscall

    mov rax, 60             ; syscall 60 = exit
    xor edi, edi            ; status 0
    syscall`,
          output: `Hello from assembly!`,
          explanation:
            "Nine instructions and two data declarations. Every high-level language you have used is, eventually, doing some version of this.",
        },
      ],
    },
    {
      id: "anatomy",
      heading: "The anatomy of a line",
      body: [
        "Assembly has almost no syntax. A line has up to four parts and all of them are optional:",
        "**`label:  mnemonic  operands  ; comment`**",
        "A **label** is a name for the address of whatever comes next. It ends in a colon. Labels are how you refer to a place — to jump to it, to load data from it, to call it. They exist only in your source; the assembler replaces every use with a number.",
        "A **mnemonic** is the instruction name: `mov`, `add`, `jmp`, `syscall`. There are hundreds on x86-64, and you will use about forty of them regularly.",
        "**Operands** are what the instruction acts on: registers, constants, or memory locations. In Intel syntax the **destination comes first**, so `mov rax, 1` means *rax gets 1*. Read it as an assignment arrow pointing left.",
        "A **comment** starts with a semicolon and runs to the end of the line. Comment assembly heavily. In C you can usually work out what a line is doing; in assembly a line's *purpose* is genuinely invisible from the line itself, and code you wrote a month ago will be opaque without them.",
      ],
      pitfalls: [
        {
          title: "Destination first is a convention, not a rule of the machine",
          body: "Intel syntax puts the destination first; AT&T syntax puts it last, so the same instruction is `movq $1, %rax`. Neither is more correct — they are two notations for the same bytes. The practical hazard is reading a Stack Overflow answer in one syntax while writing in the other, and getting the operands backwards. Check for `%` and `$` sigils: if you see them, you are looking at AT&T.",
        },
      ],
    },
    {
      id: "directives",
      heading: "Directives: lines that are not instructions",
      body: [
        "`section`, `global`, `db` and `equ` are not instructions. The CPU never sees them. They are **directives** — commands to the assembler itself, telling it how to organise its output.",
        "This distinction is the one beginners most often miss, and it explains a lot of confusing error messages. `db` does not *do* anything at runtime; it tells the assembler to place some bytes in the output file. `equ` does not assign to anything; it defines a name the assembler substitutes while assembling.",
        "The rule of thumb: **if it changes what the program does while running, it is an instruction. If it changes what the file contains, it is a directive.**",
      ],
    },
    {
      id: "sections",
      heading: "Sections: code here, data there",
      body: [
        "`section .data` and `section .text` split the output into regions, and the linker gives each region different permissions when the program is loaded.",
        "**`.text`** holds your instructions. It is mapped **readable and executable, but not writable** — so a bug cannot overwrite your own code.",
        "**`.data`** holds initialised variables. **Readable and writable, but not executable** — so data a program reads from the network cannot be jumped into and run. This separation, enforced by the hardware's no-execute bit, is one of the most effective mitigations against memory-corruption exploits ever deployed.",
        "**`.rodata`** holds read-only constants, and **`.bss`** holds variables that start as zero. `.bss` costs nothing in the file: it is a note saying \"reserve this many bytes of zeroes\", so a megabyte-sized zero buffer adds nothing to your binary's size. Module 3 covers both.",
        "`global _start` is a different kind of directive: it makes the symbol `_start` visible to the linker. Without it the label is private to this file, the linker cannot find an entry point, and you get a warning and a program that starts in the wrong place.",
      ],
    },
    {
      id: "data",
      heading: "Declaring data: db and equ",
      body: [
        "Two lines, and they do very different things.",
        "**`msg: db \"Hello from assembly!\", 10`** — `db` means *define byte*. It places the bytes that follow directly into the output, at this point in the `.data` section. A quoted string is shorthand for its characters' byte values, and `10` is a literal byte — the newline. The label `msg` is the address of the first of them.",
        "There is no length stored anywhere and no terminating zero. **A string in assembly is just some bytes; nothing marks where it ends.** That is why the next line exists.",
        "**`msglen: equ $ - msg`** — `equ` defines a constant. `$` is a special symbol meaning *the current address*, so `$ - msg` is the distance in bytes from the start of the string to here, which is its length. The assembler computes this while assembling and substitutes the number; there is no subtraction at runtime.",
        "This is the assembly way of doing things: rather than store the length and read it back, compute it once at assembly time and bake the constant into the instruction. In this program `msglen` is 21 — twenty characters plus the newline — and the machine code contains the literal 21.",
      ],
      examples: [
        {
          id: "db-variants",
          title: "The size suffixes you will meet",
          lang: "asm",
          code: `section .data
    flag:     db  1                    ; 1 byte
    year:     dw  2026                 ; 2 bytes (word)
    count:    dd  1000000              ; 4 bytes (double word)
    big:      dq  9223372036854775807  ; 8 bytes (quad word)

    letters:  db  'a', 'b', 'c'        ; three separate bytes
    text:     db  "hello", 0           ; C-style, zero-terminated
    numbers:  dd  1, 2, 3, 4           ; an array of four 4-byte values`,
          explanation:
            "The names are historical: on the 16-bit 8086 a *word* was two bytes, and the term stuck even though the registers are now four times wider. So on x86-64, `dq` — quad word, eight bytes — is the one that matches a full register. There is no type checking here whatsoever: `dq` reserves eight bytes and it is entirely up to you to remember what they mean.",
        },
      ],
      pitfalls: [
        {
          title: "A label is an address, not a value",
          body: "`mov rsi, msg` puts the *address* of the string into `rsi`. In NASM, `mov rsi, [msg]` — with brackets — would instead load eight bytes of the string's contents. Brackets mean dereference. Getting this backwards is the single most common beginner mistake in NASM, and because there are no types, the assembler will not stop you.",
        },
      ],
    },
    {
      id: "syscalls",
      heading: "System calls: asking the kernel to do something",
      body: [
        "A program cannot write to the screen. It cannot open a file, allocate memory from the operating system, or exit. Those are all privileged operations, and user code is not allowed to touch hardware directly — that is the whole point of having an operating system.",
        "What it can do is **make a system call**: put a request in registers and execute the `syscall` instruction, which switches the processor into kernel mode and transfers control to the kernel. The kernel does the work, puts a result in `rax`, and returns.",
        "On x86-64 Linux the convention is fixed: **`rax` holds the syscall number**, and arguments go in **`rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9`** in that order. The return value comes back in `rax`, with negative values indicating errors.",
        "Now the program reads as English. `write` is call number 1 and takes three arguments — file descriptor, buffer, length — so `rdi` gets 1 (standard output), `rsi` gets the address of the string, `rdx` gets its length, and `syscall` performs it. `exit` is call number 60 and takes one argument, the status code.",
      ],
      examples: [
        {
          id: "syscall-annotated",
          title: "The two calls, with the convention made explicit",
          lang: "asm",
          code: `; write(fd = 1, buf = msg, count = msglen)
    mov rax, 1              ; syscall number: write
    mov rdi, 1              ; arg 1: file descriptor 1 = stdout
    mov rsi, msg            ; arg 2: address of the bytes
    mov rdx, msglen         ; arg 3: how many bytes
    syscall                 ; rax now holds the number of bytes written

; exit(status = 0)
    mov rax, 60             ; syscall number: exit
    xor edi, edi            ; arg 1: 0. \`xor reg, reg\` is the idiomatic zero
    syscall                 ; does not return`,
          explanation:
            "`xor edi, edi` sets `edi` to zero, because anything XORed with itself is zero. It is used instead of `mov edi, 0` because it is a shorter encoding — two bytes against five — and, on x86-64, writing to a 32-bit register automatically zeroes the upper 32 bits, so this clears the whole of `rdi`. You will see this idiom constantly in compiler output.",
        },
      ],
      pitfalls: [
        {
          title: "There is no falling off the end of a program",
          body: "Delete the last two instructions and the program does not exit cleanly — it carries on executing whatever bytes happen to follow in memory and dies with a segmentation fault. In C, returning from `main` works because the C runtime called it and calls `exit` afterwards. Linked with `ld` and no runtime, `_start` was jumped to by the kernel and there is nowhere to return to. **The exit syscall is not optional.**",
        },
      ],
    },
    {
      id: "reading-back",
      heading: "What the assembler made of it",
      body: [
        "Assembling and disassembling the result closes the loop, and there is one surprise in it worth noticing on day one.",
      ],
      examples: [
        {
          id: "objdump-hello",
          title: "The program, disassembled from its own binary",
          lang: "bash",
          code: `nasm -f elf64 hello.asm -o hello.o
ld hello.o -o hello
objdump -d -M intel hello`,
          output: `Disassembly of section .text:

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
            "Three columns: address, the actual bytes, and the disassembly. `msg` turned out to live at `0x402000`, and `msglen` became `0x15` — 21 in decimal, exactly as computed. The labels are gone; they were never in the binary.",
        },
      ],
      pitfalls: [
        {
          title: "You wrote `mov rax, 1` and got `mov eax, 1`",
          body: "NASM noticed that 1 fits in 32 bits and emitted the shorter 32-bit form, five bytes instead of ten. This is safe precisely because of the rule mentioned above: on x86-64, writing to a 32-bit register zeroes the upper half, so `mov eax, 1` leaves `rax` holding exactly 1. Contrast the third instruction, where the address `0x402000` needed the full 64-bit `movabs` form. The assembler makes encoding choices for you; the disassembly is what actually ran.",
        },
      ],
    },
  ],
  takeaways: [
    "An assembly line is `label: mnemonic operands ; comment`, and every part is optional",
    "Intel syntax puts the destination first — read `mov rax, 1` as an assignment arrow pointing left",
    "Directives (`section`, `global`, `db`, `equ`) instruct the assembler; instructions instruct the CPU",
    "`.text` is executable but not writable and `.data` is writable but not executable — hardware-enforced, and a major exploit mitigation",
    "`db` places bytes; a label is the *address* of those bytes, and brackets mean dereference",
    "`equ $ - msg` computes a length at assembly time, so the machine code contains a literal constant",
    "A syscall passes its number in rax and arguments in rdi, rsi, rdx, r10, r8, r9; write is 1 and exit is 60",
    "Without a C runtime there is nothing to return to, so the exit syscall is mandatory",
  ],
  status: "available",
};
