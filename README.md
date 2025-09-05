# Format All

This Visual Studio Code extension allows you to format all files in your workspace with a single command, respecting your `.gitignore` files and custom ignore settings.

## Features

- **Format all files**: Run a single command to format every file in your workspace that isn't ignored.
- **Respects `.gitignore`**: Automatically ignores files and directories listed in your `.gitignore` files. It traverses the directory structure and applies the correct `.gitignore` rules for each file.
- **Custom Ignore Patterns**: Use the `format-all.ignore` setting to add more glob patterns for files you want to exclude from formatting.
- **Progress Indicator**: A notification shows the progress of the formatting operation, which can be cancelled at any time.

## How it Works

When you run the "Format All Files in Workspace" command, the extension will:

1.  Scan your entire workspace for files.
2.  Find all `.gitignore` files in your workspace and use them to build a list of files to ignore.
3.  Read the `format-all.ignore` configuration for any additional files to ignore.
4.  For every file that is not ignored, it will:
    a. Open the file in the editor.
    b. Execute the standard `editor.action.formatDocument` command, which uses your configured default formatter for that file type.
    c. Save the file.

## Commands

This extension contributes the following command to the Command Palette:

- `Format All Files in Workspace`: Formats all files in the current workspace.

## Extension Settings

This extension contributes the following settings:

- `format-all.ignore`: An array of glob patterns to ignore when formatting files.

Example `settings.json`:

```json
{
  "format-all.ignore": ["**/node_modules/**", "**/*.min.js", "dist/**"]
}
```
