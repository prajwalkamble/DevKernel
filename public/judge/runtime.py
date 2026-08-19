# The Python side of the practice judge.
#
# Two halves, split on the marker below. The preamble runs first, into the same
# namespace your solution will land in, so that a signature mentioning TreeNode
# resolves. The driver runs last, after your code, and its final expression is
# the JSON string the worker sends back.
#
# It never compares anything. It reports what your function returned or what it
# raised, and the browser decides which of those is correct — one comparison,
# shared with JavaScript, TypeScript and the generated Java harness.


class TreeNode:
    """LeetCode's binary tree node, spelled the way LeetCode spells it."""

    __slots__ = ("val", "left", "right")

    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return "TreeNode({})".format(self.val)


# --- DRIVER ---
import json as _dk_json
import sys as _dk_sys
import traceback as _dk_traceback

_dk_spec = _dk_json.loads(_dk_config)


def _dk_build_tree(level):
    """Rebuilds a tree from a level-order list where None is a missing child."""
    if not level or level[0] is None:
        return None
    root = TreeNode(level[0])
    queue = [root]
    head = 0
    index = 1
    while head < len(queue) and index < len(level):
        node = queue[head]
        head += 1
        if index < len(level):
            value = level[index]
            index += 1
            if value is not None:
                node.left = TreeNode(value)
                queue.append(node.left)
        if index < len(level):
            value = level[index]
            index += 1
            if value is not None:
                node.right = TreeNode(value)
                queue.append(node.right)
    return root


def _dk_encode_tree(node):
    """The inverse: a tree back to the level-order list, trailing Nones trimmed."""
    if node is None:
        return []
    out = []
    queue = [node]
    head = 0
    while head < len(queue):
        current = queue[head]
        head += 1
        if current is None:
            out.append(None)
            continue
        out.append(current.val)
        queue.append(current.left)
        queue.append(current.right)
    while out and out[-1] is None:
        out.pop()
    return out


def _dk_encode(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple)):
        return [_dk_encode(item) for item in value]
    raise TypeError(
        "the judge compares numbers, strings, booleans and lists of those, but "
        "your function returned a " + type(value).__name__
    )


def _dk_error():
    """The traceback with the driver's own frame removed, so it points at your code."""
    kind, value, tb = _dk_sys.exc_info()
    if tb is not None:
        tb = tb.tb_next
    return "".join(_dk_traceback.format_exception(kind, value, tb)).strip()


def _dk_snake(name):
    """twoSum -> two_sum, the name this track's own Python solutions use."""
    out = []
    for char in name:
        if char.isupper():
            out.append("_")
            out.append(char.lower())
        else:
            out.append(char)
    return "".join(out)


def _dk_resolve(entry):
    """
    Finds your solution however you chose to write it.

    Three shapes are accepted, because all three are what people actually type:
    a top-level function under LeetCode's camelCase name, the same function
    under this track's snake_case name, and a `Solution` class holding the
    method — which is what you get from pasting the solutions on this page.
    """
    names = (entry, _dk_snake(entry))
    scope = globals()

    for name in names:
        candidate = scope.get(name)
        if callable(candidate) and not isinstance(candidate, type):
            return candidate

    holder = scope.get("Solution")
    if isinstance(holder, type):
        instance = holder()
        for name in names:
            method = getattr(instance, name, None)
            if callable(method):
                return method

    return None


def _dk_run():
    # Your code was executed into this same namespace, so this is a plain
    # lookup — and it fails, usefully, when the name is misspelled or the
    # function is buried inside another one.
    function = _dk_resolve(_dk_spec["entry"])
    if not callable(function):
        return {"status": "no-entry"}

    kinds = _dk_spec["params"]
    returns = _dk_spec["returns"]
    results = []

    def record(result):
        results.append(result)
        _dk_report(result)

    for index, args in enumerate(_dk_spec["cases"]):
        try:
            call = [
                _dk_build_tree(arg) if kind == "tree" else arg
                for arg, kind in zip(args, kinds)
            ]
            value = function(*call)
        except Exception:
            record({"index": index, "error": _dk_error()})
            continue

        # Encoding is its own step so that "your code raised" and "your code
        # returned something uncomparable" do not arrive looking alike — the
        # second one gets the plain sentence, with no traceback into this file.
        try:
            encoded = _dk_encode_tree(value) if returns == "tree" else _dk_encode(value)
        except TypeError as error:
            record({"index": index, "error": "TypeError: {}".format(error)})
            continue

        record({"index": index, "value": encoded})

    return {"status": "ran", "cases": results}


def _dk_report(result):
    """
    Hands one finished case to the page immediately.

    Worth the round trip: if the next case never returns, this is the difference
    between "timed out" and "the first four passed and then it hung on n = 35",
    and the second one is the whole lesson.
    """
    emit = globals().get("_dk_emit")
    if emit is not None:
        emit(_dk_json.dumps(result))


_dk_json.dumps(_dk_run())
