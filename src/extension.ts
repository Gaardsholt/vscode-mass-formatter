// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import ignore from "ignore";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "format-all" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "format-all.formatAllFiles",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showInformationMessage("No workspace folder found.");
        return;
      }
      const workspaceFolder = workspaceFolders[0];

      // Find all .gitignore files in the workspace
      const gitignoreUris = await vscode.workspace.findFiles("**/.gitignore");
      // Map: directory path -> .gitignore content
      const gitignoreMap = new Map<string, string>();
      for (const uri of gitignoreUris) {
        try {
          const content = await vscode.workspace.fs.readFile(uri);
          gitignoreMap.set(path.dirname(uri.fsPath), content.toString());
        } catch (e) {
          // ignore read errors
        }
      }

      // Get ignored globs from settings
      const ignoreGlobs =
        vscode.workspace
          .getConfiguration("format-all")
          .get<string[]>("ignore") || [];

      // Find all files in the workspace
      const allFiles = await vscode.workspace.findFiles("**/*");

      // Helper: collect all .gitignore rules for a file, from its dir up to workspace root
      function getIgnoreForFile(filePath: string): ReturnType<typeof ignore> {
        const ig = ignore();
        let dir = path.dirname(filePath);
        const root = workspaceFolder.uri.fsPath;
        const stack: string[] = [];
        // Walk up from file's dir to workspace root, collecting .gitignore contents
        while (dir.startsWith(root)) {
          if (gitignoreMap.has(dir)) {
            stack.push(gitignoreMap.get(dir)!);
          }
          if (dir === root) {
            break;
          }
          dir = path.dirname(dir);
        }
        // Add rules from root to leaf
        for (let i = stack.length - 1; i >= 0; i--) {
          ig.add(stack[i]);
        }
        ig.add(ignoreGlobs);
        return ig;
      }

      const filesToFormat = allFiles.filter((file) => {
        const relativePath = path.relative(
          workspaceFolder.uri.fsPath,
          file.fsPath
        );
        const ig = getIgnoreForFile(file.fsPath);
        return !ig.ignores(relativePath);
      });

      if (filesToFormat.length === 0) {
        vscode.window.showInformationMessage(
          "No files to format (or all are ignored by git)."
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Formatting all files...",
          cancellable: true,
        },
        async (progress, token) => {
          for (let i = 0; i < filesToFormat.length; i++) {
            if (token.isCancellationRequested) {
              break;
            }

            const file = filesToFormat[i];
            progress.report({
              message: `Formatting ${vscode.workspace.asRelativePath(file)}`,
              increment: 100 / filesToFormat.length,
            });

            try {
              const document = await vscode.workspace.openTextDocument(file);
              const edits = await vscode.commands.executeCommand<
                vscode.TextEdit[]
              >("vscode.executeFormatDocumentProvider", document.uri);

              if (edits) {
                const workEdits = new vscode.WorkspaceEdit();
                workEdits.set(document.uri, edits);
                await vscode.workspace.applyEdit(workEdits);
              }

              if (document.isDirty) {
                await document.save();
              }
            } catch (e) {
              console.error(`Could not format ${file.fsPath}`, e);
            }
          }
        }
      );

      vscode.window.showInformationMessage("Finished formatting all files.");
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
