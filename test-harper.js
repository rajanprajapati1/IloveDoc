const { WorkerLinter, LocalLinter } = require('harper.js');

async function test() {
  try {
    const linter = new LocalLinter();
    await linter.setup();
    const text = "This are a test of the grammar chekcing.";
    const lints = await linter.lint(text);
    console.log("Lints:", lints);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
