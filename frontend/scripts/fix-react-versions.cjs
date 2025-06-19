const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Check if we have multiple versions of React
try {
  console.log("Checking for multiple versions of React...")
  const npmLs = execSync("npm ls react").toString()

  if (npmLs.includes("deduped")) {
    console.log("Multiple versions of React detected. Fixing...")

    // Force reinstall of React and React DOM
    console.log("Reinstalling React and React DOM...")
    execSync("npm uninstall react react-dom", { stdio: "inherit" })
    execSync("npm install react@18.2.0 react-dom@18.2.0", { stdio: "inherit" })

    console.log("React versions fixed!")
  } else {
    console.log("React versions are consistent.")
  }
} catch (error) {
  console.error("Error checking React versions:", error.message)
}

// Create a simple React test file to verify imports
const testFile = path.join(__dirname, "test-react.cjs") // Changed .js to .cjs
fs.writeFileSync(
  testFile,
  `
const React = require('react');
console.log('React version:', React.version);
console.log('useState available:', typeof React.useState === 'function');
`,
)

try {
  console.log("Testing React imports...")
  const output = execSync(`node ${testFile}`).toString() // testFile now has .cjs
  console.log(output)
  fs.unlinkSync(testFile)
} catch (error) {
  console.error("Error testing React:", error.message)
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile)
  }
}
