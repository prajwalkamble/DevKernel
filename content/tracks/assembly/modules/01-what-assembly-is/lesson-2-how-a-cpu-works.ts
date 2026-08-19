import type { Lesson } from "@/content/types";

export const howCpuWorksLesson: Lesson = {
  id: "asm-how-cpu-works",
  slug: "how-a-cpu-executes-a-program",
  moduleSlug: "what-assembly-is",
  title: "How a CPU Actually Executes a Program",
  summary:
    "The machine model everything in this track rests on: the stored-program computer, the fetch-decode-execute cycle, what registers are and why there are so few, and the memory hierarchy that explains most of modern performance.",
  estimatedMinutes: 30,
  objectives: [
    "Describe the stored-program model and why code and data share one memory",
    "Walk through the fetch-decode-execute cycle for a single instruction",
    "Explain what a register is and why registers are so much faster than memory",
    "Say what the instruction pointer and the flags register do",
    "Explain the memory hierarchy and why a cache miss costs hundreds of cycles",
    "Understand why 'the CPU runs one instruction at a time' is a useful lie",
  ],
  sections: [
    {
      id: "stored-program",
      heading: "The stored-program computer",
      body: [
        "The organising idea, from the 1940s and unchanged since: **a program is data, stored in the same memory as everything else.** The CPU reads instructions out of memory exactly the way it reads numbers, because there is no difference — they are all bytes at addresses.",
        "That is why a compiler can write a program to a file, why a debugger can modify an instruction in a running process, and why a buffer overflow that overwrites the wrong bytes can end up being executed. The machine does not fundamentally distinguish code from data; it distinguishes only the bytes it is currently fetching from the bytes it is not.",
        "Memory itself is simpler than most people picture. It is one enormous numbered array of bytes. An **address** is an index into that array. On x86-64 an address is 64 bits wide, though current processors only use the low 48 — enough for 256 terabytes, which has not yet been a constraint.",
        "There is no type information in memory. Eight bytes at some address are eight bytes. Whether they mean a 64-bit integer, two 32-bit floats, a pointer, or the encoding of three instructions depends entirely on what the program does with them. **In assembly, giving those bytes meaning is your job**, and it is the largest single difference from every high-level language you have used.",
      ],
    },
    {
      id: "cycle",
      heading: "The fetch-decode-execute cycle",
      body: [
        "At its heart the CPU does one thing, forever, at a few billion times per second.",
        "**Fetch.** Read the bytes at the address in the instruction pointer register — on x86-64 that register is called `rip`. Instructions on x86-64 are variable length, from one byte to fifteen, so part of fetching is working out where this one ends.",
        "**Decode.** Work out what those bytes mean: which operation, which registers, what constant, what memory address to compute.",
        "**Execute.** Do it. Add the numbers, move the bytes, compare the values, jump somewhere else.",
        "**Advance.** Move `rip` past the instruction just executed — unless the instruction itself changed `rip`, which is exactly what a jump or a call is. There is no other mechanism for control flow. An `if` statement, a loop, a function call and a `return` are all, underneath, conditionally or unconditionally writing a new value into `rip`.",
        "That last point is worth sitting with, because it is the whole of control flow in one sentence: **the only thing that decides what runs next is the value in the instruction pointer.**",
      ],
      examples: [
        {
          id: "cycle-trace",
          title: "Three instructions, traced by hand",
          lang: "asm",
          code: `; Suppose rip = 0x401000 and rax = 5.
;
; 0x401000:  48 83 c0 03      add rax, 3
; 0x401004:  48 89 c3         mov rbx, rax
; 0x401007:  48 ff c3         inc rbx

; Step 1
;   fetch   : read 4 bytes at 0x401000
;   decode  : "add the constant 3 to rax"
;   execute : rax = 5 + 3 = 8
;   advance : rip = 0x401004

; Step 2
;   fetch   : read 3 bytes at 0x401004
;   decode  : "copy rax into rbx"
;   execute : rbx = 8
;   advance : rip = 0x401007

; Step 3
;   fetch   : read 3 bytes at 0x401007
;   decode  : "add one to rbx"
;   execute : rbx = 9
;   advance : rip = 0x40100a`,
          explanation:
            "Notice that the addresses are not evenly spaced: the first instruction is four bytes and the next two are three each. That is x86-64's variable-length encoding, and it is why you cannot jump into the middle of an instruction and expect anything sensible — the CPU would decode whatever bytes it landed on as the start of a new instruction.",
        },
      ],
    },
    {
      id: "registers",
      heading: "Registers: the only memory the CPU is fast at",
      body: [
        "A **register** is a storage location physically inside the processor core. x86-64 gives you sixteen general purpose registers, each 64 bits wide: `rax`, `rbx`, `rcx`, `rdx`, `rsi`, `rdi`, `rbp`, `rsp`, and `r8` through `r15`.",
        "Sixteen sounds absurdly few, and it is the first thing that feels constraining about assembly. The reason is speed. A register is a handful of transistors a fraction of a millimetre from the arithmetic unit; reading one takes essentially no time at all. Adding more would mean more bits in every instruction to name them, and a larger, slower register file. Sixteen is a compromise that has held up well.",
        "Two of those sixteen have jobs assigned by hardware and convention rather than by you. **`rsp`** is the stack pointer, and `push`, `pop`, `call` and `ret` all modify it implicitly. **`rbp`** is conventionally the frame pointer. Both get a full module later; for now, know that they are spoken for.",
        "Two more registers are not general purpose at all. **`rip`** is the instruction pointer, and you cannot write to it directly — you change it by jumping. **`rflags`** holds status bits set as a side effect of arithmetic: was the result zero, was it negative, did it carry, did it overflow. Every conditional jump in every program reads those bits. Module 5 covers them properly.",
        "There are also sixteen `xmm` registers, 128 bits each, for floating point and vector work — module 12.",
      ],
      pitfalls: [
        {
          title: "Registers are not variables",
          body: "A high-level variable has a name, a type and a lifetime, and the compiler guarantees nothing else is using it. A register is a shared physical resource: `rax` is the same `rax` everywhere in the program. Keeping track of what is currently in each register is the actual work of writing assembly, and it is why the calling conventions in module 8 exist — they are the agreement about who is allowed to clobber what.",
        },
      ],
    },
    {
      id: "memory-hierarchy",
      heading: "The memory hierarchy, and why it explains most performance",
      body: [
        "Registers are fast and there are sixteen of them. Main memory is enormous and slow. Everything in between is cache, and understanding the gap explains more about real-world performance than instruction counting ever will.",
        "Rough figures for a modern desktop processor, in **cycles** — the unit that matters, because a 3 GHz core executes roughly three cycles per nanosecond:",
        "**Register**: under 1 cycle. **L1 cache** (~32-64 KB per core): about 4 cycles. **L2 cache** (~512 KB-2 MB): about 14 cycles. **L3 cache** (~8-64 MB, shared): about 40 cycles. **Main memory (DRAM)**: 200-400 cycles. **NVMe SSD**: around 200,000 cycles.",
        "Read the last two again. **A single main-memory access costs as much as a few hundred arithmetic instructions.** A program that does very little work but touches memory unpredictably will lose badly to one that does far more work on data already in cache.",
        "The hardware helps in two ways, and both have consequences you can exploit. Memory is moved in **cache lines** of 64 bytes, never single bytes — so reading one element of an array brings its neighbours along for free, and sequential access is dramatically faster than random access. And the **prefetcher** watches your access pattern; if you walk memory in a predictable stride it fetches ahead of you, and the memory latency disappears entirely.",
        "This is why data layout beats clever code, why an array of structs and a struct of arrays perform differently, and why a linked list traversal can be an order of magnitude slower than an array scan holding the same data. Module 14 measures all of this properly.",
      ],
    },
    {
      id: "useful-lie",
      heading: "The useful lie: one instruction at a time",
      body: [
        "Everything above described the CPU as executing one instruction, finishing it, and moving to the next. That model is what the architecture *guarantees you will observe*, and it is the right model for writing correct code. It is not what the hardware does.",
        "A modern x86-64 core is **pipelined**: while one instruction is executing, the next is being decoded and the one after that is being fetched, so several are in flight at once. It is **superscalar**: it has multiple execution units and can genuinely complete several instructions in the same cycle. It executes **out of order**, reordering instructions whose results are not yet needed, and it **speculates** past branches — guessing which way a conditional will go and executing ahead on that assumption, discarding the work if it guessed wrong.",
        "None of this changes what your program computes. The hardware maintains the illusion of sequential execution, and correctness never depends on knowing any of it.",
        "But it changes *timing*, and it explains things that otherwise look impossible: why a mispredicted branch costs 15-20 cycles of thrown-away work, why two sequences with identical instruction counts run at different speeds, why a dependency chain — each instruction needing the previous one's result — is slower than independent work that could overlap.",
        "For now: write assembly against the simple model, and remember that when you get to measuring performance in module 14, the simple model will not be enough to explain your numbers.",
      ],
      pitfalls: [
        {
          title: "Counting instructions is not measuring performance",
          body: "It is tempting to assume fewer instructions means faster code. It frequently does not. Two instructions that miss cache will lose to twenty that hit it, and a tight dependency chain will lose to a longer sequence the processor can overlap. Measure with `perf`, never by counting lines.",
        },
      ],
    },
  ],
  takeaways: [
    "Code and data live in the same memory, which is why programs can be written to files, modified by debuggers, and hijacked by overflows",
    "Memory is an array of untyped bytes; giving them meaning is the programmer's job in assembly",
    "The CPU loops forever over fetch, decode, execute, advance — and control flow is nothing more than writing a new value into rip",
    "x86-64 has sixteen general purpose registers; rsp and rbp are spoken for, rip and rflags are not general purpose at all",
    "A main-memory access costs 200-400 cycles against under 1 for a register — the memory hierarchy explains most real performance",
    "Cache lines are 64 bytes and the prefetcher rewards predictable access, which is why data layout beats clever code",
    "Pipelining, out-of-order execution and speculation preserve the illusion of sequential execution but change timing completely",
  ],
  status: "available",
};
