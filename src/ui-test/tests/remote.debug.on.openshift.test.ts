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
import { ActivityBar, BottomBarPanel, Breakpoint, DebugView, EditorView, InputBox, SideBarView, TextEditor, VSBrowser, WebDriver } from "vscode-extension-tester";
import { assert } from 'chai';
import { addNewItemToRawJson, clearTerminal, deleteFolderContents, disconnectDebugger, executeCommand, killTerminal, waitUntilEditorIsOpened, waitUntilTerminalHasText } from '../utils';
import { DEMO_FILE, QUARKUS_ATTACH_DEBUGGER, QUARKUS_CREATE_COMMAND, QUARKUS_DIR, QUARKUS_PROJECT_FOLDER, SPRINGBOOT_ATTACH_DEBUGGER, SPRINGBOOT_CREATE_COMMAND, SPRINGBOOT_DIR, SPRINGBOOT_PROJECT_FOLDER } from '../variables';


describe('Remote debug on OpenShift', function () {
    this.timeout(200000);

    let driver: WebDriver;
    let textEditor: TextEditor;

    describe('Spring Boot project', function () {

        before(async function () {
            await prepareEnvironment('springboot', SPRINGBOOT_DIR);
        });

        after(async function () {
            await cleanUp(SPRINGBOOT_DIR);
        });

        it(`SpringBoot`, async function () {
            driver = VSBrowser.instance.driver;

            await createCamelRoute(driver, "Demo");
            await createProject(driver, SPRINGBOOT_CREATE_COMMAND)

            // open file
            await VSBrowser.instance.openResources(path.join(SPRINGBOOT_PROJECT_FOLDER, DEMO_FILE));

            // set breakpoint
            textEditor = new TextEditor();
            await driver.wait(async function () {
                return await textEditor.toggleBreakpoint(15);
            }, 5000);

            // open debug view
            const debugView = await openDebugView();

            // validate configuration and start debug
            assert.isTrue(await validateLaunchConfiguration(debugView, SPRINGBOOT_ATTACH_DEBUGGER), "Required configuration is not present in Debug View.");
            await startDebugSession(debugView, SPRINGBOOT_ATTACH_DEBUGGER);

            const terminalView = await new BottomBarPanel().openTerminalView();

            // check breakpoint was hit
            const breakpoint = await waitForBreakpointPause(driver, textEditor);
            assert.isTrue(await breakpoint.isPaused(), "Breakpoint is not paused.");
        });
    });

    describe('Quarkus project', function () {

        before(async function () {
            await prepareEnvironment('quarkus', QUARKUS_DIR);
        });

        after(async function () {
            await cleanUp(QUARKUS_DIR);
        });

        it(`Quarkus`, async function () {
            driver = VSBrowser.instance.driver;

            await createCamelRoute(driver, "Demo");
            await createProject(driver, QUARKUS_CREATE_COMMAND);

            // open file
            await VSBrowser.instance.openResources(path.join(QUARKUS_PROJECT_FOLDER, DEMO_FILE));

            // set breakpoint
            textEditor = new TextEditor();
            await driver.wait(async function () {
                return await textEditor.toggleBreakpoint(12);
            }, 5000);

            // open debug view
            const debugView = await openDebugView();

            // validate configuration and start debug
            assert.isTrue(await validateLaunchConfiguration(debugView, QUARKUS_ATTACH_DEBUGGER), "Required configuration is not present in Debug View.");
            await startDebugSession(debugView, QUARKUS_ATTACH_DEBUGGER);

            const terminalView = await new BottomBarPanel().openTerminalView();

            // check breakpoint was hit
            const breakpoint = await waitForBreakpointPause(driver, textEditor);
            assert.isTrue(await breakpoint.isPaused(), "Breakpoint is not paused.");
        });
    });

    /**
     * Prepares the test environment by opening a directory in the VSCode instance and clearing its contents.
     * 
     * @param directory - The name of the directory to be opened in the Explorer view.
     * @param directoryPath - The path of the directory to be cleared and opened in the Explorer view.
     */
    async function prepareEnvironment(directory: string, directoryPath: string): Promise<void> {
        driver = VSBrowser.instance.driver
        await VSBrowser.instance.openResources(directoryPath);
        await deleteFolderContents(directoryPath);
        await (await new ActivityBar().getViewControl('Explorer'))?.openView();
        await new SideBarView().getContent().getSection(directory);
        await workaround(driver);
    }

    /**
     * Cleans up the environment by disconnecting the debugger, closing views, killing terminals, and clearing the directory.
     * 
     * @param directoryPath - The path of the directory to be cleared.
     */
    async function cleanUp(directoryPath: string): Promise<void> {
        await disconnectDebugger(driver);
        await (await new ActivityBar().getViewControl('Run and Debug'))?.closeView();
        await killTerminal();
        await new EditorView().closeAllEditors();
        await deleteFolderContents(directoryPath);
    }
});


/**
 * Provide workaround for Language Support for Java issue.
 * https://github.com/redhat-developer/vscode-java/issues/3784
 * 
 * @param driver Active WebDriver isntance.
 */
async function workaround(driver: WebDriver): Promise<void> {
    await executeCommand('Preferences: Open Workspace Settings (JSON)');
    await waitUntilEditorIsOpened(driver, 'settings.json');
    const editor = new TextEditor();
    const newJson = addNewItemToRawJson(await editor.getText(), "java.project.sourcePaths", ["src/main/java"]);
    await editor.setText(newJson);
    await driver.wait(async () => {
        return await editor.isDirty() && (await editor.getText()).replace(/\s+/g, '') === newJson.replace(/\s+/g, '');
    }, 10000);
    await editor.save();
    await driver.wait(async () => {
        return !await editor.isDirty();
    }, 10000);
    await new EditorView().closeEditor("settings.json");
}

/**
 * Create Camel Route using Java DSL with specified name. 
 * 
 * @param driver The WebDriver instance to use.
 * @param filename Name of created Camel Route. 
 */
async function createCamelRoute(driver: WebDriver, filename: string): Promise<void> {
    await executeCommand('Camel: Create a Camel Route using Java DSL');
    let input: InputBox | undefined;
    await driver.wait(async function () {
        input = await InputBox.create();
        return (await input.isDisplayed());
    }, 30000);
    await input?.setText(filename);
    await input?.confirm();
    await waitUntilEditorIsOpened(driver, filename + '.java', 60000);
    await clearTerminal();
}

/**
 * Create project with required type and default name. 
 * 
 * @param driver The WebDriver instance to use.
 * @param command Command for project creating. 
 */
async function createProject(driver: WebDriver, command: string): Promise<void> {
    let input: InputBox | undefined;
    await executeCommand(command);
    await driver.wait(async function () {
        input = await InputBox.create();
        return (await input.isDisplayed());
    }, 30000);
    await input?.confirm(); // confirm name
    await waitUntilTerminalHasText(driver, ['Terminal will be reused by tasks, press any key to close it.']);
    await new EditorView().closeAllEditors();
}

/**
 * Opens the Debug view from the Activity Bar.
 * 
 * @returns A promise that resolves to the DebugView.
 */
async function openDebugView(): Promise<DebugView> {
    const btn = await new ActivityBar().getViewControl('Run');
    const debugView = (await btn?.openView()) as DebugView;
    return debugView;
}

/**
 * Validates if a specific launch configuration is present in the Debug view.
 * 
 * @param debugView The DebugView instance.
 * @param configName The name of the launch configuration to validate.
 * @returns A promise that resolves to true if the configuration is found, false otherwise.
 */
async function validateLaunchConfiguration(debugView: DebugView, configName: string): Promise<boolean> {
    const configs = await debugView.getLaunchConfigurations();
    return configs.includes(configName);
}

/**
 * Starts a debug session with the specified launch configuration.
 * 
 * @param debugView The DebugView instance.
 * @param configName The name of the launch configuration to start.
 */
async function startDebugSession(debugView: DebugView, configName: string): Promise<void> {
    await debugView.selectLaunchConfiguration(configName);
    await debugView.start();
}

/**
 * Get paused breakpoint with dynamic wait until previously paused breakpoint is really paused. 
 * 
 * @param driver The WebDriver instance to use.
 * 
 * @param textEditor The TextEditor where the breakpoint is expected.
 * @param timeout Maximum time to wait for the breakpoint pause. Default is 60 seconds.
 * @param interval The interval to check for the breakpoint pause. Default is 500ms.
 * @returns 
 */
async function waitForBreakpointPause(driver: WebDriver, textEditor: TextEditor, timeout: number = 60000, interval: number = 500): Promise<Breakpoint> {
    const terminalView = await new BottomBarPanel().openTerminalView();
    const breakpoint = await driver.wait<Breakpoint>(async () => {
        return await textEditor.getPausedBreakpoint();
    }, timeout, undefined, interval) as Breakpoint;
    return breakpoint;
}
