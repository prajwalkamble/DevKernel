import type { Lesson } from "@/content/types";

export const compositeTypesLesson: Lesson = {
  id: "go-composite-types",
  slug: "arrays-slices-maps-and-structs",
  moduleSlug: "foundations",
  title: "Arrays, Slices, Maps & Structs",
  summary:
    "The four composite types you will use constantly — and the distinction between an array and a slice, which is the one piece of Go's data model that genuinely has to be understood rather than memorised.",
  estimatedMinutes: 40,
  objectives: [
    "State the difference between an array and a slice, and why it matters",
    "Create slices with literals and with make, and grow them with append",
    "Explain length against capacity, and what a re-slice shares",
    "Create and use maps, including the comma-ok read",
    "Define structs, and know when Go copies them",
  ],
  sections: [
    {
      id: "arrays-vs-slices",
      heading: "Arrays are fixed; slices are what you actually use",
      body: [
        "An **array** has its length baked into its type. `[3]int` and `[4]int` are different types, and a function taking `[3]int` will not accept `[4]int`. Arrays are also **values**: assigning one copies every element.",
        "A **slice** is a view onto an array. Written `[]int`, with no length in the type. It has a length, a capacity, and a pointer to the underlying storage — which means passing a slice to a function is cheap and the function can modify what it sees.",
        "In practice you will write `[]T` almost every time. Arrays show up when a fixed size is meaningful — a 26-element frequency table for the lowercase alphabet, say, or a fixed-size buffer.",
      ],
      examples: [
        {
          id: "composite",
          title: "All four, in one program",
          lang: "go",
          code: `package main

import "fmt"

type Point struct {
	X int
	Y int
}

func main() {
	var arr [3]int
	arr[1] = 5
	fmt.Println("array:", arr, len(arr))

	sl := []int{1, 2, 3}
	sl = append(sl, 4)
	fmt.Println("slice:", sl, "len", len(sl), "cap", cap(sl))

	made := make([]int, 2, 8)
	fmt.Println("made:", made, len(made), cap(made))

	sub := sl[1:3]
	fmt.Println("sub:", sub)

	m := map[string]int{"a": 1, "b": 2}
	m["c"] = 3
	fmt.Println("map:", m, len(m))
	v, ok := m["z"]
	fmt.Println("missing:", v, ok)
	delete(m, "a")
	fmt.Println("after delete:", m)

	p := Point{X: 1, Y: 2}
	q := Point{3, 4}
	var zeroP Point
	fmt.Println(p, q, zeroP)
	fmt.Printf("%v %+v\\n", p, p)
}`,
          output: `array: [0 5 0] 3
slice: [1 2 3 4] len 4 cap 6
made: [0 0] 2 8
sub: [2 3]
map: map[a:1 b:2 c:3] 3
missing: 0 false
after delete: map[b:2 c:3]
{1 2} {3 4} {0 0}
{1 2} {X:1 Y:2}`,
          explanation:
            "Look at the capacity after `append`: the slice held three elements, appending a fourth needed more room, so Go allocated a bigger array — and it allocated room for six rather than four, because growing by doubling keeps repeated appends amortised at constant time. `make([]int, 2, 8)` asks for length two and capacity eight up front, which is how you avoid repeated reallocation when you know roughly how much you will need.",
        },
      ],
    },
    {
      id: "length-capacity",
      heading: "Length, capacity, and the aliasing trap",
      body: [
        "`len(s)` is how many elements the slice currently presents. `cap(s)` is how many the underlying array can hold before it must be replaced. `append` writes into the spare capacity when there is some, and allocates a new, larger array when there is not.",
        "That is the whole mechanism, and it produces the one behaviour that surprises people: **two slices can share storage**. `sub := sl[1:3]` does not copy — it points into the same array. Writing to `sub[0]` changes `sl[1]`.",
      ],
      pitfalls: [
        {
          title: "Whether append aliases is unspecified — never rely on either answer",
          body: "`b := append(a, x)` may write into `a`'s spare capacity, in which case `a` and `b` share storage, or may allocate, in which case they do not. Which one happens depends on capacity, so the same line can behave differently as your input grows. If you need an independent copy, say so: `b := append([]int{}, a...)`, or use the built-in `copy`.",
        },
        {
          title: "Appending inside a loop to a saved slice",
          body: "In backtracking problems it is tempting to write `results = append(results, current)`. Because `current` is a slice, every entry in `results` ends up pointing at the same storage, and they all show the final state. Append a copy instead.",
        },
      ],
    },
    {
      id: "maps",
      heading: "Maps, and the comma-ok read",
      body: [
        "A map is Go's hash table, written `map[K]V`. Keys must be comparable — numbers, strings, booleans, pointers and structs of those; slices and other maps cannot be keys.",
        "Reading a key that is not present is *not* an error: you get the zero value of the element type. That is convenient — `counts[word]++` works on a fresh map without any check — but it means a zero result is ambiguous between \"stored as zero\" and \"not there\". The **comma-ok** form resolves it: `v, ok := m[k]` gives you the value and a boolean saying whether it existed.",
      ],
      pitfalls: [
        {
          title: "Map iteration order is deliberately randomised",
          body: "`range` over a map visits keys in a different order every run — the runtime randomises it on purpose, specifically so that nobody writes code depending on the order. If you need a stable order, collect the keys into a slice and sort it. Note that *printing* a map with `fmt` does sort the keys, so print output is reproducible even though iteration is not.",
        },
        {
          title: "Writing to a nil map panics",
          body: "`var m map[string]int` gives you a nil map. Reading from it works and yields zeros; writing to it panics with `assignment to entry in nil map`. Always create the map first with `make(map[string]int)` or `map[string]int{}`.",
        },
      ],
    },
    {
      id: "structs",
      heading: "Structs",
      body: [
        "A struct groups named fields. There are no classes in Go and no inheritance; a struct with methods attached is as close as the language gets to an object, and composition is how you build bigger things out of smaller ones.",
        "Structs are **values**. Assigning one copies it, and passing one to a function copies it — so a function that modifies its struct parameter is modifying a copy, and the caller sees nothing. Use a pointer receiver or a pointer parameter when you want mutation to be visible.",
        "Two printing verbs are worth knowing immediately: `%v` gives `{1 2}`, and `%+v` gives `{X:1 Y:2}`. The second one is what you want when debugging anything with more than two fields.",
      ],
    },
  ],
  takeaways: [
    "`[3]int` and `[4]int` are different types; `[]int` is the one you will use",
    "A slice is a view: length, capacity, and a pointer to shared storage",
    "`append` grows by doubling, which is why repeated appends stay cheap",
    "Whether `append` aliases its input is unspecified — copy explicitly when it matters",
    "A missing map key reads as the zero value; use `v, ok := m[k]` to tell them apart",
    "Map iteration order is randomised on purpose; sort the keys if you need order",
    "Structs are copied on assignment and on being passed to a function",
  ],
  status: "available",
};
