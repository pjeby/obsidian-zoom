const jestExpect = global.expect;

function stateToString(state) {
  const lines = state.value.split("\n");

  const sels = state.selections.reduce((acc, sel) => {
    acc.set(sel.anchor, "anchor");
    acc.set(sel.head, "head");
    return acc;
  }, new Map());

  const folds = state.folds.reduce((acc, sel) => {
    acc.set(sel.from, "from");
    acc.set(sel.to, "to");
    return acc;
  }, new Map());

  let res = "";
  let totalC = 0;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];

    for (let c = 0; c <= line.length; c++) {
      if (sels.has(totalC)) {
        res += "|";
      }
      if (folds.has(totalC)) {
        res += folds.get(totalC) === "from" ? ">" : "<";
      }
      if (c < line.length) {
        res += line[c];
        totalC++;
      }
    }

    if (state.hidden.includes(l)) {
      res += " #hidden";
    }

    res += "\n";
    totalC++;
  }

  return res;
}

jestExpect.extend({
  async toEqualEditorState(receivedState, expectedState) {
    const options = {
      comment: "Obsidian editor state equality",
      isNot: this.isNot,
      promise: this.promise,
    };

    expectedState = await parseState(expectedState);

    const received = stateToString(receivedState);
    const expected = stateToString(expectedState);

    const pass = received === expected;

    const message = pass
      ? () =>
          this.utils.matcherHint(
            "toEqualEditorState",
            undefined,
            undefined,
            options
          ) +
          "\n\n" +
          `Expected: not ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(received)}`
      : () => {
          const diffString = this.utils.diff(expected, received, {
            expand: this.expand,
          });
          return (
            this.utils.matcherHint(
              "toEqualEditorState",
              undefined,
              undefined,
              options
            ) +
            "\n\n" +
            (diffString && diffString.includes("- Expect")
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}`)
          );
        };

    return {
      pass,
      message,
    };
  },
});
