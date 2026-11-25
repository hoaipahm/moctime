self.onmessage = (event: MessageEvent<{ input: string; pattern: string }>) => {
  try {
    const matches =
      event.data.input.match(new RegExp(event.data.pattern, "gu")) ?? [];
    self.postMessage({
      result: JSON.stringify(matches.slice(0, 2000), null, 2),
    });
  } catch {
    self.postMessage({ error: true });
  }
};
