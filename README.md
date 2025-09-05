# Mass Formatter

This Visual Studio Code extension allows you to format all files in your workspace with a single command, respecting your `.gitignore` files and custom ignore settings.

## Features

- **Format all files**: Run a single command to format every file in your workspace that isn't ignored.
- **Respects `.gitignore`**: Automatically ignores files and directories listed in your `.gitignore` files. It traverses the directory structure and applies the correct `.gitignore` rules for each file.
- **Custom Ignore Patterns**: Use the `mass-formatter.ignore` setting to add more glob patterns for files you want to exclude from formatting.
- **Progress Indicator**: A notification shows the progress of the formatting operation, which can be cancelled at any time.

## How it Works

When you run the "Mass Formatter: Format All Files" command, the extension will:

1.  Scan your entire workspace for files.
2.  Find all `.gitignore` files in your workspace and use them to build a list of files to ignore.
3.  Read the `mass-formatter.ignore` configuration for any additional files to ignore.
4.  For every file that is not ignored, it will:
    a. Open the file's content in memory.
    b. Programmatically request formatting edits from the configured default formatter for that file type.
    c. Apply the edits and save the file if it was changed.

## Commands

This extension contributes the following command to the Command Palette:

- `Mass Formatter: Format All Files`: Formats all files in the current workspace.

## Extension Settings

This extension contributes the following settings:

- `mass-formatter.ignore`: An array of glob patterns to ignore when formatting files.

Example `settings.json`:

```json
{
  "mass-formatter.ignore": ["**/node_modules/**", "**/*.min.js", "dist/**"]
}
```
