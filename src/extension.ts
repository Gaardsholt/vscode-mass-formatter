// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import ignore from "ignore";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "format-all-files.formatAllFiles",
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
          .getConfiguration("format-all-files")
          .get<string[]>("ignore") || [];

      // Cache for ignore instances
      const ignoreCache = new Map<string, ReturnType<typeof ignore>>();

      // Find all files in the workspace
      const allFiles = await vscode.workspace.findFiles("**/*");

      // Helper: get ignore rules for a directory, using cache
      function getIgnoreForDir(dir: string): ReturnType<typeof ignore> {
        if (ignoreCache.has(dir)) {
          return ignoreCache.get(dir)!;
        }

        const root = workspaceFolder.uri.fsPath;
        let ig: ReturnType<typeof ignore>;

        if (dir === root) {
          ig = ignore();
          ig.add(ignoreGlobs);
        } else {
          const parentDir = path.dirname(dir);
          const parentIg = getIgnoreForDir(parentDir);
          // Create a new ignore instance with the parent's rules
          const parentRules = (parentIg as any)._rules.map(
            (rule: any) => rule.origin
          );
          ig = ignore().add(parentRules);
        }

        if (gitignoreMap.has(dir)) {
          ig.add(gitignoreMap.get(dir)!);
        }

        ignoreCache.set(dir, ig);
        return ig;
      }

      const filesToFormat = allFiles.filter((file) => {
        const relativePath = path.relative(
          workspaceFolder.uri.fsPath,
          file.fsPath
        );
        const dir = path.dirname(file.fsPath);
        const ig = getIgnoreForDir(dir);
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
              vscode.window.showErrorMessage(
                `Could not format ${vscode.workspace.asRelativePath(
                  file
                )}: ${e}`
              );
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
