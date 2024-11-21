/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as path from 'path';
import { ActivityBar, BottomBarPanel, By, DebugToolbar, EditorView, error, ExtensionsViewItem, ExtensionsViewSection, InputBox, TextEditor, until, VSBrowser, WebDriver, Workbench } from 'vscode-extension-tester';
import * as fs from 'fs-extra';
import { DEBUGGER_ATTACHED_MESSAGE } from './variables';

/**
 * Open the extension page.
 * 
 * @param name Display name of the extension.
 * @param timeout Timeout in ms.
 * @returns Marketplace and ExtensionViewItem object tied with the extension.
 */
export async function openExtensionPage(driver: WebDriver, name: string, timeout: number): Promise<ExtensionsViewItem> {
    let item: ExtensionsViewItem;
    await driver.wait(async () => {
        try {
            const extensionsView = await (await new ActivityBar().getViewControl('Extensions'))?.openView();
            const marketplace = (await extensionsView?.getContent().getSection('Installed')) as ExtensionsViewSection;
            item = await marketplace.findItem(`@installed ${name}`) as ExtensionsViewItem;
            return true;
        } catch (e) {
            if (e instanceof error.StaleElementReferenceError) {
                return {
                    delay: 1000,
                    value: undefined
                };
            }
        }
    }, timeout, 'Page was not rendered');
    return item!;
}

/**
 * Remove content from folder.
 * 
 * @param folder Path to folder.
 */
export async function deleteFolderContents(folder: string): Promise<void> {
    try {
        await fs.emptyDir(folder);
    } catch (err) {
        throw new Error('Error while deleting folder content: ' + err);
    }
}

/**
 * Executes a command in the command prompt of the workbench.
 * 
 * @param command The command to execute.
 * @returns A Promise that resolves when the command is executed.
 * @throws An error if the command is not found in the command palette.
 */
export async function executeCommand(command: string): Promise<void> {
    const workbench = new Workbench();
    await workbench.openCommandPrompt();
    const input = await InputBox.create();
    await input.setText(`>${command}`);
    const quickpicks = await input.getQuickPicks();
    for (const quickpick of quickpicks) {
        if (await quickpick.getLabel() === `${command}`) {
            await quickpick.select();
            return;
        }
    }
    throw new Error(`Command '${command}' not found in the command palette`);
}

/**
 * Wait until editor is opened.
 * 
 * @param driver WebDriver.
 * @param title Title of editor - filename.
 * @param timeout Timeout for dynamic wait.
 */
export async function waitUntilEditorIsOpened(driver: WebDriver, title: string, timeout = 10000): Promise<void> {
	await driver.wait(async function () {
		return (await new EditorView().getOpenEditorTitles()).find(t => t === title);
	}, timeout);
}

/** Opens file in editor.
 * 
 * @param driver WebDriver.
 * @param folder Folder with file.
 * @param file Filename.
 * @returns Instance of Text Editor.
 */
export async function openFileInEditor(driver: WebDriver, folder: string, file: string): Promise<TextEditor | null> {
	await VSBrowser.instance.openResources(path.join(folder, file));
	await waitUntilEditorIsOpened(driver, file);
	return (await activateEditor(driver, file));
}


/**
* Switch to an editor tab with the given title.
* 
* @param title Title of editor to activate.
*/
export async function activateEditor(driver: WebDriver, title: string): Promise<TextEditor> {
    // workaround for https://issues.redhat.com/browse/FUSETOOLS2-2099
    let editor: TextEditor | null = null;
    await driver.wait(async function () {
        try {
            editor = await new EditorView().openEditor(title) as TextEditor;
            return true;
        } catch (err) {
            await driver.actions().click().perform();
            return false;
        }
    }, 10000, undefined, 500);
    throw new Error(`Couldn't activate editor with titlte '${title}'`);
}

/**
 * Checks if the terminal view has the specified texts in the given textArray.
 * 
 * @param driver The WebDriver instance to use.
 * @param textArray An array of strings representing the texts to search for in the terminal view.
 * @param interval (Optional) The interval in milliseconds to wait between checks. Default is 2000ms.
 * @param timeout (Optional) The timeout in milliseconds. Default is 60000ms.
 * @returns A Promise that resolves to a boolean indicating whether the terminal view has the texts or not.
 */
export async function waitUntilTerminalHasText(driver: WebDriver, textArray: string[], interval = 2000, timeout = 60000): Promise<void> {
    if(VSBrowser.instance.version > '1.86.2' && textArray.includes(DEBUGGER_ATTACHED_MESSAGE)) {
        // for newer VS Code versions, the Debug Bar has default floating position in collision with command palette
        // which leads to problems when trying to click on quick picks
        // solution is to move a Debug Bar a bit
        await moveDebugBar();
    }
    await driver.sleep(interval);
    await driver.wait(async function () {
        try {
            const terminal = await new BottomBarPanel().openTerminalView();
            const terminalText = await terminal.getText();
            for await (const text of textArray) {
                if (!(terminalText.includes(text))) {
                    return false;
                }
            }
            return true;
        } catch (err) {
            return false;
        }
    }, timeout, undefined, interval);
}

/**
 * Move Debug bar to avoid collision with opened command palette.
 * 
 * @param time delay to wait till debug bar is displayed.
 */
export async function moveDebugBar(time: number = 60_000): Promise<void> {
    const debugBar = await DebugToolbar.create(time);
    const dragArea = await debugBar.findElement(By.className('drag-area'));
    await dragArea.getDriver().actions().dragAndDrop(dragArea, { x: 150, y: 0}).perform();
}

/**
 * Click on 'Disconnect' button in debug bar
 * 
 * @param driver The WebDriver instance to use.
 */
export async function disconnectDebugger(driver: WebDriver, interval = 500): Promise<void> {
    await driver.wait(async function () {
        try {
            const debugBar = await DebugToolbar.create();
            await debugBar.disconnect();
            await driver.wait(until.elementIsNotVisible(debugBar), 10000);
            return true;
        } catch (err) {
            // Extra click to avoid the error: "Element is not clickable at point (x, y)"
            // Workaround for the issue: https://issues.redhat.com/browse/FUSETOOLS2-2100 
            await driver.actions().click().perform();
            return false;
        }
    }, 10000, undefined, interval);
}

/**
 * Click on button to kill running process in Terminal View.
 */
export async function killTerminal(): Promise<void> {
   await (await new BottomBarPanel().openTerminalView()).killTerminal();
}

/**
 * Adds a new key-value pair to a raw JSON string.
 * 
 * @param jsonStr The raw JSON string that will be modified.
 * @param key The new key to be added to the JSON object.
 * @param values An array of strings representing the values to be assigned to the new key.
 * @returns Updated JSON string with the new key-value pair added or Error.
 */
export function addNewItemToRawJson(jsonStr: string, key: string, values: string[]): string {
    try {
        // Parse the JSON string into an object
        let config = JSON.parse(jsonStr);

        // Add the new key-value pair
        config[key] = values;

        // Convert the object back to a JSON string
        const updatedJsonStr = JSON.stringify(config, null, 4); // Adds indentation

        return updatedJsonStr;
    } catch (error) {
        console.error("Error parsing or updating JSON:", error);
        return jsonStr; // Return the original JSON in case of error
    }
}

/**
 * Clear content in active terminal.
 */
export async function clearTerminal(): Promise<void> {
    await new BottomBarPanel().openTerminalView()
    await new Workbench().executeCommand('terminal: clear');
}
